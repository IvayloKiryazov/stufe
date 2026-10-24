#!/usr/bin/env python3
"""Map frequency-ranked words to CEFR levels (issue #71).

There is **no official machine-readable German CEFR wordlist** (the Goethe
Wortlisten are PDFs). This assigns CEFR bands by **frequency**, calibrated to
the sizes of the official lists, and buckets everything past C2 as ``x``
("extra" — still frequency-tagged). It is deliberately an approximation, not
the official list; a Goethe A1-B1 list can replace/extend it later by editing
this file.

Output: data/cefr.json  (word -> a1|a2|b1|b2|c1|c2|x)
"""

from __future__ import annotations

import json
import sys
from collections import Counter

from common import ROOT, load_frequency

# cumulative band sizes, roughly matching the official list sizes
BANDS = [("a1", 650), ("a2", 650), ("b1", 1200), ("b2", 2500), ("c1", 3000), ("c2", 8000)]


def main() -> int:
    freq = load_frequency()
    if not freq:
        print("Missing frequency list. Run fetch_sources.py first.", file=sys.stderr)
        return 1

    bounds: list[tuple[int, str]] = []
    cumulative = 0
    for level, size in BANDS:
        cumulative += size
        bounds.append((cumulative, level))

    out: dict[str, str] = {}
    for rank, word in freq:
        level = "x"
        for bound, lvl in bounds:
            if rank <= bound:
                level = lvl
                break
        if level != "x":  # words past C2 are simply absent (the "extra" case)
            out.setdefault(word, level)

    path = ROOT / "data" / "cefr.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(out):,} entries -> {path}; by level:", dict(sorted(Counter(out.values()).items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
