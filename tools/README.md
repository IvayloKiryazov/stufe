# Data pipeline

Turns public sources + the curated `content/` files into the JSON the app
loads from `data/`. Standard library only — Python 3.10+.

## Run

```bash
cd tools
python3 fetch_sources.py     # ~30 MB into data/raw/ (gitignored)
python3 build_dataset.py     # -> data/items.json, data/levels.json, data/attribution.json
```

`fetch_sources.py` skips files that already exist; pass `--force` to refresh.

## Experimental: the frequency deck

`build_vocab.py` turns the frequency list into a large "core vocabulary" cloze
deck. It is **opt-in and not shipped by default**:

```bash
python3 build_vocab.py --limit 2500          # -> data/vocab_frequency.json
python3 build_dataset.py --frequency         # merge it into data/
```

It is off by default because the upstream frequency list is lowercased and not
POS-tagged, so a lowercased word can collide with a rarer noun (e.g. the pronoun
`es` vs. the noun `das Es`). The script filters hard (determiner-led noun
phrases only, function-word stoplist) but still lets some nominalised verbs
through. Doing this properly needs a POS-tagged source (e.g. a Wiktionary
extract) — see `TASKS.md`.

## Sources

| File | Upstream | License |
| --- | --- | --- |
| `data/raw/frequency.txt` | hermitdave/FrequencyWords | MIT |
| `data/raw/nouns.csv` | gambolputty/german-nouns | CC BY-SA 4.0 |
| `data/raw/deu.txt` | Tatoeba (via manythings.org) | CC BY 2.0 FR |

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
