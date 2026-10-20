# HANDOFF — state of Stufe and how to proceed

Written at the end of a long build session. Read this together with
[`AGENTS.md`](AGENTS.md) (conventions) and [`documentation/`](documentation/)
(architecture, content, SRS, testing, roadmap).

---

## 1. Where things stand

- **Repo**: `github.com/IvayloKiryazov/stufe` (public). **Live**: GitHub Pages,
  serving the built app from **`docs/`**.
- **Stack**: `web/` = Vite + React 18 + TypeScript + Tailwind + Radix
  (shadcn-style). `tools/` = Python (stdlib) data pipeline. `data/` = generated
  deck (committed). `content/` = hand-authored source.
- **Phases 1–5 are complete** (UX rewrite, content QA, SRS depth, modalities,
  platform). CI is green; 27 Vitest + 29 Python + Playwright/axe tests pass.
- **Deck**: ~7,268 items — 3,569 nouns, 1,433 verbs, 1,261 adjectives, 625
  grammar cloze, plus 196 gender + 184 plural drill items.
- **Open work**: ~77 GitHub issues, grouped into epics. **Nothing is broken at
  the "app loads" level**, but there are real bugs and large content gaps — see §5.

### Honest limitations (don't oversell these)
- Levels are **frequency quantiles, not true CEFR**.
- The auto deck (~5,600 items) is **largely unverified** (only 9 overrides from a
  300-item sample).
- Modalities (reading/listening/speaking/writing) are **v1 shells**.
- i18n covers only the shell + Today.
- **No accounts/sync** (intentional — see §5, platform).

---

## 2. Environment & workflow (READ THIS — it will save you hours)

The agent runs on **Windows**; the repo lives in **WSL** (e.g. `~/projects/stufe`).

1. **The `write`/`edit` tools write via the Windows UNC path → files land
   root-owned in WSL.** Workaround that works: author the file to a **Windows
   temp dir**, then copy it into WSL so it keeps the right owner:
   `wsl -e bash -lc "cp <windows-temp-file> <dest>"`. (See `AGENTS.md`.)
2. **The PowerShell → WSL pipe mangles quoting** (`$VAR`, `$(...)`, quotes,
   backslashes). **Never inline complex bash.** Write a `.sh` file and run
   `wsl -e bash -lc "bash /tmp/x.sh"`. Same for `git commit` — use `-F <msgfile>`,
   never `-m "multi word"`.
3. **Node is via `nvm`**: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.
   `uv`/`uvx` are available (used `uvx git-filter-repo`).
4. **Browser checks**: use the Playwright MCP. Serve the built app
   (`cd docs && python3 -m http.server 8080`) and drive it. **Delete
   `.playwright-mcp/` afterwards** — it pollutes the workspace.
5. **`docs/` is build output** (Vite `outDir`) — never edit it by hand.
   Human docs live in **`documentation/`**.

---

## 3. Build / test / run

```bash
# app
cd web && npm install && npm run dev        # dev server (syncs data first)
cd web && npm run build                     # -> ../docs
cd web && npm run test:unit                 # Vitest (pure logic in src/lib)
cd web && npm run test:e2e                  # Playwright smoke + axe (needs build)

# pipeline
python3 -m unittest discover -s tests -v
python3 tools/check_content.py              # fails on hard content errors

# rebuild the deck (needs the ~1 GB kaikki extract; see tools/README.md)
cd tools && python3 fetch_sources.py && python3 fetch_kaikki.py
python3 build_frequency.py && python3 build_conjugations.py && python3 build_dataset.py
```

CI (`.github/workflows/ci.yml`) runs the Python tests + web build/unit/e2e/a11y.
`.github/workflows/pages.yml` deploys `docs/`.

---

## 4. How to push upstream

- `gh` is authenticated; `origin` = `https://github.com/IvayloKiryazov/stufe.git`,
  branch `main`.
- Small, focused commits; reference issues with `Closes #N` (auto-closes) or
  `Refs #N`. Commit message via file: `git commit -F /tmp/msg.txt`.
