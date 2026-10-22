# Contributing

Thanks for helping Stufe grow. It's a small static SPA plus a Python data
pipeline, so most contributions are editing JSON in `content/` and re-running
the pipeline.

## Layout

```
web/           the app source (Vite + React + TS + Tailwind + Radix)
  src/         components, routes, hooks, lib (pure logic + tests)
  e2e/         Playwright smoke + axe accessibility tests
  scripts/     sync-data.mjs (copies data/ into the build)
docs/          the BUILT app (Vite outDir) — never edit by hand; Pages serves it
tools/         the data pipeline (Python, standard library only)
content/       hand-authored source (edit here)
data/          generated deck, committed
tests/         Python pipeline/dataset tests
```

`content/` is the source of truth. `data/` is produced by `tools/build_dataset.py`
— never edit it by hand. See [`AGENTS.md`](AGENTS.md) for conventions and the
Bunpro + WaniKani north star.

## Add a grammar point

Grammar lives in `content/grammar/<level>.json` (`a1.json` … `c2.json`), a list
of **groups**, each with an `intro` and **items**:

```json
{
  "level": "a1",
  "groups": [
    {
      "id": "sein-haben",
      "name": "sein / haben (Präsens)",
      "subtitle": "to be / to have",
      "kind": "cloze",
      "intro": "sein: ich bin, du bist …",
      "items": [
        { "p": "Ich ___ müde.", "a": "bin", "en": "I am tired.", "hint": "sein", "note": "irregular" }
      ]
    }
  ]
}
```

Field rules:

- `p` — the sentence with **exactly one** blank written as `___`.
- `a` — the expected answer; add `"alt": ["x"]` only for genuinely correct variants.
- `en` — a natural English translation. `hint` — a short chip. `note` — an explanation.
- Answers are compared case-insensitively and umlauts/ß are folded, so don't add
  those as `alt`.
- Naming follows Bunpro: the **German pattern is the title**, a short **English
  function is the `subtitle`**.

## Nouns and verbs

`content/nouns/<level>.json` and `content/verbs/<level>.json` use the shape in
[`documentation/content.md`](documentation/content.md). The pipeline fills in
gender, plural, IPA, audio, example sentences and conjugations from open data.

## Rebuild and check

```bash
cd tools && python3 build_dataset.py      # content/ (+ generated) -> data/
python3 verify_dataset.py                 # sanity-check the output
cd .. && python3 -m unittest discover -s tests -v
cd web && npm run test:unit && npm run build && npm run test:e2e
```

Commit the regenerated `data/` and `docs/` together with your `content/` edit.

## Adding a whole new level

1. Add `content/grammar/<level>.json` (and nouns/verbs if you like).
2. Make sure the level is listed in `LEVEL_ORDER` in `tools/build_dataset.py`.
3. Re-run the pipeline — the app picks up new levels automatically.

## Tests and CI

- Python: `python3 -m unittest discover -s tests -v`
- Web: `cd web && npm run test:unit` (Vitest), `npm run build && npm run test:e2e`
  (Playwright smoke + axe a11y).

CI (`.github/workflows/ci.yml`) runs all of the above on every push and PR.

## Licensing

Code is MIT (`LICENSE`). Content you add under `content/` is contributed under
MIT. Data derived from upstream sources keeps their licences (Tatoeba CC BY 2.0
FR, Wiktionary / german-nouns CC BY-SA 4.0, FrequencyWords MIT); see
[`documentation/content.md`](documentation/content.md).
