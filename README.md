# Stufe

**German, one step at a time.** A spaced-repetition trainer in the spirit of
the WaniKani + Bunpro combo — vocabulary and grammar as two parallel SRS
queues, drilled with active recall (cloze / production), with audio.

There is no good free, open equivalent of "Bunpro for German", so this builds
one: a static, offline-capable web app plus a reproducible open-data pipeline
that turns public sources into a CEFR-graded deck.

- **Vocabulary** — nouns with their article (`der/die/das`) and plural, verbs
  with principal parts. Recall by typing, reinforced by an example sentence.
- **Grammar** — Bunpro-style cloze: a sentence with a blank, you type the
  missing piece, then see the rule, the answer and a note.
- **Audio** — a speaker button on every card using the browser's built-in
  German voices (Web Speech API). No downloads, no API keys.
- **SRS** — staged intervals (4h → 30 days) with a visible finish line,
  the same shape as WaniKani/Bunpro. Progress lives in `localStorage`.
- **PWA** — installable and works offline on desktop and phone.

## Quick start

The app fetches JSON at runtime, so it must be served over HTTP (not opened
from `file://`). Any static server works:

```bash
cd stufe
python3 -m http.server 8000
# then open http://localhost:8000
```

On GitHub Pages it is served automatically at
`https://<user>.github.io/stufe/`.

## Repository layout

```
index.html            the app shell
styles.css            styling (light + dark)
js/                   store.js, srs.js, tts.js, app.js
data/                 generated deck (committed, served by Pages)
  items.json          flat list of all study items
  levels.json         level/group structure
  attribution.json    upstream sentence credits
content/              hand-authored source content (the real input)
  nouns/*.json        themed noun lists
  verbs/*.json        verb lists with principal parts
  grammar/*.json      grammar points with cloze items
tools/                the open-data pipeline (see tools/README.md)
```

`content/` is the source of truth for curated material. `data/` is generated
by `tools/build_dataset.py`, which enriches curated words with gender/plural
data and real example sentences from open sources.

## The data pipeline

```bash
cd tools
python3 fetch_sources.py     # download frequency list, noun table, sentences
python3 fetch_kaikki.py      # optional: ~1.1 GB Wiktionary extract (for the core-vocab deck)
python3 build_frequency.py   # optional: build the core-vocabulary deck
python3 build_dataset.py     # merge content/ (+ core vocab) -> data/items.json + levels.json
```

See [`tools/README.md`](tools/README.md) for details and licensing.

## Testing

```bash
# pipeline + dataset validation (standard library only)
python3 -m unittest discover -s tests -v

# browser smoke test (needs Node)
npm install
npx playwright install chromium
npm test
```

CI runs both on every push and pull request (`.github/workflows/ci.yml`).

## Data sources and licenses

Code: **MIT** (see `LICENSE`).

| Source | Used for | License |
| --- | --- | --- |
| [Tatoeba](https://tatoeba.org) | example sentences + translations | CC BY 2.0 FR |
| [german-nouns](https://github.com/gambolputty/german-nouns) | noun gender + plural | CC BY-SA 4.0 |
| [FrequencyWords](https://github.com/hermitdave/FrequencyWords) | word frequency order | MIT |
| `content/` | curated words + grammar | MIT (original) |

Because the repo redistributes CC BY-SA 4.0 noun data, the combined `data/`
files are distributed under **CC BY-SA 4.0**.

## Roadmap

See [`TASKS.md`](TASKS.md). Short version: v1 covers A1–A2; the pipeline is
built to scale the deck to C1–C2 by adding levels and more curated grammar.
