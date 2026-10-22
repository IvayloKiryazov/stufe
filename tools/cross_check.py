#!/usr/bin/env python3
"""Cross-check curated noun gender/plural against a second source (#69, #92).

Compares the german-nouns values used for the curated deck against the
Wiktionary reference in data/reference_nouns.json. Article (gender)
disagreements are errors; plural disagreements are warnings. Run in CI.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from common import ROOT


def main() -> int:
    ref_path = ROOT / "data" / "reference_nouns.json"
    items_path = ROOT / "data" / "items.json"
    if not ref_path.exists():
        print("No reference; run build_reference.py first.", file=sys.stderr)
        return 1

    ref = json.loads(ref_path.read_text(encoding="utf-8"))
    items = json.loads(items_path.read_text(encoding="utf-8"))

    article_errors: list[tuple] = []
    plural_warnings: list[tuple] = []
    for it in items:
        if it["id"].startswith("freq-"):  # auto deck is from kaikki already
            continue
        if it["kind"] == "gender":
            parts = (it.get("de") or "").split(" ", 1)
            if len(parts) != 2:
                continue
            article, word = parts
            r = ref.get(word)
            if r and r["article"] and r["article"] != article:
                article_errors.append((it["id"], article, r["article"]))
        elif it["kind"] == "plural":
            parts = (it.get("prompt") or "").split(" ", 1)
            if len(parts) != 2:
                continue
            word = parts[1]
            r = ref.get(word)
            if r and r["plural"]:
                expected = f"die {r['plural']}"
                if it.get("answer") and it["answer"] != expected:
                    plural_warnings.append((it["id"], it["answer"], expected))

    for item_id, got, want in plural_warnings[:50]:
        print(f"warn  {item_id}: plural {got!r} vs Wiktionary {want!r}")
    for item_id, got, want in article_errors[:50]:
        print(f"ERROR {item_id}: article {got!r} vs Wiktionary {want!r}")

    print(
        f"cross-check: {len(article_errors)} article error(s), "
        f"{len(plural_warnings)} plural warning(s)"
    )
    return 1 if article_errors else 0


if __name__ == "__main__":
    sys.exit(main())
