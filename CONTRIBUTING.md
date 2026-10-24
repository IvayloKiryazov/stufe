# Contributing

Thanks for helping Stufe grow. It's a small static SPA plus a Python data
pipeline, so most contributions are editing JSON in `content/` and re-running
the pipeline.

## Layout

See [`README.md`](README.md) for the repo layout and
[`documentation/architecture.md`](documentation/architecture.md) for the
architecture. In short: `content/` is the source of truth; `data/` is generated
(never edit by hand); `docs/` is the built app (never edit); `web/` is the app;
`tools/` is the pipeline. Conventions: [`AGENTS.md`](AGENTS.md).

## Adding content

All content is JSON under `content/` (nouns, verbs, adjectives, grammar,
reading). The **schema and field rules live in
[`documentation/content.md`](documentation/content.md)** — read that first. In
short:

- **Grammar**: `content/grammar/<level>.json` — groups of cloze `items`; `p`
  contains exactly one `___`, `a` is the answer (`alt` only for genuinely correct
  variants), `en` the translation, `hint`/`note` optional. Naming follows Bunpro
  (German pattern as the title, English function as the `subtitle`).
- **Nouns / verbs / adjectives**: `content/{nouns,verbs,adjectives}/<level>.json`
  — the pipeline fills in gender, plural, IPA, audio, examples and conjugations.
- **Reading**: `content/reading/<level>.json` — passages with a glossary and
  comprehension questions.

## Rebuild, test, commit

After editing `content/`, rebuild the deck (`cd tools && python3 build_dataset.py`,
or the fuller sequence in [`tools/README.md`](tools/README.md)) and run the
checks. Test layers, commands and CI are documented in
[`documentation/testing.md`](documentation/testing.md); app commands are in
[`README.md`](README.md).

Commit the regenerated `data/` and `docs/` together with your `content/` edit.

## Licensing

Code is MIT; content you add under `content/` is contributed under MIT; derived
data keeps its upstream licences. Canonical detail:
[`documentation/content.md`](documentation/content.md) (ADR-13).
