# Stufe — documentation

Stufe is a spaced-repetition trainer for German, built as a WaniKani + Bunpro
analogue: **vocabulary and grammar as parallel SRS queues**, drilled with active
recall, with audio. Static site, no backend.

This folder is the human documentation. (Note: `docs/` at the repo root is the
**built app** served by GitHub Pages — not this.)

## Start here

- [Architecture](architecture.md) — how the app, the store, the data and the
  deployment fit together.
- [Content & pipeline](content.md) — the content schema and how the deck is
  generated from open data.
- [SRS & study](srs.md) — the scheduling algorithm, stages, judging and audio.
- [Testing](testing.md) — the test layers, commands, and accessibility rules.
- [Roadmap](roadmap.md) — phases, status and issue map.

For agent/human conventions (golden rules, WSL gotchas, naming, a11y) see
[`AGENTS.md`](../AGENTS.md). For the build/run commands see the
[`README`](../README.md).

## The 30-second tour

```
content/  ->  tools/  ->  data/  ->  web/  ->  docs/  ->  GitHub Pages
 (authored)   (pipeline)  (deck)    (app)    (build)     (live)
```

- Author content as JSON in `content/`.
- `tools/` enriches it with open data (gender, plural, IPA, examples) and builds
  `data/items.json` + `data/levels.json`.
- `web/` is a React SPA that loads `data/*.json` at runtime.
- `npm run build` writes the app to `docs/`, which Pages serves.

## Glossary

| Term | Meaning |
| --- | --- |
| **item** | one study card (a noun, verb, adjective, or a grammar cloze) |
| **level** | a CEFR bucket: A1 … C2 |
| **group** | a themed set of items within a level (e.g. `Food & drink`) |
| **box / stage** | SRS box 0–7, named Apprentice → Burned |
| **cloze** | a sentence with a blank; the learner types the missing piece |
| **ghost** | extra practice of already-passed items (no schedule change) |
| **course** | the curated A1–B1 content (vs. the optional frequency deck) |
