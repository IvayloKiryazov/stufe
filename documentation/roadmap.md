# Roadmap & status

Single source of truth for **what is done, what is partial, and what is
deliberately not planned**. Issues are on GitHub
(`IvayloKiryazov/stufe`); this file explains how far each one actually got.
It is deliberately blunt — see [Known debt](#known-debt).

North star: **Bunpro + WaniKani** (see [`AGENTS.md`](../AGENTS.md)). The project
is a **free personal app**; there is no backend, no accounts, no paid
translation, and no human content reviewer.

Legend: ✅ done · 🟡 partial / best effort · ⛔ closed as not planned or deferred.

---

## Done ✅

### Architecture & engineering (epic #120)
- #102 the deck is split per level (`data/items/<level>.json`) and streamed;
  `levels.json`/`reading.json` load eagerly, `by` grows.
- #103 upstream sources pinned in `tools/sources.lock.json` (URL + sha256).
- #104 CI verifies the per-level deck + `data/manifest.json` (counts + hashes).
- #105 route error boundaries.
- #106 per-screen interaction e2e tests (34 Playwright specs incl. axe).
- #107 removed the orphaned root `node_modules/`.
- **ADR-5 change:** the 10 MB `data/items.json` duplicate is gone; per-level
  files are canonical and `tools/common.load_items()` rebuilds the flat deck.

### SRS (epic #117)
- Bunpro's 12-level ladder (Beginner → Master; 4h…6mo; one-level demotion;
  Master = burned).
- #78 gender + plural tracks for the whole noun deck; #79 case track; #80
  conjugations for all verbs; #77 study-ahead + reset; #131 multiple examples +
  vocab-cloze track.
- #76 per-deck controls: **enable/disable + new cards/day** for the course,
  core vocabulary, gender, plural, case and cloze tracks. No interval overrides
  (ADR-16).
- **Schema v3 + migration:** old 7-box progress is mapped onto the 12-level
  ladder; backups/imports are migrated too.

### UX (epic #118)
- #93 search · #98 POS + top-by-frequency browse · #95 onboarding · #96 shortcut
  sheet + skip-to-content · #132 up-next · #133 heatmap · #135 burned/leech help
  · #127 feedback · #126 Backspace undo.
- #94 i18n: navigation, titles and the **body UI** of every screen are
  localized (en/de), with a key-parity test and a German e2e switch test.
  Grammar/reading content and pronunciation hints stay in their source language.
- **Known-word placement:** Browse → Vocabulary has per-row “I know this” and a
  two-step “Mark these N as known”, so a B2 learner can clear what she knows in
  one pass (the use case behind per-deck settings).
- **User mnemonics:** every reveal card has a per-item note stored locally.

### Platform (epic #119)
- #99 progress mirrored to IndexedDB + persistent-storage request + optional
  File System Access backup file.
- #100 service worker precaches the shell + deck (`stufe-v3`).
- #101 accounts/sync closed as not planned (ADR-8/ADR-12).

### Data & media
- #81 IPA · #97 native word audio (~99 %) · #131 examples.
- #68 every vocabulary item exposes a **structured `sourceRef`** (Tatoeba
  sentence URL or Wiktionary page) alongside the existing credit string.
- #69 cross-check now also compares **auto nouns** against german-nouns
  (articles/plurals), not only curated nouns.
- #67 gloss selection scores senses instead of taking the first one (meta,
  obsolete/archaic/rare/form-of senses are penalized); 8 overrides applied.
- #82 example backfill improved (conjugation/comparison/plural forms, longer
  Tatoeba sentences): 627 items still have no example, marked
  `exampleStatus: "missing"` (was 656).
- #92 verification harness: `check_content`, `verify_dataset`, `cross_check`
  and `verify_report` are wired into CI; `sourceRef` makes items checkable.

### CEFR (epic #116)
- #72 can-do statements · #74 per-skill progress (SRS passed counts for
  vocabulary/grammar/cloze; persisted practice accuracy for reading, listening,
  writing and speaking).
- #71 official Goethe lists closed as not planned (ADR-14); levels remain
  frequency-anchored.
- #73 exam-style practice closed as not planned (no authored exam content).

### Content depth (epic #112)
- Curated adjectives A1–C2, nouns/verbs A1–C2, 69 grammar groups, 12 reading
  passages (A1 4, A2 3, B1 3, B2 2) including one café dialogue.
