# Roadmap

Issues are tracked on GitHub (repo `IvayloKiryazov/stufe`). This is the map.

## Phase 1 — UX redesign (DONE)

Fullstack frontend rewrite: Vite + React + TS + Tailwind + Radix/shadcn, a real
app shell, dashboard-first home, and the old vanilla app retired. Pages serves
the built `docs/`.

- #31 scaffold · #32 shell + design system · #33 Today · #34 Study · #35 Browse
  · #36 Grammar · #37 Reading/Dictation/Translate · #38 Stats/Projections/Extras
  · #39 Settings · #41 tests/CI/Pages
- #40 lazy-load data (open, optional perf)

## Phase 2 — Content QA (DONE)

- #42 Bunpro-style naming + validation test · #43 automated checks
  (`tools/check_content.py`)
- #44/#45 curated grammar, reading, nouns, verbs fully reviewed (1 fix)
- #46–#48 auto deck: meta-gloss filtering + sampled review (300 items) +
  `content/overrides.json`. Residual: sense selection for polysemous words is
  still heuristic — full per-item verification is a standing task.

## Phase 3 — SRS depth & curriculum (DONE)

- #49 leech auto-suspend, vacation mode, 14-day forecast, wrap-up, burned study
- #50 separate SRS tracks for **gender** and **plural** (case drills remain)
- #51 course-first path (linear A1–B1) in Browse; frequency deck behind a tab

## Phase 4 — Modalities (open)

- #52 listening comprehension · #53 pronunciation & alphabet · #54 speaking
  (self-assessed) · #55 writing drills

## Phase 5 — Platform (open)

- #56 lazy-load data / code-split · #57 i18n for the UI · #58 reminders + PWA
  service worker

## Honest state of the deck

~6,900 items: ~3,200 nouns, ~1,800 adjectives, ~1,300 verbs, ~625 grammar cloze.
Levels are **frequency quantiles, not true CEFR**; the core vocabulary layer is
broad but its glosses are unfact-checked (Phase 2). Reading/listening/speaking
are minimal — see Phase 4.
