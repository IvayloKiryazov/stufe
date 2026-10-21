#!/usr/bin/env python3
"""Build a word -> IPA map for the curated vocabulary (issue #81).

The frequency deck gets its IPA from build_frequency.py, but curated nouns and
verbs never did (0/263 had IPA). This scans the Wiktionary extract once for the
curated headwords and writes data/ipa.json, which build_dataset.py merges into
any vocabulary item that is still missing IPA.

Output: data/ipa.json  (word -> IPA string)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from build_frequency import _ipa
from common import ROOT


def target_words() -> set[str]:
    words: set[str] = set()
    for path in sorted((ROOT / "content" / "nouns").glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for group in doc["groups"]:
            for entry in group["words"]:
                words.add(entry[0])
    for path in sorted((ROOT / "content" / "verbs").glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for group in doc["groups"]:
            for entry in group["words"]:
                words.add(entry[0].replace("sich ", "").strip())
    return words


def main() -> int:
    kaikki = ROOT / "data" / "raw" / "kaikki-de.jsonl"
    if not kaikki.exists():
        print("Missing kaikki extract. Run fetch_kaikki.py first.", file=sys.stderr)
        return 1

    wanted = target_words()
    print(f"target words: {len(wanted)}")

    found: dict[str, str] = {}
    with kaikki.open(encoding="utf-8") as fh:
        for line in fh:
            if '"sounds"' not in line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            word = entry.get("word")
            if word in wanted and word not in found:
                ipa = _ipa(entry)
                if ipa:
                    found[word] = ipa

    out = ROOT / "data" / "ipa.json"
    out.write_text(json.dumps(found, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(found)} IPA entries -> {out}")
    missing = sorted(wanted - set(found))
    if missing:
        print(f"no IPA for {len(missing)} word(s): {', '.join(missing[:20])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
