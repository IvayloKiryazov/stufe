# Tasks

Broken-down backlog for Stufe. `[x]` = done, `[ ]` = open.
This mirrors the GitHub issue tracker; each epic is an issue.

## Epic 1 — Project scaffold
- [x] Repo layout, MIT license, data-license notes
- [x] `.gitignore`, GitHub Pages workflow
- [x] README + pipeline docs

## Epic 2 — Open-data pipeline
- [x] `fetch_sources.py` — download frequency list, noun table, Tatoeba pairs
- [x] `build_vocab.py` — frequency deck with gender/plural + example sentence
- [x] `build_dataset.py` — merge curated content + frequency deck → `data/`
- [x] `attribution.json` generation for CC-BY sentences
- [ ] Cache/refresh strategy for large upstream files (etag / `--force`)
- [ ] POS-aware frequency deck (currently opt-in/experimental): filter with a Wiktionary
      extract so nominalised verbs (`das Ist`) and homographs never become noun cards
- [ ] Optional gloss enrichment from Wiktionary (kaikki extract) for word-level English meanings
- [ ] Verb conjugation table enrichment (principal parts from Wiktionary)

## Epic 3 — Curated content (A1–A2)
- [x] A1 themed noun lists (people, food, home, time, places, body, clothing…)
- [x] A2 noun lists
- [x] A1/A2 verb lists with principal parts
- [x] A1 grammar points (sein/haben, present tense, cases, word order…)
- [x] A2 grammar points (dative, perfect, prepositions, modal verbs…)
- [ ] B1 grammar points (subordinate clauses, relative clauses, passive…)
- [ ] B2 grammar points (Konjunktiv II, connectors, participle adjectives…)
- [ ] C1/C2 grammar points (nominal style, Funktionsverbgefüge, register…)

## Epic 4 — App (vanilla static PWA)
- [x] Data-driven deck loader (`data/items.json`, `data/levels.json`)
- [x] Lessons (batched new items) + Reviews (due) + free Practice
- [x] Noun production cards (article + plural) and cloze cards
- [x] Umlaut/ß input buttons, typo override, "add the article" hints
- [x] Staged SRS (Leitner boxes) with due scheduling
- [x] Web Speech API audio on every card
- [x] Progress export/import (JSON)
- [x] Service worker + web manifest (offline / installable)
- [x] Sentence attribution on cards + Credits & licenses screen (CC-BY)
- [ ] Keyboard shortcuts help sheet
- [ ] "Leeches" view (items failed most often)
- [ ] Per-group progress detail + estimated finish date
- [ ] Optional auto-play audio on reveal

## Epic 5 — Content scale-out to C1–C2
- [x] Ship the frequency deck (~6,000 nouns) as A2–C2 "core vocabulary" groups
- [ ] Import the user's frequency Anki deck locally (gitignored) as an optional deck
- [ ] Level-balancing pass using frequency rank + curated CEFR lists

## Epic 6 — Polish / infra
- [x] GitHub Pages enabled + deploy verified
- [x] Unit + dataset tests and CI (GitHub Actions)
- [x] Service worker: network-first for deck data (no stale decks after deploy)
- [ ] Lighthouse pass (a11y, PWA installability)
- [ ] Dark/light + reduced-motion audit
- [ ] Contribution guide for adding grammar points
