# SRS & study

## The scheduling model

A staged (Leitner) model with fixed intervals — the same shape as
WaniKani/Bunpro, not an adaptive SM-2/FSRS.

Implementation: `web/src/lib/srsCore.ts`.

- SRS levels **1–12** (box 0 = not yet learned). Each level has a fixed wait
  before the next review — **Bunpro's ladder**:

  | level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
  | --- | - | - | - | - | - | - | - | - | - | -- | -- | -- |
  | wait to next | 4h | 8h | 24h | 2d | 4d | 8d | 2w | 4w | 8w | 4mo | 6mo | – |

- **Correct** → level + 1 (capped at 12). **Wrong** → level − 1 (floor 1):
  Bunpro drops a single level per wrong answer (repeated misses become ghosts).
- `PASS_BOX = 5` (an item is "passed" from Adept 2 up). A level unlocks when
  **80 %** (`PASS_RATIO`) of the previous level is passed.
- Level **12 = Master** ("burned"): no further reviews; still drillable from
  Extra study.
- Every entry also tracks `lapses` (wrong count), `reps`, `last` and a short
  `hist` (last 10 grades, shown as dots on the card).

### Stages (named, Bunpro-style)

`web/src/lib/stages.ts` maps SRS levels to names:

| levels | stage |
| --- | --- |
| 1–3 | Beginner |
| 4–6 | Adept |
| 7–9 | Seasoned |
| 10–11 | Expert |
| 12 | Master |

### Entry state

```ts
interface Entry { box; due; lapses?; reps?; last?; hist?: number[];
                  suspended?: boolean; known?: boolean }
```

- **suspend** — excluded from reviews/lessons until resumed. An item is
  **auto-suspended** once it reaches `LEECH_THRESHOLD` (8) lapses.
- **known** — marked as known; Master (level 12) and excluded.
- `isActive(entry)` = present and neither suspended nor known.

**Vacation mode** (setting) pauses new lessons. **Wrap up** ends a session after
the current card. A **14-day review forecast** is shown on the Stats screen, and
burned items can be studied from Extra study. **Study ahead** reviews items due
later (next 24h) and still counts; an item's schedule can be **reset** (back to
box 1, due now) from the feedback actions (#77).

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
**I know this**, **Reset** (schedule to box 1, due now), and
**I was right (typo)** for a wrong answer.

## Judging answers

`web/src/lib/judge.ts`: cloze compares to `answer` (+ `alt`); vocab compares to
`de`. Normalisation folds case, umlauts (`ä→ae` …) and trailing punctuation. For
nouns, a wrong answer that is right except for the article gets a targeted hint
("Add the article. It is der."). Dictation and Translate use the lenient
sentence grader in `lib/grade.ts` (`equals`, `tokenSimilarity`).

## Audio

`web/src/lib/tts.ts`. Vocabulary items carry a **native recording** URL from
Wiktionary/kaikki (Wikimedia Commons, ~98 % coverage); `speakItem()` plays it
and falls back to the Web Speech API (`speechSynthesis`, German `de-DE`) for
sentences and words without a recording. No keys, no downloads.

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
`Core nouns: gender` / `Core nouns: plural` groups (issue #78). Curated nouns
also get a **case track** (`case` kind): type the definite article in the
accusative, dative or genitive (issue #79). Vocabulary words also get a
**cloze track** (`vocab-cloze` kind): type the missing word into one of its
example sentences, which rotate as you review — the meaning card and the cloze
card are separate SRS items (issue #131).

## Known gaps (roadmap)

See [roadmap.md](roadmap.md): **case drills** and a true CEFR path (#51) remain.
Leech auto-suspend, vacation mode, the review forecast, wrap-up, burned-item
study (#49) and the gender/plural tracks (#50) are implemented.
