import { applyGrade, isActive, markKnown as srsMarkKnown, resume as srsResume, suspend as srsSuspend, LEECH_THRESHOLD, type Entry } from "./srsCore";
import { bump, type History } from "./stats";

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
}

export interface Progress {
  p: Record<string, Entry>;
  history: History;
  settings: Settings;
}

const KEY = "stufe-progress-v2";
const DEFAULTS: Progress = {
  p: {},
  history: {},
  settings: {
    unlockAll: false,
    voice: true,
    autoSpeak: false,
    newPerLesson: 5,
    goalNew: 20,
    goalReviews: 50,
    fontScale: 1,
    vacation: false,
    reminders: false,
  },
};

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const o = JSON.parse(raw);
    return {
      p: o.p ?? {},
      history: o.history ?? {},
      settings: { ...DEFAULTS.settings, ...(o.settings ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULTS);
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
  isActive(id: string) {
    return isActive(state.p[id]);
  },
  log(kind: "new" | "reviews", n = 1) {
    commit({ ...state, history: bump(state.history, kind, Date.now(), n) });
  },
  setSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },
  reset() {
    commit(structuredClone(DEFAULTS));
  },
  export() {
    return JSON.stringify(state, null, 2);
  },
  import(text: string) {
    const o = JSON.parse(text);
    commit({
      p: o.p ?? {},
      history: o.history ?? {},
      settings: { ...DEFAULTS.settings, ...(o.settings ?? {}) },
    });
  },
};
