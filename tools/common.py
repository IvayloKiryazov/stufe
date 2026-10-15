#!/usr/bin/env python3
"""Shared helpers for the Stufe pipeline: load sources, index sentences.

Kept dependency-free (standard library only) so the pipeline runs anywhere.
"""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"

GENUS_TO_ARTICLE = {"m": "der", "f": "die", "n": "das"}

# a token is a run of letters (incl. umlauts/ß) possibly with an internal hyphen
WORD_RE = re.compile(r"[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\-]*")


@dataclass
class Noun:
    lemma: str
    article: str
    plural: str  # full form, e.g. "die Häuser" or "" if unknown


def load_nouns(path: Path | None = None) -> dict[str, Noun]:
    """lemma (capitalised) -> Noun with article + plural, from nouns.csv."""
    path = path or RAW / "nouns.csv"
    out: dict[str, Noun] = {}
    if not path.exists():
        return out
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            lemma = (row.get("lemma") or "").strip()
            if not lemma:
                continue
            # gender may live in "genus" or one of the numbered fallback columns
            genus = ""
            for key in ("genus", "genus 1", "genus 2", "genus 3", "genus 4"):
                genus = (row.get(key) or "").strip()
                if genus:
                    break
            plural_form = (row.get("nominativ plural") or "").strip()
            if genus in GENUS_TO_ARTICLE:
                article = GENUS_TO_ARTICLE[genus]
            elif plural_form and plural_form == lemma:
                article = "die"  # plural-only noun (die Leute, die Eltern)
            else:
                continue  # gender unknown -> skip
            plural = f"die {plural_form}" if plural_form else ""
            # first occurrence wins; keep the most common spelling
            out.setdefault(lemma, Noun(lemma, article, plural))
    return out


def load_frequency(path: Path | None = None) -> list[tuple[int, str]]:
    """(rank, word) in descending frequency order, rank starting at 1."""
    path = path or RAW / "frequency.txt"
    out: list[tuple[int, str]] = []
    if not path.exists():
        return out
    with path.open(encoding="utf-8") as fh:
        for i, line in enumerate(fh, start=1):
            parts = line.split()
            if parts:
                out.append((i, parts[0]))
    return out


def load_sentence_pairs(path: Path | None = None) -> list[tuple[str, str, str]]:
    """(german, english, attribution) from the manythings Tatoeba export."""
    path = path or RAW / "deu.txt"
    out: list[tuple[str, str, str]] = []
    if not path.exists():
        return out
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            cols = line.rstrip("\n").split("\t")
            if len(cols) >= 2:
                en, de = cols[0].strip(), cols[1].strip()
                attr = cols[2].strip() if len(cols) > 2 else ""
                if de and en:
                    out.append((de, en, attr))
    return out


def build_sentence_index(
    pairs: list[tuple[str, str, str]],
    *,
    max_len: int = 70,
) -> dict[str, tuple[str, str, str]]:
    """token (case-sensitive) -> shortest (german, english, attribution).

    Only short-ish sentences are considered so examples stay A1-friendly, and
    only tokens that appear *mid-sentence* are indexed. Case is preserved on
    purpose: German nouns are capitalised, so looking up "Frage" finds the noun
    while "frage" would also match the verb. Sentence-initial tokens are
    skipped because there every word is capitalised.
    """
    index: dict[str, tuple[str, str, str]] = {}
    for de, en, attr in pairs:
        if len(de) > max_len:
            continue
        for m in WORD_RE.finditer(de):
            if m.start() == 0:
                continue  # sentence-initial token: capitalisation is ambiguous
            token = m.group(0)
            current = index.get(token)
            if current is None or len(de) < len(current[0]):
                index[token] = (de, en, attr)
    return index


def find_example(
    index: dict[str, tuple[str, str, str]],
    lemma: str,
    extra_forms: list[str] | None = None,
) -> tuple[str, str, str] | None:
    """Look up an example sentence for a lemma or any of its extra forms."""
    forms = [lemma] + list(extra_forms or [])
    for form in forms:
        hit = index.get(form)
        if hit:
            return hit
    return None


def blank_sentence(sentence: str, surface: str) -> tuple[str, str] | None:
    """Replace a mid-sentence occurrence of ``surface`` with ___ .

    Returns (prompt, answer) or None. Sentence-initial occurrences are skipped
    because capitalisation there is ambiguous.
    """
    for m in re.finditer(r"\b" + re.escape(surface) + r"\b", sentence):
        if m.start() == 0:
            continue
        return sentence[: m.start()] + "___" + sentence[m.end():], m.group(0)
    return None