- **History was rewritten once** (to remove a personal path) with
  `git filter-repo`, then force-pushed. Consequences:
  - Old commit SHAs (`109600d`, `bbf49d7`) **still resolve on GitHub by SHA**
    until it garbage-collects. If that matters, open a GitHub Support request or
    recreate the repo. The **email in commits is fine** (owner's choice).
  - If you rewrite again: back up first (`git bundle create`), then
    `git push --force`.
- Pages redeploys automatically on push to `main`.
- **Do not reintroduce personal paths/usernames into committed files** (they were
  deliberately scrubbed).

---

## 5. Remaining work — how to proceed (prioritized)

### Step 1 — the four confirmed bugs (small, self-contained, do first)
- **#122** Listening answer options can't be selected (`answers` array `map` bug).
- **#123** Settings "Review reminders" toggle doesn't save (async permission).
- **#124** Writing/Translate similarity ignores word order (use token-LCS).
- **#125** `autoSpeak` setting is dead — wire auto-play audio.
- **#126** Backspace should undo the last answer.
Each needs a regression test. Verify in the browser, not just unit tests.

### Step 2 — the epics (big picture; see each epic issue for children)
- **#113 Content verification & factual assessment** — the most important
  quality work: a harness that checks the deck against authoritative sources
  (Wiktionary/kaikki, Duden) and **fails on disagreement**, plus factual
  checkpoints whose answers come from verified content, **not model guesses**.
- **#112 Content depth** — curated B2/C1/C2, adjectives, reading/listening
  libraries, dialogues. This is where "the path to C2" actually gets built.
- **#114 Modalities** — real listening (native audio), speaking (ASR), writing,
  graded readers.
- **#115 Curriculum** — ordered lessons with prerequisites + checkpoints.
- **#116 CEFR** — replace frequency-quantile levels with real CEFR mapping.
- **#117 SRS** — adaptive option, gender/plural tracks for the auto nouns, case
  track, conjugation for all verbs.
- **#118 UX** — search, full i18n, onboarding, native audio, browse/pick.
- **#119 Platform** — durable progress **without accounts** (IndexedDB +
  `storage.persist()`, File System Access, or point at a user's cloud-sync
  folder), true offline (precache the deck). **Accounts are explicitly deferred.**
- **#120 Architecture** — lazy-load the deck, pin upstream versions, reproducible
  CI builds, error boundaries, per-screen e2e.
- **#121 Docs** — update the stale `CONTRIBUTING.md` and `TASKS.md`, add a
  CHANGELOG and an architecture diagram.

### How to do content verification well
- Sources we already use: **Tatoeba** (CC BY), **german-nouns** (Wiktionary,
  CC BY-SA), **kaikki.org** German Wiktionary extract (POS, gender, plural, IPA,
  glosses, examples, **and audio URLs**). Prefer these; avoid Forvo (licence).
- Fix pipeline output via **`content/overrides.json`** (`id -> field patch`) or by
  improving `tools/build_frequency.py`; never hand-edit `data/`.
- Batch verification with **sub-agents**: give them the file path, ask for a
  *report* or a *corrected file in a temp dir*; keep the repo ownership clean.

---

## 6. Lessons learned (from this build)

**Product / content**
- The Bunpro naming convention (target-language pattern + English subtitle) is
  what was asked for; it looks inconsistent next to English theme names — decide
  one scheme and apply it everywhere.
- **Frequency ≠ meaning.** The auto deck takes the first usable Wiktionary sense;
  function words get wrong glosses (`alle → "finished; gone"`). Filter
  **meta-glosses** (`inflection of …`, `agent noun of …`) and expect to need
  curated overrides.
- **Mnemonics were mostly noise**: 79% fell back to "just memorise". Only ship a
  hint when it actually helps.
- One example sentence per word is not enough — Bunpro shows several, graded.

**Engineering**
- **"It renders" ≠ "it works."** The worst bugs (listening radios, reminders
  toggle, order-blind similarity, dead `autoSpeak`) all passed render/a11y tests.
  **Write interaction tests.**
- **axe (a11y) caught real bugs** (unnamed progress bars, dangling
  `aria-controls` from misused Radix Tabs, heading order, contrast). Keep it.
- Put pure logic in `web/src/lib/*` with unit tests; keep components thin.
- **Service workers go stale.** Use network-first (as now) or bump the cache on
  every deploy; a cache-first SW served an old deck for a while.
- **Heuristics need negative tests**: sentence-initial homographs (`Ich` pronoun
  vs noun), case-sensitivity (German nouns are capitalised), plural-only nouns,
  gender stored in `genus 1`.

**Process**
- Small commits, one issue each, `Closes #N`; keep `documentation/` and issues in
  sync. Don't leave the tracker stale (the old `TASKS.md` is now misleading).
- Be explicit about what is *done vs partial vs unverified*. The biggest risk is
  over-claiming (e.g. "C2" levels, "verified" content).
- Keep personal paths out of committed files.

**Environment (repeating traps)**
- Windows↔WSL quoting/ownership (see §2). Node via nvm. `docs/` is build output.
- `git filter-repo` removes `origin`; re-add it before pushing.

---

## 7. File map (where to look)

```
web/src/lib/        pure logic + tests (srsCore, stages, stats, projection,
                    grade, judge, selectors, store, data, i18n, tts, shuffle)
web/src/routes/     one file per screen
web/src/components/ Art + ui/ (Radix primitives)
tools/              pipeline (fetch_sources, fetch_kaikki, build_frequency,
                    build_conjugations, build_dataset, apply_naming, mnemonic,
                    check_content, import_anki, common)
content/            nouns/ verbs/ grammar/ reading/ + overrides.json
data/               generated deck (do not hand-edit)
tests/              Python pipeline/dataset tests
web/e2e/            Playwright smoke + axe a11y
documentation/      architecture, content, srs, testing, roadmap
```
