#!/usr/bin/env python3
"""Build a POS-aware frequency deck from the kaikki German dictionary extract.

Unlike the old lowercased-frequency approach, every item here is confirmed to
be a noun (``pos == "noun"``) by Wiktionary, so nominalised verbs ("das Ist")
and pronoun homographs never become cards. Each item carries the article, the
plural, an English gloss and an example sentence with its translation.

Output: data/vocab_frequency.json (merged by build_dataset.py --frequency).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from common import (
    ROOT,
    build_sentence_index,
    find_example,
    load_frequency,
    load_sentence_pairs,
)

GENUS = {"m": "der", "f": "die", "n": "das"}
WIKT_ATTR = "Wiktionary (CC BY-SA 4.0)"

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
    dann ja nein doch wohl mal bitte danke
    etwas nichts alles jemand niemand
    heute gestern zurück vorbei hallo tschüss servus moin
    soll muss kann darf will mag weiß gut los habe hast""".split()
)


def level_for_rank(rank: int) -> str:
    for limit, level in BUCKETS:
        if rank <= limit:
            return level
    return "c2"


def _gender(entry: dict) -> str | None:
    for ht in entry.get("head_templates", []):
        if str(ht.get("name", "")).startswith("de-noun"):
            arg1 = str((ht.get("args") or {}).get("1", ""))
            code = arg1.split(",")[0].strip()[:1]
            if code in GENUS:
                return GENUS[code]
    return None


def _plural(entry: dict) -> str:
    for f in entry.get("forms", []):
        tags = f.get("tags") or []
        if "plural" in tags and "definite" not in tags and f.get("form"):
            return f["form"]
    return ""


def _gloss_and_example(entry: dict) -> tuple[str, tuple[str, str] | None]:
    gloss = ""
    example = None
    for sense in entry.get("senses", []):
        gl = sense.get("glosses") or []
        if gl and not gloss:
            gloss = gl[0]
        for ex in sense.get("examples") or []:
            if ex.get("type") == "quotation":
                continue
            text = ex.get("text")
            translation = ex.get("translation") or ex.get("english")
            if text and translation and len(text) <= 90 and "[...]" not in text:
                example = (text, translation)
                break
        if example:
            break
    return gloss, example


def _is_derived(entry: dict) -> bool:
    """True for gerunds / nominalised verbs (das Haben, das Sein) we don't want."""
    for sense in entry.get("senses", []):
        for gloss in sense.get("glosses") or []:
            if "gerund of" in gloss.lower():
                return True
        for cat in sense.get("categories") or []:
            if cat.get("name") == "German deverbals":
                return True
    return False


def extract_noun(entry: dict) -> dict | None:
    """Return {word, article, plural, gloss, example} for a noun entry, else None."""
    if entry.get("pos") != "noun":
        return None
    word = entry.get("word") or ""
    article = _gender(entry)
    if not word or article is None:
        return None
    gloss, example = _gloss_and_example(entry)
    if not gloss or _is_derived(entry):
        return None
    return {
        "word": word,
        "article": article,
        "plural": _plural(entry),
        "gloss": gloss,
        "example": example,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, default=2500, help="max noun items")
    ap.add_argument("--scan", type=int, default=20000, help="frequency words to consider")
    ap.add_argument("--kaikki", type=Path, default=ROOT / "data" / "raw" / "kaikki-de.jsonl")
    args = ap.parse_args()

    if not args.kaikki.exists():
        print("Missing kaikki extract. Run fetch_kaikki.py first.", file=sys.stderr)
        return 1

    freq = load_frequency()
    candidates = set()
    for _rank, word in freq[: args.scan]:
        if len(word) >= 3 and word not in STOP:
            candidates.add(word[:1].upper() + word[1:])
    print(f"frequency candidates: {len(candidates):,}")

    nouns: dict[str, dict] = {}
    with args.kaikki.open(encoding="utf-8") as fh:
        for line in fh:
            if '"pos": "noun"' not in line:
                continue
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            word = entry.get("word")
            if word in candidates and word not in nouns:
                info = extract_noun(entry)
                if info:
                    nouns[word] = info
    print(f"noun entries matched: {len(nouns):,}")

    tatoeba = build_sentence_index(load_sentence_pairs())

    items = []
    for rank, word in freq:
        if len(items) >= args.limit:
            break
        if word in STOP or len(word) < 3:
            continue
        info = nouns.get(word[:1].upper() + word[1:])
        if not info:
            continue
        plural = f"die {info['plural']}" if info["plural"] and info["plural"] != info["word"] else ""
        if info["example"]:
            sentence_de, sentence_en, attr = info["example"][0], info["example"][1], WIKT_ATTR
        else:
            hit = find_example(tatoeba, info["word"])
            if hit:
                sentence_de, sentence_en, attr = hit
            else:
                sentence_de, sentence_en, attr = "", "", ""
        level = level_for_rank(rank)
        item = {
            "id": f"freq-{level}-{word}",
            "level": level,
            "group": f"{level}-core",
            "groupName": "Core vocabulary (frequency)",
            "kind": "noun",
            "intro": (
                "High-frequency nouns with their article and plural. Produce the "
                "noun with its article, then check the example sentence."
            ),
            "de": f"{info['article']} {info['word']}",
            "en": info["gloss"],
            "plural": plural,
            "sentence_de": sentence_de,
            "sentence_en": sentence_en,
            "note": f"Frequency rank {rank}",
        }
        if attr:
            item["attribution"] = attr
        items.append(item)

    out = ROOT / "data" / "vocab_frequency.json"
    out.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    with_ex = sum(1 for i in items if i["sentence_de"])
    print(f"wrote {len(items):,} items ({with_ex:,} with an example sentence) -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
