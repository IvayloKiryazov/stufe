#!/usr/bin/env python3
"""Verify the committed deck is internally consistent and reproducible (#104).

A full rebuild needs the ~1 GB kaikki extract, so CI cannot rebuild the deck
from scratch. Instead this checks the derived artifacts against the canonical
``data/items.json``:

  * every level in ``data/levels.json`` has a matching ``data/items/<level>.json``
  * that file is exactly ``items.json`` filtered to the level, in the same order
  * there are no stale per-level files

Combined with the pinned sources in ``sources.lock.json`` (#103) this makes the
committed deck a reproducible artifact. Run in CI.
"""

from __future__ import annotations

import json
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def main() -> int:
    items = json.loads((DATA / "items.json").read_text(encoding="utf-8"))
    levels = json.loads((DATA / "levels.json").read_text(encoding="utf-8"))

    grouped: "OrderedDict[str, list[dict]]" = OrderedDict((L["id"], []) for L in levels)
    for it in items:
        grouped.setdefault(it["level"], []).append(it)

    errors: list[str] = []
    items_dir = DATA / "items"
    expected = {lvl for lvl, arr in grouped.items() if arr}
    on_disk = {p.stem for p in items_dir.glob("*.json")}
    if on_disk != expected:
        errors.append(f"per-level files {sorted(on_disk)} != expected {sorted(expected)}")

    for lvl, arr in grouped.items():
        if not arr:
            continue
        path = items_dir / f"{lvl}.json"
        if not path.exists():
            errors.append(f"missing {path.name}")
            continue
        if json.loads(path.read_text(encoding="utf-8")) != arr:
            errors.append(f"{path.name} is not items.json split for '{lvl}'")

    if errors:
        for e in errors:
            print("FAIL:", e, file=sys.stderr)
        return 1

    print(
        f"OK: {len(items):,} items across {len(expected)} level files, "
        "consistent with data/items.json"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