- #63/#64/#65/#85/#86 are **not planned/deferred** (ADR-17): no AI-authored
  German learning content and no human reviewer; the existing reading + TTS
  listening stays.

### Curriculum (epic #115)
- Levels unlock at 80 % of the previous level; groups are ordered by level and
  content order; reviews are due-driven and therefore interleaved across levels.
- #88 explicit prerequisite graph, #90 a separate interleaving plan and #91 a
  special previous-level scheduler are **not planned**: the due queue already
  includes previous levels and the learner can unlock all levels for placement.
- #89 checkpoints remain a scored sample of existing items (not independently
  verified facts; see ADR-15).

### Modalities (epic #114)
- Reading tap-a-word glossing, speech-check (Web Speech transcript + word diff),
  writing word-diff feedback, dictation/translation drills.
- #84 phoneme scoring closed as not planned (ADR-10); #85 native listening
  library deferred (no licence-clean sentence-audio source in the pipeline).

### Docs (epic #121)
- #108 CONTRIBUTING · #109 TASKS retired · #110 CHANGELOG · #111 architecture.

---

## Partial / best effort 🟡

| # | Issue | Status |
| --- | --- | --- |
| #63 | reading library | 12 passages, no C1/C2; content additions deferred (ADR-17) |
| #82 | examples | 627 vocabulary items still lack one (`exampleStatus: missing`) |
| #89 | factual checkpoints | quiz existing items; not independently verified |
| #96 | keyboard nav everywhere | shortcut sheet + skip-to-content, not full keyboard-only navigation |
| #68 | per-item source | structured `sourceRef` for vocabulary/grammar, but not every generated track card |
| #69/#92 | cross-check/factual suite | articles/plurals + structure; **gloss semantics/example translations are not machine-verified** |
| #74 | skill-by-level | per-skill progress overall; modality practice is not split per level in the UI |
| #132 | up-next | up-next only, no manual word picking |
| #134 | settings tests | all controls now e2e-tested; backup/export/import round-trip unit-tested |

---

## Closed as not planned / deferred ⛔

- **#71 official CEFR lists** — licence/redistribution risk; frequency-anchored
  approximate CEFR (ADR-4/ADR-14).
- **#73 exam-style practice** — requires authored exam content; no reviewer.
- **#101 accounts/sync** — no backend; file-based durability is sufficient
  (ADR-8/ADR-12).
- **#84 phoneme scoring** — needs an on-device model or cloud service; the
  browser speech check is the final scope (ADR-10).
- **#66/#70 full human verification** — no German speaker/paid reviewer; the
  project ships best-effort provenance and honest markers (ADR-15).
- **#63/#64/#65/#85/#86 content/listening/writing libraries** — no AI-authored
  German learning content and no human review (ADR-17).
- **#88/#90/#91 curriculum engine** — level/group order + due-driven reviews
  already cover the practical need; a prerequisite graph/interleaving plan is
  deliberately out of scope.
- **#128/#129/#130 mnemonics** — #129 fallback removed; #130 user-authored
  mnemonics shipped; curated per-word mnemonics are not planned (no authored
  content).
- **#112/#113/#114/#115/#116/#117/#118/#119/#120/#121 epics** — closed with the
  completed children above.

---

## Known debt

- `data/vocab_frequency.json` (~3.9 MB) is still committed as the generated
  input for `build_dataset.py`; a full rebuild needs it.
- The app still starts fetching all per-level files in the background (the
  split helps initial paint/route code, not total bandwidth). Cross-level
  search/stats need all levels; optional future work.
- Gloss sense selection remains heuristic; `content/overrides.json` is the
  source of fixes. The report is translator-checkable but no translator is
  available.
- Pronunciation hints and grammar/reading content are intentionally not
  translated; only UI chrome is localized.

## Decisions taken

All core decisions are recorded in [`decisions.md`](decisions.md): north star
(ADR-1), 12-level SRS/no SM-2/FSRS (ADR-2), CEFR frequency-anchored and no
Goethe lists (ADR-4/ADR-14), per-level canonical deck (ADR-5), pinned sources
(ADR-6), verification report→fix/best effort (ADR-7/ADR-15), durable progress
without accounts (ADR-8), offline deck (ADR-9), Web Speech speech check only
(ADR-10), native audio + TTS (ADR-11), static site (ADR-12), licensing
(ADR-13), per-deck controls (ADR-16), no unreviewed authored German content
(ADR-17).
