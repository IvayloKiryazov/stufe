# HANDOFF — read this first

You are picking up **Stufe**, a static SRS trainer for German (Bunpro + WaniKani
analogue) built as a free personal app. The detail lives in `documentation/`.

**Read in this order:** this file → [`AGENTS.md`](AGENTS.md) (conventions +
north star) → [`documentation/roadmap.md`](documentation/roadmap.md) (done /
partial / deliberately not planned) → [`documentation/decisions.md`](documentation/decisions.md)
(ADRs / why).

## 1. Current state (TL;DR)

- **Repo** `github.com/IvayloKiryazov/stufe`; **live** on GitHub Pages from
  `docs/` (build output — never edit by hand).
- **Stack**: `web/` Vite + React 18 + TS + Tailwind + Radix; `tools/` Python
  (stdlib) pipeline; `data/` generated deck (committed); `content/` authored JSON.
- **Deck**: ~19,996 items, split per level in `data/items/<level>.json`
  (canonical). The old flat `data/items.json` is **gone**; `data/manifest.json`
  records counts + sha256 and CI verifies them.
- **SRS**: Bunpro's 12-level fixed ladder (Beginner → Master); Master = burned.
  Progress schema **v3** migrates old 7-box data onto the 12-level ladder.
- **Progress**: localStorage → IndexedDB mirror → optional File System Access
  backup file. No accounts, no backend (#101 not planned).
- **Offline**: service worker precaches shell + deck (`stufe-v3`).
- **i18n**: en/de for navigation and body UI on every screen; grammar/reading
  content and pronunciation hints stay in their source language.
- **Tests**: Python `unittest` 43, Vitest 70, Playwright 34 (incl. axe and
  non-default Stats tabs). All green at this handoff.

## 2. What this build changed

- **Decisions recorded**: ADR-14 no Goethe lists (frequency CEFR), ADR-15
  best-effort provenance-based verification, ADR-16 per-deck enable/new-day
  only, ADR-17 no unreviewed authored German content.
- **Data**: removed the 10 MB `items.json` duplicate (ADR-5); structured
  `sourceRef` per vocabulary item (#68); auto-noun cross-check against
  german-nouns (#69); sense-ranked gloss selection (#67); example backfill
  improved to 5,796 items with 627 explicitly marked `exampleStatus: missing`
  (#82); 8 overrides.
- **App**: progress schema v3 + migration; per-deck enable/disable + new/day
  (#76); known-word placement in Browse (“I know this” / bulk mark); user
  mnemonics on reveal cards (#130); per-skill progress in Stats (#74); full
  UI i18n (#94).
- **Tests**: export/import round-trip, migration, settings controls, deck
  filtering, i18n key parity, axe on Stats tabs (#134).

## 3. Deliberately not planned (do not reopen without a decision)

- **#71 Goethe Wortlisten / official CEFR** — licence/redistribution risk
  (ADR-14). Levels stay frequency-anchored and are labelled approximate.
- **#66/#70 full human verification** — there is no reviewer; ship provenance
  and honest residuals (ADR-15). Never label model output “verified”.
- **#84 phoneme scoring** — would need a large on-device model or cloud backend
  (ADR-10). The browser transcript/word-diff speech check is the final scope.
- **#101 accounts/sync** — static app, file backup is sufficient (ADR-8/12).
- **#63/#64/#65/#85/#86 content/listening/writing libraries** — no AI-authored
  German learning content and no human review (ADR-17). Existing 12 passages
  and TTS listening stay.
- **#88/#90/#91 prerequisite/interleaving/previous-level engine** — level/group
  order plus due-driven reviews cover the practical need.
- **#73 exam-style practice** — needs authored exam content.

## 4. Known debt / possible next work

- 627 vocabulary items have no example (`exampleStatus: missing`); C1/C2
  reading is absent; gloss sense selection is heuristic.
- `data/vocab_frequency.json` (~3.9 MB) is still committed as the generated
  input for a full rebuild.
- The app starts loading all per-level files in the background for cross-level
  search/stats; true route-demand loading is optional.
- Pronunciation hints and grammar/reading content are English/German learning
  material, not translated UI.
- Full keyboard-only navigation everywhere (#96) is still partial.

## 5. How to work here

- **Build/test**: [`README.md`](README.md) (app) and
  [`tools/README.md`](tools/README.md) (pipeline); test layers in
  [`documentation/testing.md`](documentation/testing.md).
- **Environment traps** (WSL quoting, ownership, Playwright libs) are in
  [`AGENTS.md`](AGENTS.md) §Environment — read them first.
- **Push** directly to `main` (no PRs); `Closes #N` / `Refs #N`; **verify the
  tracker after pushing** (`Closes #a #b` has silently closed only some).
- Keep `data/` and `docs/` in sync with content/build changes; commit both.
- **Do not edit `docs/` by hand** and do not invent “verified” data.

## 6. Lessons learned

- **“It renders” is not “it works”** — write interaction tests; the checkpoint/
  vocab-cloze e2e caught an auto-start race.
- **Don’t over-claim** — if acceptance isn’t met, mark it partial or not planned
  and explain why.
- **axe catches real bugs** — keep the a11y suite green.
- **Frequency ≠ meaning** — filter meta-glosses; keep overrides.
- **“Verified” needs a source, not a model guess** (ADR-7/ADR-15).
- **Heuristics need negative tests** (sentence-initial homographs, noun
  capitalisation, plural-only nouns).
- **Service workers go stale** — network-first for data, version the cache.
- **Bound per-token indexes** — an unbounded one was O(n²) and hung the build.

## 7. Doc map

```
documentation/roadmap.md       done / partial / not planned + debt + decisions
documentation/decisions.md     ADR log (why), ADR-1…ADR-17
documentation/architecture.md  app, state/durability, data loading, routes, deploy
documentation/content.md       content schema, generated data, provenance, verification
documentation/srs.md           scheduling, stages, modes, judging, audio, tracks
documentation/testing.md       test layers, CI, accessibility rules
tools/README.md                pipeline commands, sources, reproducibility
AGENTS.md                      conventions + north star + env traps
CONTRIBUTING.md                how to add content
CHANGELOG.md                   user-facing changes
```
