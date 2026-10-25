import { applyGrade, isActive, markKnown as srsMarkKnown, resetEntry, resume as srsResume, suspend as srsSuspend, LEECH_THRESHOLD, type Entry } from "./srsCore";
import { bump, dayKey, type History } from "./stats";

export type Lang = "en" | "de";
export type DeckKey = "course" | "core" | "gender" | "plural" | "case" | "cloze";
export type PracticeSkill = "reading" | "listening" | "dictation" | "translate" | "writing" | "speaking";

export interface DeckPrefs {
  enabled: boolean;
  newPerDay: number;
}

export interface Settings {
  unlockAll: boolean;
  voice: boolean;
  autoSpeak: boolean;
  newPerLesson: number;
  goalNew: number;
  goalReviews: number;
  fontScale: number;
  vacation: boolean;
  reminders: boolean;
  language: Lang;
  decks: Record<DeckKey, DeckPrefs>;
}

export interface PracticeStat {
  attempts: number;
  correct: number;
}

export interface Progress {
  v: number;
  p: Record<string, Entry>;
  history: History;
  settings: Settings;
  /** Best-effort practice accuracy per modality (not SRS). */
  practice: Record<string, PracticeStat>;
  /** User-authored mnemonics, keyed by item id. */
  notes: Record<string, string>;
  /** New items started today, per deck (day -> deck -> count). */
  newDecks: Record<string, Record<string, number>>;
}

export const DECKS: DeckKey[] = ["course", "core", "gender", "plural", "case", "cloze"];

function defaultDecks(): Record<DeckKey, DeckPrefs> {
  return {
    course: { enabled: true, newPerDay: 5 },
    core: { enabled: true, newPerDay: 5 },
    gender: { enabled: true, newPerDay: 5 },
    plural: { enabled: true, newPerDay: 5 },
    case: { enabled: true, newPerDay: 5 },
    cloze: { enabled: true, newPerDay: 5 },
  };
}

export const DEFAULT_SETTINGS: Settings = {
  unlockAll: false,
  voice: true,
  autoSpeak: false,
  newPerLesson: 5,
  goalNew: 20,
  goalReviews: 50,
  fontScale: 1,
  vacation: false,
  reminders: false,
  language: "en",
  decks: defaultDecks(),
};

const KEY = "stufe-progress-v2";
const VERSION = 3;

function defaults(): Progress {
  return {
    v: VERSION,
    p: {},
    history: {},
    settings: structuredClone(DEFAULT_SETTINGS),
    practice: {},
    notes: {},
    newDecks: {},
  };
}

/** Old 7-box schedules -> the 12-level Bunpro ladder (approximate). */
function migrateBox(box: number): number {
  if (!box || box <= 0) return 0;
  return Math.max(1, Math.min(12, Math.round((box * 12) / 7)));
}

function migrate(raw: unknown): Progress {
  const o = (raw ?? {}) as Partial<Progress> & { settings?: Partial<Settings> };
  const out = defaults();
  out.history = o.history ?? {};
  out.settings = {
    ...DEFAULT_SETTINGS,
    ...(o.settings ?? {}),
    decks: { ...defaultDecks(), ...(o.settings?.decks ?? {}) },
  };
  const entries: Record<string, Entry> = {};
  for (const [id, entry] of Object.entries(o.p ?? {})) {
    entries[id] = { ...entry, box: migrateBox(entry.box ?? 0) };
  }
  out.p = entries;
  out.practice = o.practice ?? {};
  out.notes = o.notes ?? {};
  out.newDecks = o.newDecks ?? {};
  return out;
}

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return migrate(JSON.parse(raw));
  } catch {
    return defaults();
  }
}

let state: Progress = read();
const listeners = new Set<() => void>();

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot(): Progress {
  return state;
}
function commit(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l());
}

export const store = {
  subscribe,
  getSnapshot,
  get state() {
    return state;
  },
  setEntry(id: string, entry: Entry) {
    commit({ ...state, p: { ...state.p, [id]: entry } });
  },
  /** Grade an item; returns the previous entry (for undo). */
  grade(id: string, ok: boolean): Entry | null {
    const prev = state.p[id] ?? null;
    let next = applyGrade(prev, ok, Date.now());
    if ((next.lapses ?? 0) >= LEECH_THRESHOLD) next = { ...next, suspended: true };
    commit({ ...state, p: { ...state.p, [id]: next } });
    return prev;
  },
  restore(id: string, prev: Entry | null) {
    if (prev) commit({ ...state, p: { ...state.p, [id]: prev } });
  },
  suspend(id: string) {
    const e = state.p[id];
    if (e) commit({ ...state, p: { ...state.p, [id]: srsSuspend(e) } });
  },
  resume(id: string) {
    const e = state.p[id];
    if (e) commit({ ...state, p: { ...state.p, [id]: srsResume(e) } });
  },
  markKnown(id: string) {
    const e = state.p[id] ?? { box: 0, due: 0 };
    commit({ ...state, p: { ...state.p, [id]: srsMarkKnown(e) } });
  },
  /** Bulk placement helper: mark many items known at once. */
  markKnownMany(ids: string[]) {
    if (!ids.length) return;
    const p = { ...state.p };
    for (const id of ids) {
      const e = p[id] ?? { box: 0, due: 0 };
      p[id] = srsMarkKnown(e);
    }
    commit({ ...state, p });
  },
  /** Manually reschedule an item (set its due timestamp). */
  reschedule(id: string, due: number) {
    const e = state.p[id];
    if (e) commit({ ...state, p: { ...state.p, [id]: { ...e, due } } });
  },
  /** Reset an item's schedule (box 1, due now, lapses cleared). */
  resetItem(id: string) {
    const e = state.p[id];
    if (e) commit({ ...state, p: { ...state.p, [id]: resetEntry(e, Date.now()) } });
  },
  isActive(id: string) {
    return isActive(state.p[id]);
  },
  setNote(id: string, text: string) {
    const notes = { ...state.notes };
    const clean = text.trim();
    if (clean) notes[id] = clean;
    else delete notes[id];
    commit({ ...state, notes });
  },
  logPractice(skill: PracticeSkill, ok: boolean, level?: string) {
    const key = level ? `${skill}:${level}` : skill;
    const prev = state.practice[key] ?? { attempts: 0, correct: 0 };
    commit({
      ...state,
      practice: {
        ...state.practice,
        [key]: { attempts: prev.attempts + 1, correct: prev.correct + (ok ? 1 : 0) },
      },
    });
  },
  logNewDeck(counts: Partial<Record<DeckKey, number>>) {
    const today = dayKey(Date.now());
    const day = { ...(state.newDecks[today] ?? {}) };
    for (const [deck, n] of Object.entries(counts)) {
      if (n) day[deck] = (day[deck] ?? 0) + n;
    }
    commit({ ...state, newDecks: { ...state.newDecks, [today]: day } });
  },
  log(kind: "new" | "reviews", n = 1) {
    commit({ ...state, history: bump(state.history, kind, Date.now(), n) });
  },
  setSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },
  setDeck(deck: DeckKey, patch: Partial<DeckPrefs>) {
    commit({
      ...state,
      settings: {
        ...state.settings,
        decks: { ...state.settings.decks, [deck]: { ...state.settings.decks[deck], ...patch } },
      },
    });
  },
  reset() {
    commit(defaults());
  },
  export() {
    return JSON.stringify(state, null, 2);
  },
  import(text: string) {
    commit(migrate(JSON.parse(text)));
  },
};

export { VERSION as PROGRESS_VERSION, migrate as migrateProgress };
