# Roadmap & status

Single source of truth for **what is done, what is partial, and what is left**.
Issues are on GitHub (`IvayloKiryazov/stufe`); this file says how far each one
actually got. It is deliberately blunt about partial work — see
[Known quality debt](#known-quality-debt) for issues that are closed but whose
acceptance criteria are **not** met.

North star: **Bunpro + WaniKani** (see [`AGENTS.md`](../AGENTS.md)).

Legend: ✅ done · 🟡 partial (closed but not full acceptance) · ⛔ open / not started.

---

## Done ✅

### Architecture & engineering (epic #120)
- #102 the deck is split per level (`data/items/<level>.json`) and streamed on
  demand; `levels.json`/`reading.json` load eagerly, `by` grows.
- #103 upstream sources pinned in `tools/sources.lock.json` (URL + sha256;
  `fetch_*.py --check`).
- #104 CI verifies the per-level split matches `data/items.json`
  (`tools/verify_dataset.py`).
- #105 route error boundaries with a friendly fallback.
- #106 per-screen interaction e2e tests (search, reading, dictation, translate,
  settings, browse).
- #107 removed the orphaned root `node_modules/`.

### SRS (epic #117)
- **Bunpro's 12-level ladder** (Beginner → Master; 4h…6mo; one-level demotion;
  Master = burned). Replaces the old 7-box hybrid.
- #78 gender + plural tracks for the **whole** noun deck.
- #79 a **case** track (accusative/dative/genitive) for curated nouns.
- #80 conjugation tables for **all 1,460 verbs**.
- #77 study-ahead and per-item reset (`store.reschedule`/`resetItem`).
- #131 multiple example sentences per item + a **vocabulary cloze track**
  (fill the word into a rotating sentence).

### UX (epic #118)
- #93 search · #98 POS filter · #95 onboarding · #96 shortcut sheet ·
  #132 "up next" on Today · #133 activity heatmap · #135 burned/leech help ·
  #127 clearer review feedback · #126 Backspace undo.

### Platform (epic #119)
- #99 progress mirrored to IndexedDB + persistent-storage request.
- #100 service worker: shell precache, cache-first hashed assets,
  network-first data.

### Data & media
- #81 IPA for the curated vocabulary · #97 native pronunciation audio (~98 %) ·
  #129 dropped the useless "just memorise" mnemonic · #131 examples.

### Docs (epic #121)
- #108 CONTRIBUTING rewrite · #109 TASKS retired · #110 CHANGELOG ·
  #111 architecture diagram.

### Bugs (from the rewrite review)
- #122 listening radios · #123 reminders toggle · #124 order-aware grader ·
  #125 auto-play wiring.

### CEFR (epic #116)
- #72 can-do statements · #73 exam alignment · #74 skills (see partial notes).

---

## Partial 🟡 (closed, but acceptance not fully met)

| # | Issue | What is missing |
| --- | --- | --- |
| #63 | reading library | "dozens of passages across A1–C1" → only **8** (a1:2, a2:3, b1:3); no B2–C2 |
| #65 | dialogues & authentic texts | only **1** dialogue passage |
| #89 | factual checkpoints | quizzes existing items; the answers are **not** independently verified |
| #96 | keyboard-only nav everywhere | only a shortcut sheet; not full keyboard navigation |
| #98 | browse POS **and frequency rank** | POS filter only; no frequency-rank browsing |
| #100 | true offline | **shell only** is precached; the deck is not, so a first offline visit fails |
| #99 | durable progress | IndexedDB mirror only (cleared with site data); **no File System Access export** |
| #68 | per-item source | a coarse `source` string, not a verifiable per-item reference |
| #69 / #92 | cross-check / factual suite | curated **nouns** only (article/plural); no glosses, no auto deck, no learner tests |
| #74 | skill-by-level | skills are listed, but there is **no per-skill progress** |
| #132 | up-next **+ word picking** | up-next only |
| #87 | graded readers | inline glossing done; the reader **library** (=#63) is not |
| #134 | settings tests | only reminders + vacation are e2e-tested, not every control |
| #59–#62 | curated content | **drafted, not human-verified** (B2/C1/C2 nouns/verbs/adjectives) |

**Tracker discrepancy:** #61, #62 and #127 are **done but still show open**
(the `Closes` keywords did not take).

---

## Not started ⛔ (open)

**Verification (epic #113) — partial**
- A **report tool** now exists (`tools/verify_report.py`: field coverage, gloss
  sanity, a translator-checkable sample) and the **meta-gloss filter** was
  widened (obsolete/archaic/spelling/degree glosses are dropped). Policy agreed:
  **report first, then fix.**
- Still open: #66 full per-item verification, #67 sense-selection for polysemous
  words, #70 an authoritative reviewed-content process/marker.

**CEFR (epic #116) — partial**
- #71: the auto deck is re-levelled by **frequency-anchored CEFR bands**
  (`data/cefr.json`, calibrated to official list sizes) and items carry
  `freqRank`; words past C2 are "extra". This is an **approximation** — there is
  no official machine-readable German CEFR list (the Goethe Wortlisten are
  PDFs). Swapping in Goethe A1–B1 is a drop-in once the licence is settled.

**SRS / scheduling (epic #117)**
- #75 "optional adaptive algorithm (SM-2/FSRS)" — **closed as not planned**:
  it conflicts with the north star (Bunpro rejected FSRS; WaniKani uses fixed
  intervals). Stay faithful to the staged model. · #76 per-item difficulty /
  per-deck settings (open).

**Content (epic #112)**
- #82 714 vocabulary items still lack an example · #64 a dedicated listening
  library.

**Modalities (epic #114)**
- #84 speaking with ASR (needs an engine) · #85 native-audio listening ·
  #86 longer writing tasks.

**Curriculum (epic #115)**
- #88 full lesson/prerequisite model · #90 interleaving · #91 review-previous
  (a basic version exists).

**UX (epic #118)**
- #94 full i18n (only shell/Today/Study/Browse/Stats/Settings/titles are
  localised).

**Mnemonics (epic #128)**
- #130 per-word + user mnemonics · #83 verb/adjective mnemonics
  (0/1460 verbs have one).

**Platform (epic #119)**
- #101 accounts & sync — **explicitly deferred** (recorded decision).

---

## Known quality debt

- `data/items.json` (3.5 MB) is **duplicated** by `data/items/<level>.json`;
  both are committed.
- The SRS rename has **no migration**: a saved `box` 1–7 now maps to different
  SRS levels (only matters if a user had progress).
- `HANDOFF.md` §2 claims `write`/`edit` produce root-owned files; in this
  environment they do **not** (verified `ivaylo:ivaylo`).
- e2e smoke does not exercise the **checkpoint** or **cloze** modes; the axe
  suite does not render non-default tabs (the Stats "Levels" tab is untested).

## Decisions needed before the open items can proceed

1. **#71 CEFR list** — which authoritative wordlist? (Profile Deutsch / Goethe).
2. **#84 ASR** — which engine (on-device Web Speech / Whisper.cpp / cloud)?
3. **#66/#70 verification** — what source policy, and do we auto-fix or only
   **report** disagreements (recommended: report + `content/overrides.json`)?
4. **#75** — confirm re-scope away from SM-2/FSRS toward Bunpro/WaniKani
   fidelity (or keep it open as "not planned").
5. **#99** — accept IndexedDB as good-enough, or add File System Access
   "back up to file"?
