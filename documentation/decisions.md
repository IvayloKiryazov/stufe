# Decisions (ADR log)

Why things are the way they are. Each entry: **Context → Decision →
Consequences**. Read this before changing a core design; if you disagree, add a
new ADR rather than silently reversing one.

---

## ADR-1 — North star: Bunpro + WaniKani
**Context:** an SRS for German vocabulary *and* grammar.
**Decision:** Bunpro and WaniKani are the reference implementations. When a
design is unclear, do what they do.
**Consequences:** fixed staged SRS, cloze-driven reviews, CEFR decks, automatic
difficulty. See [`AGENTS.md`](../AGENTS.md) and [`srs.md`](srs.md).

## ADR-2 — Fixed 12-level SRS (Bunpro ladder), not adaptive
**Context:** #75 asked for an optional SM-2/FSRS mode; the north star argues
against it.
**Decision:** use **Bunpro's 12 levels** (Beginner → Adept → Seasoned → Expert →
Master; waits 4h, 8h, 24h, 2d, 4d, 8d, 2w, 4w, 8w, 4mo, 6mo), one-level
demotion per wrong answer, Master = burned. **No SM-2/FSRS.**
**Consequences:** #75 closed as *not planned*. The scheduler is
`web/src/lib/srsCore.ts`; stages are `web/src/lib/stages.ts`.

## ADR-3 — Cloze-driven, varied context
**Context:** "answer the word" cards alone don't teach usage; Bunpro's stated
edge is varied context.
**Decision:** every vocab item carries **several example sentences**, and gets a
separate **`vocab-cloze` track** (fill the word into a rotating sentence). The
meaning card and cloze card are separate SRS items.
**Consequences:** more items; rotation is deterministic by `reps`
(`lib/cloze.ts`).

## ADR-4 — CEFR levels are frequency-anchored, not official
**Context:** #71 wants real CEFR levels. The Goethe Wortlisten are **PDFs** (no
official machine-readable German CEFR list); redistributing them in a CC BY-SA
repo is a licensing risk; and A1–B1 (~2,400 words) covers only the beginner core.
**Decision:** assign CEFR by **frequency, calibrated to the official list
sizes** (`tools/build_cefr.py` → `data/cefr.json`). Items also carry
`freqRank`; words past C2 are **"extra"** (absent from the map, still
frequency-tagged).
**Consequences:** this is an **approximation**, documented as such. Swapping in
the Goethe A1–B1 lists later is a drop-in if the licence is settled. See
[`content.md`](content.md).

## ADR-5 — Ship the deck split per level
**Context:** `items.json` is ~3.5 MB; loading it whole delays first paint (#102).
**Decision:** keep `data/items.json` as the **canonical flat artifact** (for
validation) and also emit `data/items/<level>.json`; the app loads levels on
demand. `tools/verify_dataset.py` enforces they agree.
**Consequences:** the client ships an allowlist (never the frequency deck or a
personal Anki import). Some duplication in `data/` is accepted for validation.

## ADR-6 — Pinned sources + reproducible checks
**Context:** the deck must be reproducible (#103/#104) but a full rebuild needs a
~1 GB extract.
**Decision:** pin each source (URL + licence + sha256) in
`tools/sources.lock.json`; `fetch_*.py --check` verifies `data/raw/`. CI runs
`verify_dataset` (split matches), `cross_check` (curated nouns vs a Wiktionary
reference) and `verify_report` (coverage/sample).
**Consequences:** a rebuild reproduces the deck or fails loudly.

## ADR-7 — Verification: report first, then fix
**Context:** the auto deck is large and single-source; the project owner does not
speak German, and model-fabricated "verified" content is not acceptable.
**Decision:** tooling **reports** disagreements (`cross_check`,
`verify_report`); fixes are made from authoritative sources / `content/overrides.json`,
not invented. Auto-fix only unambiguous, single-valued fields.
**Consequences:** #66/#67/#70 stay open until the report→fix loop covers the
deck; the report is translator-checkable.

## ADR-8 — Durable progress without accounts
**Context:** #99; accounts are explicitly deferred (#101).
**Decision:** progress lives in `localStorage`, is mirrored to **IndexedDB**
(with `storage.persist()`), and can optionally be written to a **user-chosen
file** via the File System Access API (survives clearing browser data; syncs if
the file is in a cloud folder).
**Consequences:** no server, no secrets. IDB alone is cleared with site data;
the file backup is the durable option.

## ADR-9 — Offline via service worker (shell + deck)
**Context:** #100; a first offline visit must work.
**Decision:** precache the shell **and** the per-level deck on install; serve
hashed assets cache-first, data/index network-first; version the cache
(`stufe-v3`).
**Consequences:** a deploy invalidates data via network-first; assets are
immutable.

## ADR-10 — Speech practice via the Web Speech API
**Context:** #84 wants pronunciation feedback; no cloud budget.
**Decision:** use the browser **Web Speech API** as a *speech check*
(transcript + word diff vs the model), with graceful fallback. **No cloud, no
phoneme scoring.**
**Consequences:** Chromium/Edge only; upgrade path is an on-device model
(e.g. whisper.cpp) if phoneme-level scoring is wanted.

## ADR-11 — Native audio, TTS fallback
**Context:** #97; audio must be licence-clean.
**Decision:** use **Wiktionary/Wikimedia Commons** recordings (CC BY-SA) from
the kaikki extract for vocabulary; fall back to browser TTS for sentences and
words without a recording.
**Consequences:** ~98 % word coverage; no keys.

## ADR-12 — Static site, no backend
**Context:** simplest durable deployment.
**Decision:** Vite SPA built to `docs/`, served by GitHub Pages; `HashRouter`
+ `base: "./"` for project-page deep links.
**Consequences:** all logic in the browser; `docs/` is build output, never
edited by hand.

## ADR-13 — Content licensing
**Context:** the deck derives from open data.
**Decision:** code MIT; Tatoeba (CC BY 2.0 FR), german-nouns/Wiktionary (CC BY-SA
4.0), FrequencyWords (MIT); combined `data/` is CC BY-SA 4.0; attribution is
surfaced on the Credits screen.
**Consequences:** do not vendor non-redistributable lists (e.g. Goethe PDFs)
into `data/`.
