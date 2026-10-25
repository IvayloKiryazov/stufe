# HANDOFF — read this first

You are picking up **Stufe**, a static SRS trainer for German (Bunpro + WaniKani
analogue). This file is the map; the detail lives in `documentation/`.

**Read in this order:** this file → [`AGENTS.md`](AGENTS.md) (conventions +
north star) → [`documentation/roadmap.md`](documentation/roadmap.md) (what is
done / partial / left) → [`documentation/decisions.md`](documentation/decisions.md)
(ADRs / why).

## 1. Current state (TL;DR)

- **Repo** `github.com/IvayloKiryazov/stufe`; **live** on GitHub Pages from
  `docs/` (build output — never edit by hand).
- **Stack**: `web/` Vite + React 18 + TS + Tailwind + Radix; `tools/` Python
  (stdlib) pipeline; `data/` generated deck (committed); `content/` authored JSON.
- **Deck**: ~19,950 items — nouns/verbs/adjectives, grammar cloze, gender/plural/
  case drill tracks, and a vocab **cloze** track. Shipped split per level
  (`data/items/<level>.json`).
- **SRS**: Bunpro's **12-level** fixed ladder (Beginner → Master); Master =
  burned. Not SM-2/FSRS (#75 closed).
- **Progress**: `localStorage` → IndexedDB mirror → optional File System Access
  backup file. **Offline**: service worker precaches shell + deck (`stufe-v3`).
- **Tests** (all green at handoff): Python `unittest`, Vitest unit, Playwright
  smoke + interactions + axe (**29 e2e specs**). CI runs all + `check_content`,
  `verify_dataset`, `cross_check`, `verify_report`.
- **`main` is clean and pushed** at the handoff commit.

## 2. What was done recently (this build)

- **Bugs from the rewrite review**: #122–#127 (listening radios, reminders
  toggle, order-aware grader, auto-play, backspace undo, feedback readability).
