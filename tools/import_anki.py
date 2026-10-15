#!/usr/bin/env python3
"""Import a personal Anki deck (.apkg) as an extra vocabulary deck.

This is for your own decks (e.g. a frequency deck you already study). The
output is written to ``data/vocab_personal.json`` and is **gitignored**, so
personal / copyrighted content never lands in the public repository. Run it,
then rebuild:

    python3 import_anki.py --apkg ~/Downloads/german.apkg
    python3 build_dataset.py

Field mapping is inferred from the Anki note type's field names (Word,
Definition 1, German 1, English 1, IPA, Rank). Use ``--level`` to force a
CEFR level, otherwise items are spread evenly across A2-C2.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import tempfile
import zipfile
from pathlib import Path

from common import ROOT

LEVELS = ["a2", "b1", "b2", "c1", "c2"]
WORD_RE = re.compile(r"^(der|die|das)\s+(.+?)(?:\s*,\s*(.+))?$")


def _pick(fields: dict[str, str], *needles: str) -> str:
    for name, value in fields.items():
        low = name.lower()
        for needle in needles:
            if needle in low:
                return value.strip()
    return ""


def map_fields(fields: dict[str, str], level: str) -> dict | None:
    """Map a note's {field name: value} to a Stufe item, or None if unusable."""
    word = _pick(fields, "word")
    if not word:
        return None
    definition = _pick(fields, "definition 1", "definition", "translation")
    german = _pick(fields, "german 1", "german", "example")
    english = _pick(fields, "english 1", "english")
    ipa = _pick(fields, "ipa", "pronunciation")
    rank = _pick(fields, "rank")

    match = WORD_RE.match(word)
    if match:
        article, lemma, plural_hint = match.groups()
        de = f"{article} {lemma}"
    else:
        article, lemma, plural_hint = "", word, None
        de = word

    item = {
        "id": "anki-" + re.sub(r"[^a-z0-9]+", "-", de.lower()).strip("-"),
        "level": level,
        "group": f"{level}-anki",
        "groupName": "Personal deck (Anki import)",
        "kind": "noun",
        "intro": "Your imported Anki deck.",
        "de": de,
        "en": definition or word,
        "plural": "",
        "sentence_de": german,
        "sentence_en": english,
        "note": (f"Anki rank {rank}" if rank else "") + (f" · {ipa}" if ipa else ""),
        "attribution": "Personal Anki import",
    }
    if plural_hint:
        item["note"] = (item["note"] + " · " if item["note"] else "") + f"plural: {plural_hint}"
    return item


def _field_names(models: dict, mid) -> list[str]:
    model = models.get(str(mid)) or models.get(mid)
    if not model:
        return []
    flds = sorted(model.get("flds", []), key=lambda f: f.get("ord", 0))
    return [f["name"] for f in flds]


def parse_apkg(path: Path) -> list[dict[str, str]]:
    """Return a list of {field name: value} dicts from an .apkg file."""
    with zipfile.ZipFile(path) as zf:
        member = next(
            (n for n in ("collection.anki21", "collection.anki2") if n in zf.namelist()),
            None,
        )
        if member is None:
            raise ValueError("no collection.anki2 / collection.anki21 in the .apkg")
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "collection.db"
            db_path.write_bytes(zf.read(member))
            con = sqlite3.connect(db_path)
            try:
                row = con.execute("SELECT models FROM col LIMIT 1").fetchone()
                models = json.loads(row[0]) if row and row[0] else {}
                notes = []
                for mid, flds in con.execute("SELECT mid, flds FROM notes"):
                    names = _field_names(models, mid)
                    values = flds.split("\x1f")
                    if names:
                        notes.append({n: (values[i] if i < len(values) else "") for i, n in enumerate(names)})
                    else:
                        notes.append({f"f{i}": v for i, v in enumerate(values)})
                return notes
            finally:
                con.close()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apkg", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "vocab_personal.json")
    ap.add_argument("--level", choices=LEVELS, help="force a single level")
    ap.add_argument("--limit", type=int, default=0, help="0 = all")
    args = ap.parse_args()

    if not args.apkg.exists():
        print(f"not found: {args.apkg}", file=sys.stderr)
        return 1

    notes = parse_apkg(args.apkg)
    print(f"notes in deck: {len(notes):,}")

    items = []
    total = len(notes) if not args.limit else min(args.limit, len(notes))
    for idx, fields in enumerate(notes):
        if args.limit and idx >= args.limit:
            break
        level = args.level or LEVELS[min(len(LEVELS) - 1, idx * len(LEVELS) // max(1, total))]
        item = map_fields(fields, level)
        if item:
            items.append(item)

    # de-duplicate ids (keep first)
    seen = set()
    unique = []
    for it in items:
        if it["id"] not in seen:
            seen.add(it["id"])
            unique.append(it)

    args.out.write_text(json.dumps(unique, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(unique):,} items -> {args.out}")
    print("next: python3 build_dataset.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
