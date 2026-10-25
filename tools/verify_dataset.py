#!/usr/bin/env python3
"""Verify the committed deck is internally consistent and reproducible (#104).

A full rebuild needs the ~1 GB kaikki extract, so CI cannot rebuild the deck
from scratch. The per-level files ``data/items/<level>.json`` are canonical
(ADR-5); ``data/manifest.json`` records their counts and sha256. This check:

  * every level in ``data/levels.json`` has a matching item file
  * there are no stale per-level files
  * each file contains only items of its level and has a unique id set
  * every id referenced by ``levels.json`` exists, and every item is referenced
  * the manifest counts/hashes match the files
  * the total matches the sum of the files

Combined with the pinned sources in ``sources.lock.json`` (#103) this makes the
committed deck a reproducible artifact. Run in CI.
"""

from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def main() -> int:
    levels = json.loads((DATA / "levels.json").read_text(encoding="utf-8"))
    manifest_path = DATA / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else None

    errors: list[str] = []
    items_dir = DATA / "items"
    expected = {L["id"] for L in levels}
    on_disk = {p.stem for p in items_dir.glob("*.json")}
    if on_disk != expected:
        errors.append(f"per-level files {sorted(on_disk)} != expected {sorted(expected)}")

    by_level: dict[str, list[dict]] = {}
    all_ids: list[str] = []
    for level in sorted(expected):
        path = items_dir / f"{level}.json"
        if not path.exists():
            errors.append(f"missing {path.name}")
            continue
        text = path.read_bytes()
        try:
            arr = json.loads(text.decode("utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{path.name}: invalid JSON ({exc})")
            continue
        if not isinstance(arr, list):
            errors.append(f"{path.name}: expected a list")
            continue
        by_level[level] = arr
        all_ids.extend(i.get("id", "") for i in arr)
        wrong = [i.get("id") for i in arr if i.get("level") != level]
        if wrong:
            errors.append(f"{path.name}: {len(wrong)} item(s) with another level")
        if manifest:
            m = manifest.get("levels", {}).get(level)
            if not m:
                errors.append(f"manifest missing level {level}")
            else:
                digest = hashlib.sha256(text).hexdigest()
                if m.get("count") != len(arr):
                    errors.append(f"manifest count for {level}: {m.get('count')} != {len(arr)}")
                if m.get("sha256") != digest:
                    errors.append(f"manifest sha256 mismatch for {level}")

    dupes = [i for i, n in Counter(all_ids).items() if n > 1]
    if dupes:
        errors.append(f"{len(dupes)} duplicate id(s): {dupes[:5]}")

    referenced: list[str] = []
    for L in levels:
        for g in L["groups"]:
            if not g.get("items"):
                errors.append(f"empty group {L['id']}/{g.get('id')}")
            referenced.extend(g.get("items", []))
    missing = sorted(set(referenced) - set(all_ids))
    unreferenced = sorted(set(all_ids) - set(referenced))
    if missing:
        errors.append(f"{len(missing)} level reference(s) missing from item files: {missing[:5]}")
    if unreferenced:
        errors.append(f"{len(unreferenced)} item(s) not referenced by levels.json: {unreferenced[:5]}")
    if len(referenced) != len(set(referenced)):
        errors.append("levels.json contains duplicate item references")
    if manifest and manifest.get("total") != len(all_ids):
        errors.append(f"manifest total {manifest.get('total')} != {len(all_ids)}")

    if errors:
        for e in errors:
            print("FAIL:", e, file=sys.stderr)
        return 1

    print(
        f"OK: {len(all_ids):,} items across {len(expected)} level files, "
        "unique ids, all references resolve, manifest matches"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
