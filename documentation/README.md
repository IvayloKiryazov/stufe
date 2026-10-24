# Stufe — documentation

Stufe is a spaced-repetition trainer for German, a WaniKani + Bunpro analogue:
**vocabulary and grammar as parallel SRS queues**, drilled with active recall,
with audio. Static site, no backend.

This folder is the human documentation. (`docs/` at the repo root is the **built
app** served by GitHub Pages — not this.)

## Start here

- [Roadmap & status](roadmap.md) — **what is done, partial and left**, plus known
  quality debt and open decisions.
- [Decisions (ADR log)](decisions.md) — why the core choices were made (north
  star, 12-level SRS, CEFR approach, verification policy, offline, ASR…).
- [Architecture](architecture.md) — app, state/durability, data loading,
  routing, pipeline, deployment.
- [Content & pipeline](content.md) — content schema, generated data, provenance,
  verification.
- [SRS & study](srs.md) — scheduling, stages, modes, judging, audio, tracks.
- [Testing](testing.md) — test layers, CI, accessibility rules.

Conventions and the Bunpro + WaniKani north star: [`AGENTS.md`](../AGENTS.md).
Current state / how to push: [`HANDOFF.md`](../HANDOFF.md). Build/run commands:
[`README`](../README.md) and [`tools/README`](../tools/README.md).

## The 30-second tour

```
content/  ->  tools/  ->  data/  ->  web/  ->  docs/  ->  GitHub Pages
 (authored)   (pipeline)  (deck)    (app)    (build)     (live)
```

- Author content as JSON in `content/`.
- `tools/` enriches it with open data (gender, plural, IPA, audio, examples,
  conjugations, CEFR) and builds `data/items.json` + `data/items/<level>.json`.
- `web/` is a React SPA that loads the deck per level at runtime.
- `npm run build` writes the app to `docs/`, which Pages serves.

## Glossary

| Term | Meaning |
| --- | --- |
| **item** | one study card (a noun/verb/adjective, a grammar cloze, or a drill track) |
| **level** | a CEFR bucket A1 … C2 (frequency-anchored approximation; ADR-4) |
| **group** | a themed set of items within a level (e.g. `Food & drink`) |
| **SRS level / stage** | 1–12, named Beginner → Adept → Seasoned → Expert → Master (Bunpro) |
| **cloze** | a sentence with a blank; the learner types the missing piece |
| **track** | a separate SRS item derived from a word: gender, plural, case, or vocab-cloze |
| **extra study** | practice (leeches/passed/previous level/any learned) that does **not** change the schedule |
| **course** | the curated content (vs. the optional frequency deck) |
