# Stufe

**German, one step at a time.** A spaced-repetition trainer in the spirit of the
WaniKani + Bunpro combo — vocabulary and grammar as parallel SRS queues, drilled
with active recall (cloze / production), with audio.

- **App** — `web/` (Vite + React + TypeScript + Tailwind + Radix/shadcn).
  Builds to `docs/`, served by GitHub Pages. Installable, offline-capable PWA.
- **Pipeline** — `tools/` (Python, standard library only). Turns open data into
  the deck under `data/`.
- **Content** — `content/` (hand-authored nouns, verbs, grammar, reading).

## Run the app

```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

`npm run dev`/`build` first run `scripts/sync-data.mjs`, which copies
`data/*.json` into `web/public/data/`.

## Build for Pages

```bash
cd web
npm run build      # -> ../docs
```

GitHub Pages serves the `docs/` folder (see `.github/workflows/pages.yml`).

## Rebuild the deck

```bash
cd tools
python3 fetch_sources.py     # frequency list, noun table, Tatoeba pairs
python3 fetch_kaikki.py      # ~1.1 GB Wiktionary extract (for the core deck)
python3 build_frequency.py   # core vocabulary deck
python3 build_conjugations.py
python3 build_dataset.py     # -> ../data/*.json
```

## Tests

```bash
python3 -m unittest discover -s tests -v     # pipeline + dataset
cd web && npm run test:unit && npm run test:e2e   # Vitest + Playwright + axe
```

CI runs both on every push and pull request.

## Layout

```
web/          the app (source)
docs/         built app (served by Pages)
tools/        data pipeline
content/      authored content
data/         generated deck (committed)
tests/        Python pipeline/dataset tests
```

## Documentation

- [`documentation/`](documentation/) — architecture, content & pipeline, SRS,
  testing, roadmap.
- [`AGENTS.md`](AGENTS.md) — conventions for contributors and AI agents.

## Licensing

Code: MIT (`LICENSE`). Data derives from Tatoeba (CC BY 2.0 FR),
german-nouns / Wiktionary (CC BY-SA 4.0) and FrequencyWords (MIT); the combined
`data/` files are therefore CC BY-SA 4.0. See `CONTRIBUTING.md` for the content
schema and `TASKS.md` for the roadmap.
