#!/usr/bin/env python3
"""Download the kaikki.org German dictionary extract (~1.1 GB, JSONL).

This is a machine-readable Wiktionary extract used to build the POS-aware
frequency deck: it confirms a word is a noun and gives gender, plural, English
glosses and example sentences with translations.

License: Wiktionary content, CC BY-SA 4.0.
"""

from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

from sources import load_lock, verify

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
NAME = "kaikki-de.jsonl"
URL = load_lock()[NAME]["url"]
UA = "Mozilla/5.0 (compatible; stufe-pipeline/1.0)"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--check", action="store_true", help="verify data/raw/ against the lock, no download")
    args = ap.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    dest = RAW / NAME
    if args.check:
        print("Verifying data/raw/ against sources.lock.json:")
        return 0 if verify(dest, NAME) else 1
    if dest.exists() and not args.force:
        print(f"= {dest} exists ({dest.stat().st_size:,} bytes), skipping")
        return 0 if verify(dest, NAME) else 1

    print(f"+ {dest.name} <- {URL}")
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=600) as resp, dest.open("wb") as out:
        while True:
            chunk = resp.read(1 << 20)
            if not chunk:
                break
            out.write(chunk)
    print(f"  {dest.stat().st_size:,} bytes")
    if not verify(dest, NAME):
        print("ERROR: kaikki does not match the lock (upstream changed?).", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
