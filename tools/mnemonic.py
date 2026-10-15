#!/usr/bin/env python3
"""Rule-based gender hints ("mnemonics") for German nouns.

German gender is mostly arbitrary, but many endings predict it. This returns a
short hint for the article based on the word's ending, or a fallback that tells
the learner to memorise it. It is a heuristic, not a rule of law.
"""

from __future__ import annotations

FEMININE = ["ung", "heit", "keit", "schaft", "ion", "tät", "ität", "ie", "ei", "ik", "enz", "anz", "ur", "ade", "age"]
NEUTER = ["chen", "lein", "ment", "um", "ma", "nis", "tum", "ett", "ial"]
MASCULINE = ["ling", "ig", "ich", "ismus", "or", "ant", "ent", "är", "eur", "ist", "ismus"]

BY_ARTICLE = {"die": FEMININE, "das": NEUTER, "der": MASCULINE}


def _ending(word: str, suffixes: list[str]) -> str | None:
    low = word.lower()
    # longest suffix wins so -heit beats -t, -chen beats -en
    for s in sorted(suffixes, key=len, reverse=True):
        if low.endswith(s):
            return s
    return None


def gender_mnemonic(word: str, article: str) -> str:
    if article not in BY_ARTICLE:
        return ""
    suffix = _ending(word, BY_ARTICLE[article])
    if suffix:
        return f"{article}: words ending in -{suffix} are usually {article}."
    return f"{article}: no tell-tale ending — just memorise \"{article} {word}\"."
