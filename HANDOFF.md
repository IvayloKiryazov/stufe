# HANDOFF — state of Stufe and how to proceed

Read this with [`AGENTS.md`](AGENTS.md) (conventions + north star) and
[`documentation/roadmap.md`](documentation/roadmap.md) (the authoritative
done / partial / remaining map). This file is the "read me first" for a fresh
agent.

---

## 1. Where things stand

- **Repo**: `github.com/IvayloKiryazov/stufe` (public). **Live**: GitHub Pages,
  serving the built app from **`docs/`**.
- **Stack**: `web/` = Vite + React 18 + TypeScript + Tailwind + Radix. `tools/` =
  Python (stdlib) pipeline. `data/` = generated deck (committed). `content/` =
  hand-authored source.
- **Deck**: ~19,826 items — nouns, verbs, adjectives, grammar cloze, plus
  gender/plural/case drill tracks and a vocabulary **cloze** track.
- **SRS**: **Bunpro's 12-level ladder** (Beginner → Master), not Leitner-7.
- **Tests**: Vitest + Playwright/axe (web), unittest + dataset + cross-check
  (`tools/`, run from the repo root). CI runs all.
- **Backlog**: see [`documentation/roadmap.md`](documentation/roadmap.md). The
  GitHub tracker groups everything into epics #112–#121.

### Honest limitations (don't oversell)
- Levels are **frequency quantiles, not true CEFR** (#71).
- The auto deck is **largely unverified** (#66/#67/#70).
- Several issues are **closed but only partially met** — the full list is in
  roadmap.md §"Partial". Do not assume a closed issue is a finished feature.
- Curated B2–C2 content is **drafted, not human-verified**.
- Modalities are **v1** (writing has a word-diff; listening reuses reading;
  speaking is self-assessed, no ASR).
- i18n covers the shell/Today/Study/Browse/Stats/Settings/titles only.
- **No accounts/sync** (intentional, #101).

---

## 2. Environment & workflow

The agent runs on **Windows**; the repo lives in **WSL** (`~/projects/stufe`).

1. **The PowerShell → WSL pipe mangles quoting** (`$VAR`, `$(...)`, quotes).
   **Never inline complex bash** — write a `.sh`/`.py` file and run
   `wsl -e bash -lc "bash /tmp/x.sh"`. Commit messages via `-F <file>`.
   (Corollary: don't put `$?` in a `wsl -e bash -lc "..."` string — PowerShell
   expands it.)
2. **Ownership**: on this machine the `write`/`edit` tools produce files owned
   by your WSL user (`ivaylo`), **not** root. (An earlier note claimed root;
   that was wrong here. If you *do* see root-owned files, copy via
   `wsl -e bash -lc "cp <windows-temp> <dest>"`.)
3. **Node via `nvm`**: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.
4. **Playwright** works locally once the system libs are present
   (`libnspr4 libnss3 libasound2t64` on Ubuntu 26.04). If missing, `apt-get
   download` + `dpkg-deb -x` + `LD_LIBRARY_PATH` works without root.
5. **`docs/` is build output** (Vite `outDir`) — never edit by hand. Human docs
   live in **`documentation/`**.

---

## 3. Build / test / run

```bash
# app
cd web && npm install && npm run dev        # syncs data first
cd web && npm run build                     # -> ../docs
cd web && npm run test:unit                 # Vitest
cd web && npm run build && npm run test:e2e # Playwright smoke + axe

# pipeline (run from tools/)
python3 -m unittest discover -s tests -v
python3 tools/check_content.py
python3 tools/verify_dataset.py
python3 tools/cross_check.py

# full deck rebuild (needs the ~1 GB kaikki extract)
cd tools && python3 fetch_sources.py && python3 fetch_kaikki.py
python3 build_frequency.py && python3 build_conjugations.py && python3 build_ipa.py
python3 build_reference.py && python3 build_dataset.py
```

---

## 4. How to push upstream

- `gh` is authenticated; `origin` = `https://github.com/IvayloKiryazov/stufe.git`.
- Commit directly to **`main`** (the project does not use PRs); small, focused
  commits; `Closes #N` / `Refs #N`. **Note:** `Closes #a #b` has silently
  closed only some issues — **verify** the tracker after pushing.
- Pages redeploys automatically on push to `main`.
- **Do not reintroduce personal paths/usernames** into committed files.

---

## 5. Remaining work

See [`documentation/roadmap.md`](documentation/roadmap.md) — it lists the
partial and open items, the known quality debt, and the **decisions needed**
before the open ones can proceed:

1. #71 (which CEFR wordlist), 2. #84 (which ASR engine),
3. #66/#70 (verification source policy — recommend *report*, not auto-fix),
4. #75 (re-scope away from SM-2/FSRS), 5. #99 (accept IndexedDB or add FS Access).

---

## 6. Lessons learned (hard-won)

- **"It renders" is not "it works".** The worst bugs (listening radios,
  reminders toggle, order-blind similarity, dead `autoSpeak`) passed render/a11y
  tests. Write **interaction** tests.
- **Don't over-claim.** Several issues were closed while only partially done
  (#63, #89, #96, #98, #99, #100 …). If acceptance isn't met, leave the issue
  open or split it. See roadmap §Partial.
- **axe catches real bugs** — keep the a11y suite green.
- **Frequency ≠ meaning.** The auto deck takes the first usable Wiktionary
  sense; filter meta-glosses and expect curated overrides.
- **"Verified" content needs a source, not a model guess.**
- **Heuristics need negative tests**: sentence-initial homographs, German noun
  capitalisation, plural-only nouns, gender in `genus 1`.
- **Service workers go stale** — network-first for data, version the cache.
- A per-token index must be **bounded** (`build_sentence_index_multi` was O(n²)
  on common words and hung the build).

---

## 7. File map (where to look)

```
web/src/lib/        pure logic + tests (srsCore, stages, stats, projection,
                    grade, judge, selectors, store, data, cloze, gloss, search,
                    i18n, cefr, tts, persist, shuffle)
web/src/routes/     one file per screen
web/src/components/ Art, ErrorBoundary, Onboarding, Shortcuts + ui/ (Radix)
tools/              pipeline (fetch_*, build_frequency, build_conjugations,
                    build_ipa, build_reference, build_dataset, verify_dataset,
                    cross_check, check_content, mnemonic, import_anki, sources)
content/            nouns/ verbs/ adjectives/ grammar/ reading/ + overrides.json
data/               generated deck (do not hand-edit)
tests/              Python pipeline/dataset tests
web/e2e/            Playwright smoke + interactions + axe
documentation/      architecture, content, srs, testing, roadmap
```
