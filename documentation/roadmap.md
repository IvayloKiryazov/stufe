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
- #81 curated vocabulary now carries IPA from Wiktionary (the auto deck already
  did); `tools/build_ipa.py` builds the map.
- #59 curated **adjectives** for A1–B1 (`content/adjectives/*.json`), enriched
  with IPA, audio and examples like the other vocab.

## Phase 3 — SRS depth & curriculum (DONE)

- #49 leech auto-suspend, vacation mode, 14-day forecast, wrap-up, burned study
- #50 separate SRS tracks for **gender** and **plural** (case drills remain)
- #51 course-first path (linear A1–B1) in Browse; frequency deck behind a tab
- #78 the gender/plural tracks now cover the **whole** noun deck (auto nouns
  too), not just curated ones
- #80 the whole verb deck (1,433 verbs) now carries Wiktionary conjugation
  tables, not just the curated ones
- #79 a **case track** (accusative/dative/genitive article forms) for the
  curated nouns
- #131 every vocab item now carries multiple example sentences and a
  **cloze track** (fill the word into a rotating example sentence)

## Phase 4 — Modalities (DONE)

- #52 listening comprehension · #53 pronunciation & alphabet · #54 speaking
  (self-assessed, MediaRecorder) · #55 writing drills

## Phase 5 — Platform (DONE)

- #56 route-level code splitting (lazy routes)
- #57 i18n: interface language (en/de) for the shell and Today (coverage is
  incremental — more screens can be translated by adding keys to `lib/i18n.ts`)
- #58 service worker (offline) + review reminders
- #40 sync-data is done and the bundle is split; **per-level lazy loading of
  `items.json` is still deferred** (the deck loads as one file).

## Honest state of the deck

~7,300 items: nouns, adjectives, verbs, grammar cloze, plus separate **gender**
and **plural** drill tracks for curated nouns. Levels are **frequency
quantiles, not true CEFR**; the core vocabulary layer is broad and its
meta-glosses are filtered, but sense selection for polysemous words is still
heuristic (Phase 2). Listening/reading/speaking/writing now exist but content is
small. Full per-item verification of the auto deck remains a standing task.
