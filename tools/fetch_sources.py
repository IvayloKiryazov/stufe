#!/usr/bin/env python3
"""Download the upstream open-data sources used to build the deck.

Everything lands in ``data/raw/`` (gitignored). Re-running is cheap: files
that already exist are skipped unless ``--force`` is given.

Sources
-------
frequency  hermitdave/FrequencyWords (MIT)   word frequency, OpenSubtitles 2018
nouns      gambolputty/german-nouns (CC BY-SA 4.0)  gender + plural from Wiktionary
sentences  Tatoeba via manythings.org (CC BY 2.0 FR)  de<->en sentence pairs
"""

from __future__ import annotations

import argparse
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"

UA = "Mozilla/5.0 (compatible; stufe-pipeline/1.0; +https://github.com/)"

FREQUENCY_URL = (
    "https://raw.githubusercontent.com/hermitdave/FrequencyWords/"
    "master/content/2018/de/de_full.txt"
)
NOUNS_URL = (
    "https://raw.githubusercontent.com/gambolputty/german-nouns/"
    "main/german_nouns/nouns.csv"
)
SENTENCES_URL = "https://www.manythings.org/anki/deu-eng.zip"


def download(url: str, dest: Path, force: bool) -> None:
    if dest.exists() and not force:
        print(f"  = {dest.name} (exists, skipping)")
        return
    print(f"  + {dest.name} <- {url}")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    dest.write_bytes(data)
    print(f"    {len(data):,} bytes")


def fetch_sentences(force: bool) -> None:
    dest = RAW / "deu.txt"
    if dest.exists() and not force:
        print(f"  = {dest.name} (exists, skipping)")
        return
    print(f"  + {dest.name} <- {SENTENCES_URL}")
    req = urllib.request.Request(SENTENCES_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        blob = resp.read()
    with zipfile.ZipFile(io.BytesIO(blob)) as zf:
        member = next(n for n in zf.namelist() if n.endswith("deu.txt"))
        text = zf.read(member)
    dest.write_bytes(text)
    print(f"    {len(text):,} bytes")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true", help="re-download existing files")
    args = ap.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    print("Fetching sources into", RAW)
    download(FREQUENCY_URL, RAW / "frequency.txt", args.force)
    download(NOUNS_URL, RAW / "nouns.csv", args.force)
    fetch_sentences(args.force)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
