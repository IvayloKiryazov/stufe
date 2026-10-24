# HANDOFF — state of Stufe and how to proceed

Read this first, then [`AGENTS.md`](AGENTS.md) (conventions + north star) and
[`documentation/roadmap.md`](documentation/roadmap.md) (the authoritative
done / partial / remaining map). Core choices are explained in
[`documentation/decisions.md`](documentation/decisions.md).

## 1. Where things stand

- **Repo**: `github.com/IvayloKiryazov/stufe` (public). **Live**: GitHub Pages,
  serving the built app from **`docs/`**.
- **Stack**: `web/` = Vite + React 18 + TS + Tailwind + Radix; `tools/` = Python
  (stdlib) pipeline; `data/` = generated deck (committed); `content/` =
  hand-authored source.
- **Deck**: ~19,950 items — nouns/verbs/adjectives, grammar cloze, gender/plural/
  case drill tracks, and a vocabulary **cloze** track.
- **SRS**: **Bunpro's 12-level ladder** (Beginner → Master), not Leitner-7 and
  not SM-2/FSRS.
- **Backlog**: [`documentation/roadmap.md`](documentation/roadmap.md); GitHub
  epics #112–#121.

### Honest limitations (don't oversell)
- Levels are a **frequency-anchored CEFR approximation**, not the official Goethe
  list (ADR-4).
- The auto deck is **not fully verified**; the report→fix loop is ongoing
  (#66/#67/#70).
- Some issues are **closed but only partially met** — see roadmap §Partial.
- Curated B2–C2 content is **drafted, not human-verified**.
- Modalities are **v1** (speech = Web Speech transcript check; listening reuses
  reading; writing = word diff).
- i18n covers the shell/Today/Study/Browse/Stats/Settings/titles only.
- **No accounts/sync** (intentional, #101).

## 2. Environment & workflow

The agent runs on **Windows**; the repo lives in **WSL** (`~/projects/stufe`).
The traps and the correct workarounds (WSL quoting, file ownership, Playwright
libs) are documented in [`AGENTS.md`](AGENTS.md) §Environment. Node via `nvm`;
`docs/` is build output.

## 3. Build / test / run

See [`README.md`](README.md) for app commands, and
[`tools/README.md`](tools/README.md) for the pipeline. CI is
`.github/workflows/ci.yml`; the test layers are described in
[`documentation/testing.md`](documentation/testing.md).

## 4. How to push upstream

- `gh` is authenticated; `origin` = `https://github.com/IvayloKiryazov/stufe.git`.
- Commit directly to **`main`**; small focused commits; `Closes #N` / `Refs #N`.
  **Verify** the tracker after pushing (`Closes #a #b` has silently closed only
  some issues).
- Pages redeploys automatically on push to `main`.
- **Do not reintroduce personal paths/usernames** into committed files.

## 5. Remaining work

[`documentation/roadmap.md`](documentation/roadmap.md) is the single source. It
lists partial/open items, known quality debt, and the **decisions needed**:
CEFR list (#71), ASR engine (#84), verification policy (#66/#70), and the
#75 re-scope (already decided: not planned).

## 6. Lessons learned (hard-won)

- **"It renders" is not "it works".** The worst bugs (listening radios,
  reminders toggle, order-blind similarity, dead `autoSpeak`) passed render/a11y
  tests. Write **interaction** tests.
- **Don't over-claim.** Several issues were closed while only partially done
  (#63, #89, #96, #98, #99, #100 …). If acceptance isn't met, leave it open.
- **axe catches real bugs** — keep the a11y suite green.
- **Frequency ≠ meaning.** The auto deck takes the first usable Wiktionary
  sense; filter meta-glosses and expect curated overrides.
- **"Verified" content needs a source, not a model guess** (ADR-7).
- **Heuristics need negative tests**: sentence-initial homographs, German noun
  capitalisation, plural-only nouns, gender in `genus 1`.
- **Service workers go stale** — network-first for data, version the cache.
- **Bound per-token indexes** — an unbounded one was O(n²) and hung the build.

## 7. File map

```
web/src/lib/        pure logic + tests
web/src/routes/     one file per screen
web/src/components/ Art, ErrorBoundary, Onboarding, Shortcuts + ui/
tools/              pipeline + checks
content/            nouns/ verbs/ adjectives/ grammar/ reading/ + overrides.json
data/               generated deck (do not hand-edit)
tests/              Python tests
web/e2e/            Playwright smoke + interactions + axe
documentation/      architecture, content, decisions, srs, testing, roadmap
```
