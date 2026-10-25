# Data pipeline

Turns public sources + the curated `content/` files into the JSON the app loads
from `data/`. Standard library only — Python 3.10+.

> **Content schema lives in
> [`documentation/content.md`](../documentation/content.md)** (nouns, verbs,
> adjectives, grammar, reading, the item shape, overrides, adding a level).
> This file covers the pipeline itself.

## Run

```bash
cd tools
python3 fetch_sources.py     # ~30 MB into data/raw/ (gitignored)
python3 fetch_kaikki.py      # ~1.1 GB Wiktionary extract (for the core deck)
python3 build_cefr.py        # -> data/cefr.json (frequency-anchored CEFR bands)
python3 build_frequency.py   # -> data/vocab_frequency.json
python3 build_conjugations.py# -> data/conjugations.json
python3 build_ipa.py         # -> data/ipa.json + data/audio.json
python3 build_reference.py   # -> data/reference_nouns.json
python3 build_dataset.py     # -> data/items/<level>.json, manifest.json, levels.json, reading.json, attribution.json
python3 build_noun_reference.py  # -> data/reference_nouns_german.json (CI cross-check)
```

`build_cefr.py` assigns CEFR by frequency, calibrated to the official list sizes
(A1≈650, A2≈+650, B1≈1200, B2≈2500, C1≈3000, C2≈8000); words past C2 are
"extra" (absent from the map, still frequency-tagged). It is an approximation —
there is **no official machine-readable German CEFR list** (the Goethe Wortlisten
are PDFs). `build_frequency.py` prefers `data/cefr.json`, falls back to quantiles,
and tags items with `freqRank`. Rationale: [ADR-4](../documentation/decisions.md).

`fetch_sources.py` skips existing files; `--force` refreshes. Downloads are
checked against `sources.lock.json`; `fetch_sources.py --check` (and
`fetch_kaikki.py --check`) verify `data/raw/` without downloading.

`build_dataset.py` merges optional generated inputs when present
(`data/conjugations.json`, `data/ipa.json`, `data/audio.json`,
`data/reference_nouns.json`, `data/vocab_frequency.json`,
`data/vocab_personal.json`) and writes the canonical
`data/items/<level>.json` (the app loads those on demand) plus
`data/manifest.json` (counts + sha256). The old flat `data/items.json` is no
longer written or committed (ADR-5); use `common.load_items()` if you need it.

## Checks

- `verify_dataset.py` — per-level files, unique ids, level references and
  `manifest.json` counts/hashes all agree.
- `cross_check.py` — curated noun article/plural vs the Wiktionary reference
  **and auto nouns vs german-nouns** (auto disagreements are warnings). The
  compact `data/reference_nouns_german.json` is committed so CI can run the
  auto check without the raw CSV.
- `verify_report.py --sample 20` — field/provenance coverage, `sourceRef` URLs,
  `exampleStatus: missing`, gloss sanity and a translator-checkable sample
  (report only).

CI runs all three. Policy: **report first, then fix** (ADR-7).

## Frequency deck (POS-aware)

The core-vocabulary deck is built from the **kaikki.org Wiktionary extract**, so
every item is confirmed to be a noun/verb/adjective (no homographs). Each item
carries an English gloss, IPA, a native-audio URL, an example sentence (with
translation), `freqRank`, and — for verbs — principal parts/conjugation.

## Personal Anki import

```bash
python3 import_anki.py --apkg ~/Downloads/german.apkg   # -> data/vocab_personal.json
python3 build_dataset.py
```

The output is gitignored, so personal/copyrighted content stays local. Field
mapping is inferred from the note type's field names (Word, Definition 1,
German 1, English 1, IPA, Rank); use `--level` to force a CEFR level.

## Sources

Pinned in `sources.lock.json` (URL + license + sha256) for reproducibility
(ADR-6). A rebuild either reproduces the deck or fails when upstream changed.

| File | Upstream | License |
| --- | --- | --- |
| `data/raw/frequency.txt` | hermitdave/FrequencyWords | MIT |
| `data/raw/nouns.csv` | gambolputty/german-nouns | CC BY-SA 4.0 |
| `data/raw/deu.txt` | Tatoeba (via manythings.org) | CC BY 2.0 FR |
| `data/raw/kaikki-de.jsonl` | kaikki.org (Wiktionary) | CC BY-SA 4.0 |
