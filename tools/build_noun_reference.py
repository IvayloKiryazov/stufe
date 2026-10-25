#!/usr/bin/env python3
"""Build a compact german-nouns reference for cross-checking the auto deck.

The raw german-nouns CSV is not committed (it is a build input), so CI cannot
run the auto-noun cross-check from it. This writes only the article/plural for
the noun lemmas that actually appear in the deck, which is small enough to
commit.

Output: data/reference_nouns_german.json  (lemma -> {article, plural})
"""

from __future__ import annotations

import json

from common import ROOT, load_items, load_nouns


def main() -> int:
    nouns = load_nouns()
    items = load_items()
    wanted: set[str] = set()
    for it in items:
        if it.get("kind") != "noun":
            continue
        parts = (it.get("de") or "").split(" ", 1)
        if len(parts) == 2:
            wanted.add(parts[1])

    ref = {
        word: {"article": nouns[word].article, "plural": nouns[word].plural}
        for word in sorted(wanted)
        if word in nouns
    }
    out = ROOT / "data" / "reference_nouns_german.json"
    out.write_text(json.dumps(ref, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"german-nouns reference: {len(ref)}/{len(wanted)} -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
