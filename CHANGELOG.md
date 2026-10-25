# Changelog

Notable user-facing changes. Loosely follows
[Keep a Changelog](https://keepachangelog.com/). Partial and not-planned items
are explicit — see [`documentation/roadmap.md`](documentation/roadmap.md) and
[`documentation/decisions.md`](documentation/decisions.md).

## Unreleased

### Added
- Bunpro-style **12-level SRS** (Beginner → Master; 4h…6mo; one-level demotion;
  Master = burned) and **vocabulary cloze** / gender / plural / case tracks.
- **Per-deck controls**: enable/disable and new cards/day for the course, core
  vocabulary, gender, plural, case and cloze tracks.
- **Known-word placement** in Browse: mark one or many words as known in a
  first pass (useful for a B2 learner clearing known vocabulary quickly).
- **User mnemonics**: a per-item note box on reveal cards, stored on device.
- **Per-skill progress** in Stats (vocabulary, grammar, cloze, reading,
  listening, writing, speaking).
- **Full UI i18n** (en/de): navigation and body UI, with a key-parity test and
  a German e2e switch test.
- **Structured per-item provenance** (`sourceRef`): Tatoeba sentence URL or
  Wiktionary page for vocabulary/grammar items.
- **Second-source cross-check for the auto deck**: auto noun articles/plurals
  are compared with german-nouns; disagreements are reported.
- **Sense-ranked gloss selection** (prefers primary/clean senses; penalizes
  obsolete/archaic/rare/form-of senses).
- **Verification report** now shows provenance coverage and residuals.
- **All Settings controls e2e-tested**; axe covers Stats Levels/Projections.
- **Progress schema v3** with a tested migration from the old 7-box schedule.

### Changed
- `data/items.json` is no longer committed; `data/items/<level>.json` is the
  canonical deck and `data/manifest.json` records counts + sha256 for CI.
- Old 7-box progress is migrated onto the 12-level ladder on load/import.
- The deck now has ~19,996 items; 627 vocabulary items are explicitly marked
  `exampleStatus: "missing"` (656 before the example backfill).

### Partial (see roadmap)
- 12 reading passages (A1–B2, one dialogue); no C1/C2 and no dedicated
  listening/writing libraries.
- 627 vocabulary items still lack an example.
- Gloss sense selection is heuristic; there is no human/paid reviewer.
- Full keyboard-only navigation and per-level modality statistics are partial.

### Not planned (recorded in ADRs)
- Official Goethe CEFR lists (#71): licence/redistribution risk; levels stay
  frequency-anchored (ADR-14).
- Full human verification (#66/#70): no reviewer; provenance + best effort
  (ADR-15).
- Phoneme-level pronunciation scoring (#84): would need an on-device model or
  cloud backend (ADR-10).
- Accounts/sync (#101): static app, file backup is sufficient (ADR-8/12).
- AI-authored German reading/listening/writing content (#63/#64/#65/#85/#86)
  without review (ADR-17).

## 2.0.0

- Full frontend rewrite: Vite + React + TypeScript + Tailwind + Radix, an app
  shell, and a dashboard-first home; the built app is served from `docs/`.
- Content QA pass over the deck; Bunpro-style grammar naming.
