#!/usr/bin/env python3
"""Pinned upstream sources + integrity checks (see issue #103).

`sources.lock.json` records the URL, license and sha256 of every raw input that
produced the committed deck. The fetch scripts read URLs from the lock and
verify downloads against it, so a rebuild either reproduces the deck or fails
loudly when upstream changed.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOCK_PATH = HERE / "sources.lock.json"


def load_lock() -> dict[str, dict]:
    return json.loads(LOCK_PATH.read_text(encoding="utf-8"))["sources"]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify(path: Path, name: str, lock: dict[str, dict] | None = None) -> bool:
    """Check a raw file against the lock. Returns True if it matches or is unlocked."""
    entry = (lock or load_lock()).get(name)
    if not entry:
        print(f"  ? {name}: not in sources.lock.json (unverified)")
        return True
    if not path.exists():
        print(f"  ! {name}: missing")
        return False
    got = sha256_file(path)
    if got == entry["sha256"]:
        print(f"  = {name}: OK ({got[:12]}…)")
        return True
    print(f"  ! {name}: sha256 mismatch\n      expected {entry['sha256']}\n      got      {got}")
    return False
