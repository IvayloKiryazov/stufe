# Contributing

Thanks for helping Stufe grow. This is a small static app plus a Python data
pipeline, so contributing is mostly editing JSON in `content/` and re-running
the pipeline.

## Layout

```
index.html, styles.css, js/   the app (vanilla JS, no build)
data/                         generated deck, committed and served
content/                      hand-authored source (edit here)
  grammar/*.json              grammar points (cloze items)
  nouns/*.json                themed noun lists
  verbs/*.json                verb lists with principal parts
tools/                        the data pipeline
tests/                        stdlib unit + dataset tests
e2e/                          Playwright smoke + a11y tests
```

`content/` is the source of truth. `data/` is produced by
`tools/build_dataset.py` — never edit it by hand.

## Add a grammar point

Grammar lives in `content/grammar/<level>.json`, one file per CEFR level
(`a1.json` … `c2.json`). Each file is a list of **groups**; each group has an
`intro` and a list of **items**:

```json
{
  "level": "a1",
  "groups": [
    {
      "id": "sein-haben",
      "name": "sein & haben",
      "kind": "cloze",
      "intro": "sein: ich bin, du bist … haben: ich habe, du hast …",
      "items": [
        {
          "p": "Ich ___ müde.",
          "a": "bin",
          "en": "I am tired.",
          "hint": "sein",
          "note": "Both verbs are irregular — learn them by heart."
        }
      ]
    }
  ]
}
```

Field rules:

- `p` — the sentence with **exactly one** blank written as `___`.
- `a` — the expected answer. Add `"alt": ["x", "y"]` only when several answers
  are genuinely correct.
- `en` — a natural English translation.
- `hint` — a short chip shown before answering (e.g. the base form).
- `note` — a one-line explanation shown after answering (optional, encouraged).
- `intro` — shown once when the group starts.

Answers are compared case-insensitively and `ä/ö/ü/ß` are treated as `ae/oe/ue/ss`,
so you do not need to add those variants to `alt`.

## Then rebuild and check

```bash
cd tools
python3 build_dataset.py         # content/ (+ data/vocab_frequency.json) -> data/
cd ..
python3 -m unittest discover -s tests -v
```

`data/items.json`, `data/levels.json` and `data/attribution.json` change; commit
them together with your `content/` edit.

## Adding a whole new level

1. Add `content/grammar/<level>.json` (and nouns/verbs if you like).
2. Make sure the level is listed in `LEVEL_ORDER` in `tools/build_dataset.py`.
3. Re-run the pipeline — the app picks up new levels automatically.

## The pipeline

See [`tools/README.md`](tools/README.md) for the data sources and how the
frequency deck is built.

## Tests and CI

- Python: `python3 -m unittest discover -s tests -v`
- Browser: `npm install && npx playwright install chromium && npm test`
  (smoke + axe accessibility tests)

CI runs both, plus a Lighthouse accessibility check, on every pull request.

## Licensing

Code is MIT. Content you add under `content/` is contributed under MIT too.
Data derived from upstream sources keeps their licenses (Tatoeba CC BY 2.0 FR,
Wiktionary/german-nouns CC BY-SA 4.0) — see [`LICENSE`](LICENSE).
