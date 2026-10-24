# Changelog

Notable user-facing changes. Loosely follows
[Keep a Changelog](https://keepachangelog.com/). "Partial" items are noted
explicitly — see [`documentation/roadmap.md`](documentation/roadmap.md).

## Unreleased

### Added
- Bunpro-style **12-level SRS** (Beginner → Master; 4h…6mo; one-level demotion;
  Master = burned).
- **Vocabulary cloze track**: fill the missing word into a rotating example
  sentence, separate from the meaning card.
- **Multiple example sentences** per vocabulary item.
- **Gender/plural tracks for the whole noun deck** and a **case track**
  (accusative/dative/genitive) for curated nouns.
- **Conjugation tables** for all verbs; **IPA** for the curated vocabulary.
- **Native pronunciation audio** (~98 % of vocabulary) with browser-TTS fallback.
- **Search** over words and grammar points; **browse by part of speech**.
- **Level checkpoints** (scored, 80 % target) from Stats → Levels.
- **"Up next"** on Today and a GitHub-style **activity heatmap** in Stats.
- **CEFR panel**: can-do statements, exam alignment (Goethe/telc) and skills.
- **Inline word glossing** in Reading; **word-level feedback** in Writing.
- Curated **adjectives (A1–B2)** and **nouns/verbs/adjectives (B2/C1/C2)**;
  extra reading passages and a café dialogue.
- Route **error boundaries**; the deck loads **per level** on demand.
- **Durable progress** (IndexedDB mirror + persistent-storage request).
- **Offline** support (service-worker shell precache).
- Onboarding card; a keyboard-shortcut sheet ("?").
- Verification: **second-source cross-check** for curated nouns, a per-item
  `source` field, a **deck report** tool and reproducible deck checks in CI;
  widened the meta-gloss filter (obsolete/spelling/degree glosses).
- **CEFR re-levelling**: the auto deck is now levelled by frequency-anchored
  CEFR bands (calibrated to official list sizes) with a `freqRank` tag.

### Changed
- UI stage names are Bunpro's; the interval ladder replaced the 7-box hybrid.
- The "just memorise" gender-mnemonic filler was removed.

### Partial (see roadmap)
- i18n covers the shell, Today, Study, Browse, Stats, Settings and screen
  titles only.
- Offline **precaches the shell, not the deck**; durable progress does not use
  File System Access.

## 2.0.0

- Full frontend rewrite: Vite + React + TypeScript + Tailwind + Radix, an app
  shell, and a dashboard-first home; the built app is served from `docs/`.
- Content QA pass over the deck; Bunpro-style grammar naming.
