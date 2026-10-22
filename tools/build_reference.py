#!/usr/bin/env python3
"""Build a second-source reference for nouns from Wiktionary (#69, #92).

The curated nouns get their gender/plural from german-nouns; the auto deck from
kaikki. This scans the Wiktionary extract for the curated noun lemmas and
records their article + plural so the two sources can be cross-checked.

Output: data/reference_nouns.json  (lemma -> {article, plural})
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from build_frequency import _gender, _plural
from common import ROOT


def curated_lemmas() -> set[str]:
    lemmas: set[str] = set()
    for path in sorted((ROOT / "content" / "nouns").glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for group in doc["groups"]:
            for entry in group["words"]:
                lemmas.add(entry[0])
    return lemmas


def main() -> int:
    kaikki = ROOT / "data" / "raw" / "kaikki-de.jsonl"
    if not kaikki.exists():
        print("Missing kaikki extract. Run fetch_kaikki.py first.", file=sys.stderr)
        return 1

    wanted = curated_lemmas()
    ref: dict[str, dict] = {}
    with kaikki.open(encoding="utf-8") as fh:
        for line in fh:
            if '"pos": "noun"' not in line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            word = entry.get("word")
            if word in wanted and word not in ref:
                article = _gender(entry)
                if article:
                    ref[word] = {"article": article, "plural": _plural(entry)}

    out = ROOT / "data" / "reference_nouns.json"
    out.write_text(json.dumps(ref, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"reference nouns: {len(ref)}/{len(wanted)} -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
