# Content & the data pipeline

## Source of truth

`content/` is hand-authored. `data/` is generated — never edit it by hand.

```
content/
  nouns/<level>.json     themed noun lists           -> production cards
  verbs/<level>.json     verb lists + principal parts
  adjectives/<level>.json adjective lists
  grammar/<level>.json   grammar points with cloze items
  reading/<level>.json   reading passages + questions
```

### Nouns — `content/nouns/a1.json`

```json
{
  "level": "a1",
  "groups": [
    {
      "id": "people",
      "name": "People & family",
      "kind": "noun",
      "intro": "Learn nouns with their article.",
      "words": [["Mann", "man"], ["Frau", "woman"]],
      "notes": { "Mädchen": "Words in -chen are always neuter." }
    }
  ]
}
```

The pipeline fills in the **article** and **plural** (from german-nouns), an
**example sentence** (Tatoeba), and a **gender mnemonic**.

### Verbs — `content/verbs/a1.json`

Same shape; each word is `[infinitive, english, "principal, parts"]` with an
optional `[.., "example de", "example en"]` (used verbatim instead of the
Tatoeba lookup). The pipeline also attaches the present-tense conjugation from
`data/conjugations.json`.

### Grammar — `content/grammar/a1.json`

```json
{
  "level": "a1",
  "groups": [
    {
      "id": "sein-haben",
      "name": "sein / haben (Präsens)",
      "kind": "cloze",
      "intro": "sein: ich bin, du bist …",
      "items": [
        { "p": "Ich ___ müde.", "a": "bin", "en": "I am tired.", "hint": "sein", "note": "…" }
      ]
    }
  ]
}
```

`___` marks the blank; `a` is the expected answer; `alt` (optional) lists accepted
variants; `hint` is a chip shown before answering; `note` explains after.
Answers are compared leniently (case-insensitive, umlauts folded, trailing
punctuation ignored).

**Group naming follows Bunpro:** the German pattern is the title, a short English
function is the subtitle, e.g. `Passiv: werden + Partizip II` — "passive voice".
Keep the style consistent at every level.

### Reading — `content/reading/a1.json`

```json
{
  "level": "a1",
  "passages": [
    {
      "id": "a1-mein-tag",
      "title": "Mein Tag",
      "text": "Ich heiße Anna …",
      "glossary": [["aufstehen", "to get up"]],
      "questions": [
        { "q": "Wo wohnt Anna?", "options": ["in Berlin", "in München"], "answer": 0 }
      ]
    }
  ]
}
```

## Overrides

`content/overrides.json` is a map of **item id → field patch**, applied last by
`build_dataset.py`. Use it to correct a generated item (e.g. a wrong gloss)
without touching the pipeline:

```json
{ "freq-a2-adj-alle": { "en": "all; everyone" } }
```

Known residual limitation: the auto deck picks the first *usable* Wiktionary
sense, and **frequency is not meaning** — for polysemous words the gloss can be
a less useful sense. Meta-glosses (`inflection of …`, `agent noun of …`) are
filtered out, but full per-item verification is still a standing task (see the
roadmap).

## Generated data (`data/`)

| File | Contents |
| --- | --- |
| `items/<level>.json` | every study item, split per level — **canonical** (ADR-5) |
| `manifest.json` | per-level counts + sha256; CI verifies it |
| `levels.json` | level → group → item-id structure |
| `reading.json` | reading passages |
| `attribution.json` | per-sentence Tatoeba credits |
| `conjugations.json` | verb conjugation tables |
| `cefr.json` | word → CEFR band (frequency-anchored; see ADR-4) |
| `ipa.json` / `audio.json` | curated IPA and native-audio URLs |
| `reference_nouns.json` | Wiktionary noun reference used by `cross_check.py` |
| `vocab_frequency.json` | the core vocabulary deck (nouns/verbs/adjectives) |
| `vocab_personal.json` | optional local Anki import (gitignored) |

### Item shape (as the app consumes it)

```ts
interface Item {
  id; level; group; groupName;
  kind: "noun" | "verb" | "adj" | "cloze" | "gender" | "plural" | "case" | "vocab-cloze";
  intro?; note?;
  de?; en?; plural?; forms?; ipa?; audio?; mnemonic?; freqRank?;  // vocab
  prompt?; answer?; alt?; hint?;                                  // cloze / drills
  sentence_de?; sentence_en?; attribution?; source?;              // example + provenance
  sourceRef?: { kind; url?; word?; id? };                         // checkable reference
  exampleStatus?: "missing";                                      // explicit residual
  examples?: { de; en }[];                                        // several graded examples
  conjugation?: { present: string[]; preterite; participle };
}
```

## Running the pipeline

Commands, sources and reproducibility are in
[`tools/README.md`](../tools/README.md). Key points:

- `build_dataset.py` merges `data/vocab_frequency.json` and
  `data/vocab_personal.json` when present. Re-run it after any `content/` edit and
  commit the regenerated `data/`.
- It writes the canonical `data/items/<level>.json` (loaded on demand) and
  `data/manifest.json`; `tools/verify_dataset.py` checks counts/hashes and
  references.
- Upstream sources are pinned by URL + sha256 in `tools/sources.lock.json`, so a
  rebuild is reproducible (`fetch_*.py --check` verifies `data/raw/`).

### Verification tooling

- `verify_dataset.py` — per-level files, unique ids, references and
  `data/manifest.json` agree.
- `cross_check.py` — curated noun article/plural vs a Wiktionary reference
  (article mismatches fail CI, plural mismatches warn) **and auto nouns vs
  german-nouns** (reported as warnings).
- `verify_report.py --sample N` — field/provenance coverage, `sourceRef` URLs,
  `exampleStatus: missing`, gloss sanity and a translator-checkable sample;
  **report only**.

Policy (ADR-7/ADR-15): **report first, then fix** from authoritative sources or
`content/overrides.json` — never invent "verified" data. There is no human
reviewer; gloss sense and example-translation quality remain residual risk.

## Licensing

Code: MIT. Data: Tatoeba (CC BY 2.0 FR), german-nouns / Wiktionary (CC BY-SA
4.0), FrequencyWords (MIT). The combined `data/` files are **CC BY-SA 4.0**.
Attribution is surfaced in-app on the **Credits** screen.
