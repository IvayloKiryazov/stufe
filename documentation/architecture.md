# Architecture

## Overview

Stufe is a **static** app: there is no server and no database. All study logic
runs in the browser and progress is stored in `localStorage`.

```
┌────────────┐   build   ┌────────────┐   serve   ┌──────────────┐
│  web/ (TS) │ ────────► │  docs/     │ ────────► │ GitHub Pages │
└────────────┘           └────────────┘           └──────────────┘
       │ fetch data/*.json
       ▼
┌────────────┐  generate  ┌────────────┐  author  ┌────────────┐
│  data/     │ ◄───────── │  tools/    │ ◄──────── │ content/   │
└────────────┘            └────────────┘           └────────────┘
```

## The app (`web/`)

Vite + React 18 + TypeScript (strict) + Tailwind + Radix primitives styled in the
shadcn manner. `HashRouter` is used so deep links work on a project Pages site
without a 404 fallback. `base: "./"` keeps asset URLs relative.

```
web/src/
  main.tsx            ReactDOM root + ThemeProvider + HashRouter
  App.tsx             shell: sidebar (desktop) / drawer (mobile), routes
  index.css           Tailwind layers + design tokens (CSS variables, dark theme)
  lib/                pure, unit-tested logic (no React)
  components/ui/      Button, Card/Stat, Tabs, Select, Switch, Progress,
                      Accordion, Chip
  components/         Art (der/die/das colouring)
  hooks/              useDeck, useProgress, useStudy
  routes/             Today, Study, Browse, Grammar, Reading, Dictation,
                      Translate, Stats, Settings, Credits, Help
```

### Design tokens & theming

Colours are CSS variables in `index.css` (`--bg`, `--surface`, `--ink`,
`--muted`, `--line`, `--soft`, `--der`, `--die`, `--das`, `--good`, `--bad`).
Tailwind maps them (`bg-bg`, `text-muted`, …). Dark mode is a
`[data-theme="dark"]` attribute on `<html>`; `ThemeProvider` resolves
`auto | light | dark` (auto follows the OS) and persists the choice in
`localStorage` (`stufe-theme`). Text size is applied by scaling the root font
size.

### State

`lib/store.ts` is a tiny observable over `localStorage` key
`stufe-progress-v2`:

```ts
{ p: Record<itemId, Entry>, history: Record<dayKey, {new, reviews}>, settings }
```

Components read it with `useProgress()` (`useSyncExternalStore`). Mutations go
through the `store` object (`grade`, `setEntry`, `suspend`, `markKnown`, `log`,
`setSettings`, `import`, `export`, `reset`), which persists and notifies.

### Data loading

`lib/data.ts` fetches `data/levels.json`, `data/items.json` and
`data/reading.json` (cached in memory). `scripts/sync-data.mjs` copies the
generated `data/*.json` into `web/public/data/` before `dev`/`build`, so the
build carries the deck. `useDeck()` exposes `{ levels, by, reading }`.

### Routing

`App.tsx` maps routes; the sidebar groups them Learn / Practice / You:

| Route | Screen |
| --- | --- |
| `/` | Today (dashboard) |
| `/study` | Study (lessons / reviews / practice; accepts `?group=&level=&mode=`) |
| `/browse` | Browse (Course / Vocabulary tabs, group browser) |
| `/grammar`, `/grammar/:level/:group` | Grammar library + point page |
| `/reading`, `/reading/:id` | Reading library + passage |
| `/dictation`, `/translate` | listening / production drills |
| `/stats` | Stats (Overview / Projections) |
| `/settings`, `/credits`, `/help` | settings and info |

The Study screen can be launched with query params (used by Browse and Grammar
"Cram"): `#/study?group=<id>&level=<i>` starts a group lesson, adding
`&mode=practice` starts a practice session.

## The pipeline (`tools/`)

Python 3, standard library only. See [content.md](content.md) for the schema and
the exact commands. Summary:

- `fetch_sources.py` — FrequencyWords list, german-nouns CSV, Tatoeba pairs.
- `fetch_kaikki.py` — kaikki.org German Wiktionary extract (POS, gender, plural,
  IPA, glosses, example sentences).
- `build_frequency.py` — matches the most frequent words against Wiktionary nouns
  / verbs / adjectives; emits `data/vocab_frequency.json`.
- `build_conjugations.py` — present/preterite/participle for curated verbs.
- `build_dataset.py` — merges `content/` + generated decks into
  `data/items.json`, `data/levels.json`, `data/reading.json`,
  `data/attribution.json`.
- `mnemonic.py` — rule-based gender hints.

`build_frequency.py` assigns CEFR levels by **quantile** of the frequency-ordered
deck (even spread), not by raw rank.

## Deployment

`.github/workflows/pages.yml` uploads `docs/` as the Pages artifact.
`.github/workflows/ci.yml` runs the Python tests and the web build/unit/e2e/a11y.
Both trigger on push to `main`. There is no runtime server; the service worker
was retired with the old app (a PWA service worker is a future item, #58).

## Data & privacy

Everything runs locally; progress never leaves the device. A backup can be
exported/imported from Settings (JSON).
