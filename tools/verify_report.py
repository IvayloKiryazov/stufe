#!/usr/bin/env python3
"""Human-readable deck report for verification (issues #66 / #67 / #70).

Prints field coverage, duplicate ids, gloss sanity and a random sample so a
human (or an online translator) can spot-check. Report only — it always exits 0;
`tools/cross_check.py` is the failing gate. Per the agreed policy: **report
first, then fix.**
"""

from __future__ import annotations

import json
import random
import re
import sys
from collections import Counter

from common import ROOT

META_RE = re.compile(
    r"^(inflection of|form of|plural of|genitive of|dative of|accusative of|"
    r"comparative of|superlative of|agent noun of|past participle of|"
    r"present participle of|strong|weak|mixed|first-person|second-person|"
    r"third-person|nominative|singular|plural)\b",
    re.IGNORECASE,
)


def main() -> int:
    items = json.loads((ROOT / "data" / "items.json").read_text(encoding="utf-8"))
    vocab = [i for i in items if i["kind"] in ("noun", "verb", "adj")]
    verbs = [i for i in items if i["kind"] == "verb"]
    auto = [i for i in vocab if i["id"].startswith("freq-")]

    print(f"# Deck report\n\nTotal items: {len(items):,}\n")
    print("By kind: ", dict(sorted(Counter(i["kind"] for i in items).items())))
    print("By level:", dict(sorted(Counter(i["level"] for i in items).items())))

    def cov(field: str, arr: list[dict]) -> str:
        have = sum(1 for i in arr if i.get(field))
        return f"{have}/{len(arr)} ({round(100 * have / max(1, len(arr)))}%)"

    print("\n## Field coverage (vocabulary)")
    for field in ("ipa", "audio", "examples", "source", "mnemonic"):
        print(f"- {field}: {cov(field, vocab)}")
    print(f"- conjugation (verbs): {cov('conjugation', verbs)}")

    duplicates = [k for k, v in Counter(i["id"] for i in items).items() if v > 1]
    print(f"\n## Duplicate ids: {len(duplicates)}")

    empty_gloss = [i["id"] for i in vocab if not (i.get("en") or "").strip()]
    meta_gloss = [i["id"] for i in vocab if META_RE.match((i.get("en") or "").strip())]
    print(f"## Empty glosses: {len(empty_gloss)} · meta-glosses: {len(meta_gloss)}")

    no_rank = [i["id"] for i in auto if "freqRank" not in i]
    print(f"## Auto items without freqRank: {len(no_rank)}")

    sample_n = 20
    if "--sample" in sys.argv:
        sample_n = int(sys.argv[sys.argv.index("--sample") + 1])
    random.seed(1)
    print(f"\n## Sample ({sample_n}) — sanity-check these with a translator")
    for i in random.sample(vocab, min(sample_n, len(vocab))):
        print(f"- [{i['level']}] {i.get('de', '')} — {i.get('en', '')}  ({i['id']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
