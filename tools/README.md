# Data pipeline

Turns public sources + the curated `content/` files into the JSON the app
loads from `data/`. Standard library only — Python 3.10+.

## Run

```bash
cd tools
python3 fetch_sources.py     # ~30 MB into data/raw/ (gitignored)
python3 build_cefr.py        # -> data/cefr.json (frequency-anchored CEFR bands)
python3 build_dataset.py     # -> data/items.json, data/items/<level>.json, data/levels.json, data/attribution.json
```

`build_cefr.py` assigns CEFR levels by frequency, calibrated to the official
list sizes (A1≈650, A2≈650 more, B1≈1200, B2≈2500, C1≈3000, C2≈8000); words
past C2 are "extra" (absent from the map, still frequency-tagged). It is an
approximation — there is **no official machine-readable German CEFR list** (the
Goethe Wortlisten are PDFs). `build_frequency.py` prefers `data/cefr.json` and
falls back to quantiles; items also carry `freqRank`.

`build_dataset.py` merges optional generated inputs when present:
`data/conjugations.json`, `data/ipa.json` and `data/vocab_frequency.json`.
Rebuild them from kaikki with `python3 build_conjugations.py` (curated + deck
verbs), `python3 build_ipa.py` (curated IPA, issue #81) and
`python3 build_frequency.py` (the frequency deck).

`fetch_sources.py` skips files that already exist; pass `--force` to refresh.
Downloads are checked against `sources.lock.json`; run
`python3 fetch_sources.py --check` (and `fetch_kaikki.py --check`) to verify the
local `data/raw/` without downloading.

`build_dataset.py` writes the canonical flat `data/items.json` **and** the same
items split per level under `data/items/<level>.json` (the app loads those on
demand). `python3 verify_dataset.py` checks the split is consistent with
`items.json`; `python3 build_reference.py` builds a Wiktionary noun reference and
`python3 cross_check.py` compares the curated gender/plural against it.
`python3 verify_report.py --sample 20` prints a human-readable deck report
(field coverage, gloss sanity, a translator-checkable sample) — report only.
CI runs verify_dataset, cross_check and verify_report.

## Frequency deck (POS-aware)

The core-vocabulary deck is built from the **kaikki.org Wiktionary extract**, so
every item is confirmed to be a noun (no pronoun/verb homographs):

```bash
python3 fetch_kaikki.py      # ~1.1 GB into data/raw/ (gitignored)
python3 build_frequency.py   # -> data/vocab_frequency.json
python3 build_dataset.py     # merges it into data/ (runs after build_frequency)
```

`build_frequency.py` matches the most frequent words against Wiktionary noun
entries and pulls the article, plural, English gloss and an example sentence
(with translation) from the extract. `build_dataset.py` merges
`data/vocab_frequency.json` automatically when it exists, so run
`build_frequency.py` before it (or skip both to build only the curated deck).

## Personal Anki import

To fold a personal Anki deck (`.apkg`) into the app without publishing it:

```bash
python3 import_anki.py --apkg ~/Downloads/german.apkg   # -> data/vocab_personal.json
python3 build_dataset.py
```

The output is gitignored, so personal/copyrighted content stays local. Field
mapping is inferred from the note type's field names (Word, Definition 1,
German 1, English 1, IPA, Rank); use `--level` to force a CEFR level.

## Sources

Pinned in `sources.lock.json` (URL + license + sha256) for reproducibility
(#103). A rebuild either reproduces the deck or fails when upstream changed.

| File | Upstream | License |
| --- | --- | --- |
| `data/raw/frequency.txt` | hermitdave/FrequencyWords | MIT |
| `data/raw/nouns.csv` | gambolputty/german-nouns | CC BY-SA 4.0 |
| `data/raw/deu.txt` | Tatoeba (via manythings.org) | CC BY 2.0 FR |
| `data/raw/kaikki-de.jsonl` | kaikki.org (Wiktionary) | CC BY-SA 4.0 |

## Content format (`content/`)

`content/nouns/a1.json`
```json
{
  "level": "a1",
  "groups": [
    {
      "id": "people",
      "name": "People & family",
      "kind": "noun",
      "intro": "Learn nouns together with their article.",
      "words": [["Mann", "man"], ["Frau", "woman"]],
      "notes": { "Mädchen": "Words in -chen are always neuter." }
    }
  ]
}
```
`build_dataset.py` looks up the gender + plural and an example sentence for
each word automatically, so you only write the word and its English meaning.

`content/verbs/a1.json` — same shape, words are `[infinitive, english, "principal, parts"]`.

`content/grammar/a1.json`
```json
{
  "level": "a1",
  "groups": [
    {
      "id": "sein-haben",
      "name": "sein & haben",
      "kind": "cloze",
      "intro": "sein: ich bin, du bist …",
      "items": [
        { "p": "Ich ___ müde.", "a": "bin", "en": "I am tired.", "hint": "sein" }
      ]
    }
  ]
}
```
`___` marks the blank; `a` is the expected answer (`alt` lists accepted
variants); `hint` is shown as a chip; `note` explains the rule after answering.

## Adding a new level

1. Add `content/grammar/b1.json` (and nouns/verbs as you like).
2. Add the level to `LEVEL_ORDER` in `build_dataset.py`.
3. Re-run the pipeline. The app picks up new levels automatically.
