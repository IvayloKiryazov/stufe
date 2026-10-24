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
    # No useful rule: return nothing rather than a "just memorise" filler (#129).
    return ""


# common separable prefixes (trennbare Verben)
SEPARABLE = [
    "auf", "aus", "an", "ein", "mit", "vor", "zu", "weg", "zurück", "zusammen",
    "ab", "bei", "nach", "her", "hin", "los", "fest", "frei", "hoch", "teil",
    "wahr", "wieder", "durch", "über", "unter", "um", "voll",
]


def verb_hint(word: str, forms: str) -> str:
    """A conservative hint for a verb, from its principal parts (#83).

    Returns "" when there is nothing reliable to say (so no filler).
    """
    parts = [p.strip() for p in (forms or "").split(",") if p.strip()]
    if not parts:
        return ""
    participle = parts[-1]
    for prefix in sorted(SEPARABLE, key=len, reverse=True):
        if word.startswith(prefix) and len(word) > len(prefix) + 1 and participle.startswith(prefix + "ge"):
            return f"Separable (trennbar): the {prefix}- prefix goes to the end; participle {participle}."
    if participle.endswith("en"):
        return "Strong (irregular) verb — learn its forms by heart."
    return ""