- **Architecture (#120)**: per-level lazy deck (#102), pinned sources (#103),
  reproducible CI checks (#104), route error boundaries (#105), per-screen e2e
  (#106), root `node_modules` removed (#107).
- **SRS (#117)**: Bunpro 12-level ladder; gender/plural for all nouns (#78); case
  track (#79); conjugations for all verbs (#80); study-ahead + reset (#77);
  multiple examples + vocab-cloze track (#131).
- **Data/media**: IPA (#81), native audio ~98% (#97), meta-gloss filtering +
  gloss fixes (#67), `source` field (#68), CEFR bands + `freqRank` (#71), example
  backfill via conjugated/comparison forms (#82, partial).
- **Verification (#113)**: `build_reference.py` + `cross_check.py` (#69/#92),
  `verify_report.py` (report→fix policy).
- **UX (#118)**: search (#93), POS + top-by-frequency (#98), onboarding (#95),
  shortcut sheet + skip-to-content (#96, partial), up-next (#132), heatmap
  (#133), burned/leech help (#135), Settings/Help/Search title i18n (#94, partial).
- **Platform (#119)**: IndexedDB + File System Access backup (#99), offline deck
  precache (#100).
- **CEFR (#116)**: can-do, exam alignment, skills (#72/#73/#74, #74 partial).
- **Modalities/curriculum/content**: reading tap-a-word glossing (#87), writing
  word-diff (#86), Web Speech speech-check (#84, partial); lesson numbering (#88),
  checkpoints (#89), review-previous (#91); curated adjectives A1–B2 (#59),
  B2/C1/C2 vocab (#60–#62), extra reading + a dialogue (#63/#65, partial).
- **Docs**: restructured to one home per topic; added `decisions.md` (ADRs);
  rewrote CONTRIBUTING/HANDOFF/roadmap/CHANGELOG.

## 3. Partial / known debt (do not assume "closed" = complete)

See `documentation/roadmap.md` §Partial for the full table. Highlights:

- **#94 full i18n** — shell/Today/Study/Browse/Stats/Settings/Search **titles**
  are localized; most **body strings are still English**.
- **#96 keyboard nav** — shortcut sheet + skip-to-content; not "everywhere".
- **#82 examples** — ~656 vocab items still lack any example in any form.
- **#63/#65 content** — 12 reading passages (a1–b2) + 1 dialogue; not "dozens".
- **#68/#69/#92 verification depth** — coarse `source`; cross-check covers curated
  nouns only; not a full factual harness.
- **#74** — skills listed, no per-skill progress.
- **#84** — transcript check only, no phoneme scoring.
- **#89** — checkpoint quizzes existing items, not independently verified facts.
- **Quality debt**: `data/items.json` duplicated by `data/items/<level>.json`;
  the SRS rename has no migration for old `localStorage`; the axe suite doesn't
  render non-default tabs (Stats "Levels").

## 4. Next steps (suggested order)

1. **#94 i18n, screen by screen** — Settings labels/buttons/messages, Help rows,
   then the practice screens (Reading/Listening/Dictation/Translate/Writing/
   Speaking/Pronunciation) and Grammar point pages. Add keys to `lib/i18n.ts`
   (en+de), wire `t(lang, …)`, run `npm run build && npm run test:e2e` per screen.
2. **#66/#67 report→fix loop** — run `python3 tools/verify_report.py --sample 40`,
   fix bad glosses in the pipeline (`tools/build_frequency.py` heuristics) or via
   `content/overrides.json`; never invent "verified" data (ADR-7).
3. **#63/#65 content** — more graded passages + dialogues (a1–c1), glossary +
   questions each; rebuild + commit `data/` and `docs/`.
4. **#96 / #85 / #76** — keyboard nav everywhere; native-audio listening library;
   per-deck settings.
5. **#128/#130 mnemonics** — per-word + user mnemonics (currently rule-based
   hints only).
6. **#101 accounts** — explicitly deferred; do not build unless asked.

**Optional decision still open:** accept the **Goethe Wortlisten licence** to
drop in official A1–B1 CEFR lists (otherwise keep frequency-anchored bands;
ADR-4).

## 5. How to work here

- **Build/test**: see [`README.md`](README.md) (app) and
  [`tools/README.md`](tools/README.md) (pipeline); test layers in
  [`documentation/testing.md`](documentation/testing.md).
- **Environment traps** (WSL quoting, file ownership, Playwright libs) are in
  [`AGENTS.md`](AGENTS.md) §Environment — read them; they cost hours otherwise.
- **Push** directly to `main` (no PRs); `Closes #N` / `Refs #N`; **verify the
  tracker after pushing** (`Closes #a #b` has silently closed only some).
- Keep `data/` and `docs/` in sync with content/build changes; commit both.

## 6. Lessons learned (hard-won)

- **"It renders" is not "it works"** — the worst bugs passed render/a11y tests;
  write **interaction** tests (the new checkpoint/cloze e2e caught an auto-start
  race where the session started before the level's items loaded).
- **Don't over-claim** — several issues were closed while partial; if acceptance
  isn't met, leave it open (roadmap §Partial).
- **axe catches real bugs** — keep the a11y suite green.
- **Frequency ≠ meaning** — filter meta-glosses; expect curated overrides.
- **"Verified" needs a source, not a model guess** (ADR-7).
- **Heuristics need negative tests** (sentence-initial homographs, noun
  capitalisation, plural-only nouns, gender in `genus 1`).
- **Service workers go stale** — network-first for data, version the cache.
- **Bound per-token indexes** — an unbounded one was O(n²) and hung the build.

## 7. Doc map

```
documentation/roadmap.md       status: done / partial / left + debt + decisions
documentation/decisions.md     ADR log (why)
documentation/architecture.md  app, state/durability, data loading, routes, deploy
documentation/content.md       content schema, generated data, provenance, verification
documentation/srs.md           scheduling, stages, modes, judging, audio, tracks
documentation/testing.md       test layers, CI, accessibility rules
tools/README.md                pipeline commands, sources, reproducibility
AGENTS.md                      conventions + north star + env traps
CONTRIBUTING.md                how to add content
CHANGELOG.md                   user-facing changes
```
