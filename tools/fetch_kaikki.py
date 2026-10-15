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

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
URL = "https://kaikki.org/dictionary/German/kaikki.org-dictionary-German.jsonl"
UA = "Mozilla/5.0 (compatible; stufe-pipeline/1.0)"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    dest = RAW / "kaikki-de.jsonl"
    if dest.exists() and not args.force:
        print(f"= {dest} exists ({dest.stat().st_size:,} bytes), skipping")
        return 0

    print(f"+ {dest.name} <- {URL}")
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=600) as resp, dest.open("wb") as out:
        while True:
            chunk = resp.read(1 << 20)
            if not chunk:
                break
            out.write(chunk)
    print(f"  {dest.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
