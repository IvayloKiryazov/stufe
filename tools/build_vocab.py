#!/usr/bin/env python3
"""Build a frequency-ordered vocabulary deck from open sources.

Takes the most frequent German nouns (FrequencyWords), keeps those with a known
gender (german-nouns), and pairs each with a short real example sentence and its
English translation (Tatoeba). The result is a cloze deck: the sentence has the
target noun blanked out.

To avoid the homographs a lowercased frequency list is full of, a sentence is
only accepted when the target noun is a capitalised word *preceded by a
determiner* (der/die/das, ein-, possessives, numbers...). That reliably picks
real noun phrases and rejects nominalised verbs ("das Ist") and pronouns.

Output: data/vocab_frequency.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from common import ROOT, WORD_RE, load_frequency, load_nouns, load_sentence_pairs

# frequency rank -> CEFR level (nouns only; curated content covers A1/A2)
BUCKETS = [
    (1500, "a2"),
    (3000, "b1"),
    (5000, "b2"),
    (8000, "c1"),
    (10**9, "c2"),
]

# function words that share a spelling with a rare noun (das Es, das Ich)
STOP = set(
    """ich du er sie es wir ihr man mich dich sich uns euch mir dir ihm ihnen
    wer was wem wen der die das den dem des ein eine einen einem einer eines
    kein keine keinen keiner und oder aber denn weil wenn als wie wo da so zu
    in an auf mit von bei nach aus vor fuer über unter zwischen durch gegen
    ohne um bis seit nicht nur auch schon noch immer sehr mehr hier dort jetzt
    dann ja nein doch wohl mal bitte danke""".split()
)

# determiners / quantifiers that introduce a noun phrase
DET = set(
    """der die das den dem des ein eine einen einem einer eines
    kein keine keinen keinem keiner keines
    mein meine meinen meinem meiner meines dein deine deinen deinem deiner
    deines sein seine seinen seinem seiner seines ihr ihre ihren ihrem ihrer
    ihres unser unsere unseren unserem unserer unseres euer eure euren eurem
    eurer eures Ihr Ihre Ihren Ihrem Ihrer Ihres
    dieser diese diesen diesem dieser dieses jener jene jenen jenem jener jenes
    jeder jede jeden jedem jeder jedes jede* welche welcher welches welchen
    welchem solche solcher solches solchen manche mancher manches vielen
    viele vieler aller alle allen allem alles einige einigen mehreren mehrere
    beiden beide zwei drei vier fünf sechs sieben acht neun zehn hundert
    tausend""".split()
)


def level_for_rank(rank: int) -> str:
    for limit, level in BUCKETS:
        if rank <= limit:
            return level
    return "c2"


def build_noun_index(pairs, max_len: int = 70):
    """lemma -> shortest sentence where the lemma is a determiner-led noun.

    Case-sensitive and skips sentence-initial tokens, so only clear noun-phrase
    occurrences are indexed.
    """
    index: dict[str, tuple[str, str, str]] = {}
    for de, en, attr in pairs:
        if len(de) > max_len:
            continue
        toks = [(m.group(0), m.start()) for m in WORD_RE.finditer(de)]
        for i, (tok, pos) in enumerate(toks):
            if pos == 0 or not tok[:1].isupper():
                continue
            prev = toks[i - 1][0].lower() if i > 0 else ""
            if prev not in DET:
                continue
            current = index.get(tok)
            if current is None or len(de) < len(current[0]):
                index[tok] = (de, en, attr)
    return index


def blank_sentence(sentence: str, surface: str):
    for m in re.finditer(r"\b" + re.escape(surface) + r"\b", sentence):
        if m.start() == 0:
            continue
        return sentence[: m.start()] + "___" + sentence[m.end():], m.group(0)
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, default=2500, help="max noun items")
    args = ap.parse_args()

    nouns = load_nouns()
    freq = load_frequency()
    pairs = load_sentence_pairs()
    if not nouns or not freq or not pairs:
        print("Missing sources. Run fetch_sources.py first.", file=sys.stderr)
        return 1

    print(f"nouns={len(nouns):,} freq={len(freq):,} pairs={len(pairs):,}")
    index = build_noun_index(pairs)
    print(f"noun-phrase index size={len(index):,}")

    items = []
    for rank, word in freq:
        if len(items) >= args.limit:
            break
        if word in STOP:
            continue
        noun = nouns.get(word) or nouns.get(word[:1].upper() + word[1:])
        if noun is None or len(noun.lemma) < 3:
            continue
        hit = index.get(noun.lemma)
        if hit is None:
            continue
        de, en, attr = hit
        blanked = blank_sentence(de, noun.lemma)
        if blanked is None:
            continue
        prompt, answer = blanked
        level = level_for_rank(rank)
        items.append(
            {
                "id": f"freq-{level}-{noun.lemma.lower()}",
                "level": level,
                "group": f"{level}-core",
                "groupName": "Core vocabulary (frequency)",
                "kind": "cloze",
                "intro": (
                    "High-frequency nouns in real sentences. Type the missing "
                    "word; the article in the hint tells you the gender."
                ),
                "prompt": prompt,
                "answer": answer,
                "alt": [],
                "en": en,
                "hint": f"{noun.article} {noun.lemma}",
                "note": f"Frequency rank {rank}",
                "attribution": attr,
            }
        )

    out = ROOT / "data" / "vocab_frequency.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(items):,} items -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
