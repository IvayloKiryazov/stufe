#!/usr/bin/env python3
"""Build a POS-aware frequency deck (nouns, verbs, adjectives) from kaikki.

Every item is confirmed by Wiktionary, so homographs never become cards. Each
item carries an English gloss, IPA and an example sentence with translation;
verbs also get principal parts and adjectives their comparison forms.

Output: data/vocab_frequency.json (merged by build_dataset.py).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from build_conjugations import extract_conjugation
from common import ROOT, build_sentence_index, find_example, load_frequency, load_sentence_pairs

GENUS = {"m": "der", "f": "die", "n": "das"}
WIKT_ATTR = "Wiktionary (CC BY-SA 4.0)"
LEVELS = ["a2", "b1", "b2", "c1", "c2"]

# function words that share a spelling with a rare noun (das Es, das Ich)
STOP = set(
    """ich du er sie es wir ihr man mich dich sich uns euch mir dir ihm ihnen
    wer was wem wen der die das den dem des ein eine einen einem einer eines
    kein keine keinen keiner und oder aber denn weil wenn als wie wo da so zu
    in an auf mit von bei nach aus vor über unter zwischen durch gegen
    ohne um bis seit nicht nur auch schon noch immer sehr mehr hier dort jetzt
    dann ja nein doch wohl mal bitte danke
    etwas nichts alles jemand niemand
    heute gestern zurück vorbei hallo tschüss servus moin
    soll muss kann darf will mag weiß gut los habe hast
    alle allen aller alles viele vielen vieler wenige wenigen einige einigen
    beide beiden manche manchen andere anderen anderer solche solchen
    welche welchen jede jeder jedes jeden jedem sämtliche""".split()
)


def level_for_index(idx: int, total: int) -> str:
    return LEVELS[min(len(LEVELS) - 1, idx * len(LEVELS) // max(1, total))]


def _gender(entry: dict) -> str | None:
    for ht in entry.get("head_templates", []):
        if str(ht.get("name", "")).startswith("de-noun"):
            code = str((ht.get("args") or {}).get("1", "")).split(",")[0].strip()[:1]
            if code in GENUS:
                return GENUS[code]
    return None


def _plural(entry: dict) -> str:
    for f in entry.get("forms", []):
        tags = f.get("tags") or []
        if "plural" in tags and "definite" not in tags and f.get("form"):
            return f["form"]
    return ""


def _ipa(entry: dict) -> str:
    return next((s.get("ipa") for s in entry.get("sounds", []) if s.get("ipa")), "")


def _audio(entry: dict) -> str:
    """A Wikimedia Commons pronunciation URL (mp3 preferred, ogg fallback)."""
    for s in entry.get("sounds", []):
        url = s.get("mp3_url") or s.get("ogg_url")
        if url:
            return url
    return ""


def _clean_gloss(g: str) -> str:
    g = re.sub(r"\s*\([^)]*\)", "", g)  # drop parentheticals
    return re.sub(r"\s+", " ", g).strip(" ;,.")


# glosses that describe a *form* rather than a meaning — never use as a card gloss
META_RE = re.compile(
    r"^(inflection of|form of|comparative of|superlative of|agent noun of|gerund of|"
    r"past participle of|present participle of|plural of|genitive of|dative of|"
    r"accusative of|nominative of|strong|weak|mixed|first-person|second-person|"
    r"third-person|nominative|accusative|dative|genitive|singular|plural)\b",
    re.IGNORECASE,
)


def _is_meta(g: str) -> bool:
    return bool(META_RE.match(g))


def _gloss_and_example(entry: dict):
    gloss = ""
    # prefer a short, clean, non-meta gloss
    for max_len in (60, 200):
        for sense in entry.get("senses", []):
            for g in sense.get("glosses") or []:
                cg = _clean_gloss(g)
                if cg and not _is_meta(cg) and len(cg) <= max_len:
                    gloss = cg
                    break
            if gloss:
                break
        if gloss:
            break
    if not gloss:
        return "", None  # only meta/form glosses -> not a real vocabulary card
    example = None
    for sense in entry.get("senses", []):
        for ex in sense.get("examples") or []:
            if ex.get("type") == "quotation":
                continue
            text = ex.get("text")
            tr = ex.get("translation") or ex.get("english")
            if not text or not tr or len(text) > 90 or "[...]" in text:
                continue
            if "please add" in text.lower() or "please add" in tr.lower():
                continue
            example = (text, tr)
            break
        if example:
            break
    return gloss, example


def _is_derived(entry: dict) -> bool:
    for sense in entry.get("senses", []):
        for gloss in sense.get("glosses") or []:
            if "gerund of" in gloss.lower():
                return True
        for cat in sense.get("categories") or []:
            if cat.get("name") == "German deverbals":
                return True
    return False


def extract_noun(entry: dict):
    if entry.get("pos") != "noun":
        return None
    word = entry.get("word") or ""
    article = _gender(entry)
    gloss, example = _gloss_and_example(entry)
    if not word or article is None or not gloss or _is_derived(entry):
        return None
    return {"word": word, "article": article, "plural": _plural(entry),
            "gloss": gloss, "example": example, "ipa": _ipa(entry), "audio": _audio(entry)}


def extract_verb(entry: dict):
    if entry.get("pos") != "verb":
        return None
    word = entry.get("word") or ""
    gloss, example = _gloss_and_example(entry)
    if not word or not gloss:
        return None
    conj = extract_conjugation(entry)
    if not conj:
        return None
    forms = ", ".join(x for x in (conj["present"][2], conj["preterite"], conj["participle"]) if x)
    return {"word": word, "gloss": gloss, "example": example, "forms": forms, "ipa": _ipa(entry), "audio": _audio(entry)}


def extract_adj(entry: dict):
    if entry.get("pos") != "adj":
        return None
    word = entry.get("word") or ""
    gloss, example = _gloss_and_example(entry)
    if not word or not gloss:
        return None
    comp = sup = ""
    for f in entry.get("forms", []):
        tags = f.get("tags") or []
        if "comparative" in tags and f.get("form") and not comp:
            comp = f["form"]
        if "superlative" in tags and f.get("form") and not sup:
            sup = f["form"]
    forms = ""
    if comp and sup:
        forms = f"{comp}, {sup}"
    return {"word": word, "gloss": gloss, "example": example, "forms": forms, "ipa": _ipa(entry), "audio": _audio(entry)}


def _item(level, word, kind, payload, rank):
    base = {
        "id": f"freq-{level}-{kind[:3]}-{word}",
        "level": level,
        "group": f"{level}-core-{kind}",
        "groupName": f"Core {kind}s (frequency)",
        "kind": kind,
        "en": payload["gloss"],
        "sentence_de": payload["example"][0] if payload["example"] else "",
        "sentence_en": payload["example"][1] if payload["example"] else "",
        "ipa": payload.get("ipa", ""),
        "audio": payload.get("audio", ""),
        "note": f"Frequency rank {rank}",
        "attribution": WIKT_ATTR if payload["example"] else "",
    }
    if kind == "noun":
        base["de"] = f"{payload['article']} {payload['word']}"
        base["plural"] = (
            f"die {payload['plural']}"
            if payload["plural"] and payload["plural"] != payload["word"]
            else ""
        )
        base["intro"] = "High-frequency nouns with their article and plural."
    elif kind == "verb":
        base["de"] = payload["word"]
        base["forms"] = payload["forms"]
        base["intro"] = "High-frequency verbs with principal parts."
    else:
        base["de"] = payload["word"]
        base["forms"] = payload["forms"]
        base["intro"] = "High-frequency adjectives with comparison forms."
    if not base["attribution"]:
        del base["attribution"]
    return base


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, default=6000)
    ap.add_argument("--scan", type=int, default=80000)
    ap.add_argument("--kaikki", type=Path, default=ROOT / "data" / "raw" / "kaikki-de.jsonl")
    args = ap.parse_args()

    if not args.kaikki.exists():
        print("Missing kaikki extract. Run fetch_kaikki.py first.", file=sys.stderr)
        return 1

    freq = load_frequency()
    cand = set()
    for _rank, word in freq[: args.scan]:
        if len(word) >= 3 and word not in STOP:
            cand.add(word)
    noun_cand = {w[:1].upper() + w[1:] for w in cand}
    print(f"candidates: {len(cand):,}")

    nouns: dict[str, dict] = {}
    verbs: dict[str, dict] = {}
    adjs: dict[str, dict] = {}
    with args.kaikki.open(encoding="utf-8") as fh:
        for line in fh:
            if '"pos": "noun"' in line:
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                w = e.get("word")
                if w in noun_cand and w not in nouns:
                    info = extract_noun(e)
                    if info:
                        nouns[w] = info
            elif '"pos": "verb"' in line:
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                w = e.get("word")
                if w in cand and w not in verbs:
                    info = extract_verb(e)
                    if info:
                        verbs[w] = info
            elif '"pos": "adj"' in line:
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                w = e.get("word")
                if w in cand and w not in adjs:
                    info = extract_adj(e)
                    if info:
                        adjs[w] = info
    print(f"matched nouns={len(nouns):,} verbs={len(verbs):,} adjs={len(adjs):,}")

    rows = []
    for rank, word in freq:
        if len(rows) >= args.limit:
            break
        if word in STOP or len(word) < 3:
            continue
        if word in verbs:
            rows.append(("verb", word, verbs[word], rank))
        elif word in adjs:
            rows.append(("adj", word, adjs[word], rank))
        else:
            info = nouns.get(word[:1].upper() + word[1:])
            if info:
                rows.append(("noun", word, info, rank))

    items = []
    for idx, (kind, word, payload, rank) in enumerate(rows):
        items.append(_item(level_for_index(idx, len(rows)), word, kind, payload, rank))

    # fill missing examples from Tatoeba (CC BY)
    tatoeba = build_sentence_index(load_sentence_pairs())
    for it in items:
        if it["sentence_de"]:
            continue
        term = it["de"].split(" ", 1)[-1] if it["kind"] == "noun" else it["de"]
        hit = find_example(tatoeba, term)
        if hit:
            it["sentence_de"], it["sentence_en"] = hit[0], hit[1]
            if hit[2]:
                it["attribution"] = hit[2]

    out = ROOT / "data" / "vocab_frequency.json"
    out.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    from collections import Counter

    print(f"wrote {len(items):,} items -> {out}")
    print("by kind:", dict(Counter(i["kind"] for i in items)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
