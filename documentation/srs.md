# SRS & study

## The scheduling model

A staged (Leitner) model with fixed intervals — the same shape as
WaniKani/Bunpro, not an adaptive SM-2/FSRS.

Implementation: `web/src/lib/srsCore.ts`.

- Boxes **0–7**; each box has a fixed interval (hours):

  | box | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
  | --- | - | - | - | - | - | - | - | - |
  | hours | – | 4 | 8 | 24 | 72 | 168 | 336 | 720 |

- **Correct** → `box + 1` (capped at 7). **Wrong** → `box - 1`, or `box - 2`
  once the box is ≥ 5 (leeches get punished harder). A wrong answer floors at
  box 1.
- `PASS_BOX = 3` (an item is "passed" from box 3 up). A level unlocks when
  **80 %** (`PASS_RATIO`) of the previous level is passed.
- Every entry also tracks `lapses` (wrong count), `reps`, `last` and a short
  `hist` (last 10 grades, shown as dots on the card).

### Stages (named, WaniKani-style)

`web/src/lib/stages.ts` maps boxes to names:

| box | stage |
| --- | --- |
| 0–1 | Apprentice |
| 2–3 | Guru |
| 4 | Master |
| 5–6 | Enlightened |
| 7 | Burned |

### Entry state

```ts
interface Entry { box; due; lapses?; reps?; last?; hist?: number[];
                  suspended?: boolean; known?: boolean }
```

- **suspend** — excluded from reviews/lessons until resumed. An item is
  **auto-suspended** once it reaches `LEECH_THRESHOLD` (8) lapses.
- **known** — marked as known; burned (box 7) and excluded.
- `isActive(entry)` = present and neither suspended nor known.

**Vacation mode** (setting) pauses new lessons. **Wrap up** ends a session after
the current card. A **14-day review forecast** is shown on the Stats screen, and
burned items can be studied from Extra study.

## A study session (`useStudy`)

Modes: **lesson**, **review**, **practice**.

- **Lesson** — a batch of `newPerLesson` new items (default 5). Teaching cards
  show the answer immediately; on the last card the batch is committed
  (`box 1`, due now), logged as `new`, and the session flows straight into
  reviews.
- **Review** — the due items, shuffled. Ask → check → feedback → next. A wrong
  answer is pushed to the back of the queue and must be cleared to finish.
- **Practice** (and "Extra study": leeches / passed / any learned) — **never
  changes the schedule**.

Feedback actions: **Undo** (restore the previous entry), **Suspend**,
**I know this**, and **I was right (typo)** for a wrong answer.

## Judging answers

`web/src/lib/judge.ts`: cloze compares to `answer` (+ `alt`); vocab compares to
`de`. Normalisation folds case, umlauts (`ä→ae` …) and trailing punctuation. For
nouns, a wrong answer that is right except for the article gets a targeted hint
("Add the article. It is der."). Dictation and Translate use the lenient
sentence grader in `lib/grade.ts` (`equals`, `tokenSimilarity`).

## Audio

`web/src/lib/tts.ts` wraps the Web Speech API with a German (`de-DE`) voice
(`speechSynthesis`). No downloads, no keys. Honours the `voice` setting.

## Selectors

`web/src/lib/selectors.ts` derives everything from `{ deck, progress }`:
`itemsOfLevel`, `levelStats`, `unlocked`, `dueIds`, `newAvailableCount`,
`availableIds`.

## History & stats

`web/src/lib/stats.ts` keeps a per-day log `{ new, reviews }` and computes
`streak`, `totals`, `recentDays` (heatmap). `lib/projection.ts` estimates finish
dates and review load (`reviews/day ≈ newPerDay × 7`).

## Separate tracks (gender / plural)

Every noun in the deck also generates two extra SRS items (kinds `gender` and
`plural`): type the article for a bare noun, or type the plural form. This
mirrors WaniKani's meaning-vs-reading split — the same noun is drilled as
vocabulary, as gender, and as plural, each on its own schedule. Curated nouns
and the frequency deck both do this; the auto deck's tracks live in
`Core nouns: gender` / `Core nouns: plural` groups (issue #78). Case drills
remain a future item.

## Known gaps (roadmap)

See [roadmap.md](roadmap.md): **case drills** and a true CEFR path (#51) remain.
Leech auto-suspend, vacation mode, the review forecast, wrap-up, burned-item
study (#49) and the gender/plural tracks (#50) are implemented.
