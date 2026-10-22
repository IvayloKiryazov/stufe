# Changelog

Notable user-facing changes. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## Unreleased

### Added
- Bunpro-style **12-level SRS** (Beginner → Master) with the Bunpro interval
  ladder; wrong answers drop one level.
- **Vocabulary cloze track**: fill the missing word into a rotating example
  sentence (separate item from the meaning card).
- **Multiple example sentences** per vocabulary item.
- **Native pronunciation audio** for ~98% of vocabulary items (Wiktionary /
  Wikimedia), with browser-TTS fallback.
- **Search** over words and grammar points.
- **Up-next** on Today and a GitHub-style **activity heatmap** in Stats.
- **Burned / leech** explanations in Help.
- **First-run onboarding** and a **keyboard shortcut** sheet ("?").
- Gender/plural tracks for the whole noun deck; a **case track**; conjugation
  tables for the whole verb deck; IPA for the curated vocabulary.
- Route **error boundaries**; the deck loads **per level** on demand.
- **Durable progress** (IndexedDB mirror + persistent-storage request) and true
  **offline** support (service worker).

### Changed
- The UI's SRS stage names are Bunpro's; the interval ladder replaced the
  7-box Leitner hybrid.

## 2.0.0

- Full frontend rewrite: Vite + React + TypeScript + Tailwind + Radix, an app
  shell, and a dashboard-first home; the built app is served from `docs/`.
- Content QA pass over the deck; Bunpro-style grammar naming.
