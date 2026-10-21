#!/usr/bin/env python3
"""Extract compact verb conjugations for the curated verbs from kaikki.

For every verb in content/verbs/*.json it pulls the present tense (all six
persons), the preterite (3rd person singular) and the past participle from the
Wiktionary extract, and writes data/conjugations.json.

Output: data/conjugations.json  (consumed by build_dataset.py)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from common import ROOT

PERSONS = [
    ("first-person", "singular"),
    ("second-person", "singular"),
    ("third-person", "singular"),
    ("first-person", "plural"),
    ("second-person", "plural"),
    ("third-person", "plural"),
]


def target_verbs() -> set[str]:
    verbs = set()
    for path in sorted((ROOT / "content" / "verbs").glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for group in doc["groups"]:
            for entry in group["words"]:
                word = entry[0]
                verbs.add(word.replace("sich ", "").strip())
    # the whole frequency verb deck too (#80)
    freq = ROOT / "data" / "vocab_frequency.json"
    if freq.exists():
        for it in json.loads(freq.read_text(encoding="utf-8")):
            if it.get("kind") == "verb" and it.get("de"):
                verbs.add(it["de"].replace("sich ", "").strip())
    return verbs


def extract_conjugation(entry: dict) -> dict | None:
    present: dict[tuple[str, str], str] = {}
    preterite = ""
    participle = ""
    for f in entry.get("forms", []):
        tags = set(f.get("tags") or [])
        form = f.get("form")
        if not form or "multiword-construction" in tags:
            continue
        if "subjunctive" in tags or "imperative" in tags:
            continue
        if "indicative" in tags and "present" in tags:
            for person, number in PERSONS:
                if person in tags and number in tags:
                    present.setdefault((person, number), form)
        if "preterite" in tags and "indicative" in tags:
            if "third-person" in tags and "singular" in tags:
                preterite = preterite or form
        if "participle" in tags and "past" in tags:
            participle = participle or form
    if len(present) < 6:
        return None
    return {
        "present": [present[p] for p in PERSONS],
        "preterite": preterite,
        "participle": participle,
    }


def main() -> int:
    kaikki = ROOT / "data" / "raw" / "kaikki-de.jsonl"
    if not kaikki.exists():
        print("Missing kaikki extract. Run fetch_kaikki.py first.", file=sys.stderr)
        return 1

    wanted = target_verbs()
    print(f"target verbs: {len(wanted)}")

    found: dict[str, dict] = {}
    with kaikki.open(encoding="utf-8") as fh:
        for line in fh:
            if '"pos": "verb"' not in line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            word = entry.get("word")
            if word in wanted and word not in found:
                conj = extract_conjugation(entry)
                if conj:
                    found[word] = conj

    out = ROOT / "data" / "conjugations.json"
    out.write_text(json.dumps(found, ensure_ascii=False, indent=1), encoding="utf-8")
    missing = sorted(wanted - set(found))
    print(f"wrote {len(found)} conjugations -> {out}")
    if missing:
        print(f"no conjugation found for: {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
