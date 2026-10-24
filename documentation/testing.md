# Testing

Three layers, all run in CI.

## 1. Pipeline & dataset (Python, stdlib `unittest`)

```bash
python3 -m unittest discover -s tests -v
```

- `tests/test_pipeline.py` — `common.load_nouns` (gender columns, plural-only),
  the case-sensitive sentence index, `blank_sentence`, `build_frequency.extract_noun`
  (gender/plural/gloss/IPA/example, gerund rejection), `build_conjugations.extract_conjugation`,
  `mnemonic.gender_mnemonic` / `verb_hint`.
- `tests/test_dataset.py` — the generated deck: unique ids, cloze items have `___`
  and an answer, nouns carry an article, every level reference resolves, required
  fields present, gender/plural/case/cloze tracks, conjugations, IPA, examples and
  `source`.
- `tests/test_reading.py` — reading passages are well-formed.
- `tests/test_anki.py` — builds a synthetic `.apkg` and checks parsing/mapping.

Add a test whenever you add a pure helper to `tools/`.

## 2. Pure logic (Vitest)

```bash
cd web && npm run test:unit
```

`web/src/lib/*.test.ts` cover the pure modules: `stages`, `stats`, `projection`,
`grade`, `srsCore`, `selectors`, `data`, `cloze`, `gloss`, `search`, `cefr`,
`store`, `cn`, and the `ErrorBoundary` component. **Put logic in `lib/` and test
it here** rather than burying it in components.

## 3. Browser (Playwright + axe)

```bash
cd web && npm run build && npm run test:e2e
```

- `web/e2e/smoke.spec.ts` — the app loads; a lesson runs into a review; the theme
  toggle works; a grammar "cram" starts a session.
- `web/e2e/interactions.spec.ts` — per-screen interactions: listening option,
  settings toggles, reading answers, dictation/translate grading, browse→study.
- `web/e2e/a11y.spec.ts` — runs **axe-core** over every screen and asserts **zero
  violations**. This is the guardrail for accessibility.

Playwright starts the built app with `vite preview` (see
`web/playwright.config.ts`).

## Accessibility rules (must hold)

- Exactly one `<h1>` per screen (`sr-only` if visually hidden).
- `Progress` needs `label="…"` (Radix progressbar needs a name).
- `SelectTrigger` needs `aria-label="…"`.
- Don't use Radix `Tabs` as a bare toggle — use buttons with `aria-pressed`
  (Tabs emits `aria-controls` for panels that may not exist).
- Accordion headers are `<h2>` (heading order).
- Real `<button>`s for actions; never a bare clickable word.
- Keep contrast ≥ 4.5:1 (`--good`/`--das` were darkened for this).

## CI

`.github/workflows/ci.yml`:

- **pipeline** job — Python tests, `tools/check_content.py`,
  `tools/verify_dataset.py` (per-level split matches `data/items.json`; #104),
  `tools/cross_check.py` (curated nouns vs the Wiktionary reference; #69/#92) and
  `tools/verify_report.py` (deck report; #66/#67).
- **web** job — `npm ci`, `npm run build`, `npm run test:unit`,
  `npx playwright install --with-deps chromium`, `npm run test:e2e`.

Both must pass before merge.
