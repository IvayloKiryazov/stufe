#!/usr/bin/env python3
"""Validate the generated deck; exit non-zero on hard errors.

Run in CI after build_dataset.py (or against the committed data/).

    python3 tools/check_content.py

Errors (fail): duplicate ids, cloze without exactly one blank/answer, noun
without an article, empty/derived gloss, verb without principal parts, broken
level references.
Warnings (report only): nouns without a plural, items without an example,
duplicate surface forms within a level.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLE = re.compile(r"^(der|die|das) ")

from common import load_items  # noqa: E402


def main() -> int:
    items = load_items()
    levels = json.loads((ROOT / "data" / "levels.json").read_text(encoding="utf-8"))

    errors: list[str] = []
    warnings: list[str] = []

    ids = [i["id"] for i in items]
    for dup, n in Counter(ids).items():
        if n > 1:
            errors.append(f"duplicate id: {dup} ({n}x)")

    by_id = {i["id"]: i for i in items}
    for level in levels:
        for group in level["groups"]:
            if not group["items"]:
                errors.append(f"empty group: {level['id']}/{group['id']}")
            for iid in group["items"]:
                if iid not in by_id:
                    errors.append(f"missing item ref: {iid}")

    for i in items:
        kind = i["kind"]
        gloss = (i.get("en") or "").strip()
        if not gloss:
            errors.append(f"{i['id']}: empty gloss")
        elif gloss.lower().startswith("gerund of"):
            errors.append(f"{i['id']}: derived gloss '{gloss}'")
        if kind == "noun":
            if not ARTICLE.match(i.get("de") or ""):
                errors.append(f"{i['id']}: noun without article ({i.get('de')!r})")
            if not i.get("plural"):
                warnings.append(f"{i['id']}: no plural ({i.get('de')})")
        elif kind == "verb":
            if not (i.get("forms") or "").strip():
                errors.append(f"{i['id']}: verb without principal parts")
        elif kind == "cloze":
            prompt = i.get("prompt") or ""
            if prompt.count("___") != 1:
                errors.append(f"{i['id']}: cloze needs exactly one ___")
            if not (i.get("answer") or "").strip():
                errors.append(f"{i['id']}: cloze without an answer")
        if kind in ("noun", "verb", "adj") and not i.get("sentence_de"):
            warnings.append(f"{i['id']}: no example sentence")

    # duplicate surface forms within a level (often the same word twice)
    for level in levels:
        seen: dict[str, str] = {}
        for group in level["groups"]:
            for iid in group["items"]:
                it = by_id.get(iid)
                if not it:
                    continue
                key = (it.get("de") or "").lower()
                if key and key in seen:
                    warnings.append(f"{level['id']}: duplicate '{it.get('de')}' ({seen[key]} & {iid})")
                seen[key] = iid

    print(f"items: {len(items)}  levels: {len(levels)}")
    print(f"errors: {len(errors)}  warnings: {len(warnings)}")
    for e in errors[:40]:
        print("  ERROR", e)
    for w in warnings[:15]:
        print("  warn ", w)
    if len(warnings) > 15:
        print(f"  … and {len(warnings) - 15} more warnings")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
