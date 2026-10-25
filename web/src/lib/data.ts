export type Kind = "noun" | "verb" | "adj" | "cloze" | "gender" | "plural" | "case" | "vocab-cloze";

export interface Conjugation {
  present: string[];
  preterite: string;
  participle: string;
}

export interface SourceRef {
  kind: "tatoeba" | "wiktionary" | "content" | "derived" | string;
  url?: string;
  word?: string;
  id?: number;
  from?: string;
}

export interface Item {
  id: string;
  level: string;
  group: string;
  groupName: string;
  kind: Kind;
  intro?: string;
  de?: string;
  en?: string;
  plural?: string;
  forms?: string;
  ipa?: string;
  audio?: string;
  mnemonic?: string;
  prompt?: string;
  answer?: string;
  alt?: string[];
  hint?: string;
  note?: string;
  sentence_de?: string;
  sentence_en?: string;
  examples?: { de: string; en: string }[];
  attribution?: string;
  source?: string;
  sourceRef?: SourceRef;
  exampleStatus?: "missing";
  freqRank?: number;
  conjugation?: Conjugation;
}

export interface Group {
  id: string;
  name: string;
  subtitle?: string;
  kind: string;
  intro: string;
  items: string[];
}

export interface Level {
  id: string;
  name: string;
  title: string;
  groups: Group[];
}

export interface Question {
  q: string;
  options: string[];
  answer: number;
}

export interface Reading {
  id: string;
  title: string;
  text: string;
  level: string;
  glossary: [string, string][];
  questions: Question[];
}

export interface Deck {
  levels: Level[];
  by: Record<string, Item>;
  reading: Reading[];
}

const by: Record<string, Item> = {};
const loadedLevels = new Set<string>();
const inFlight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

/** Subscribe to deck growth (items arriving per level). Returns an unsubscribe. */
export function subscribeDeck(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of listeners) l();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} (${res.status})`);
  return (await res.json()) as T;
}

/**
 * Load one level's items into the shared index. Idempotent and safe to call
 * repeatedly; concurrent calls share a single request. Emits on completion.
 */
export function ensureLevel(levelId: string): Promise<void> {
  if (loadedLevels.has(levelId)) return Promise.resolve();
  const pending = inFlight.get(levelId);
  if (pending) return pending;
  const p = fetchJson<Item[]>(`data/items/${levelId}.json`)
    .then((items) => {
      for (const it of items) by[it.id] = it;
      loadedLevels.add(levelId);
      emit();
    })
    .finally(() => {
      inFlight.delete(levelId);
    });
  inFlight.set(levelId, p);
  return p;
}

export const loadedLevelCount = () => loadedLevels.size;

/**
 * Load the level index and reading passages, then stream the per-level item
 * files in the background so the first screen paints without the whole deck.
 * Cross-level screens fill in as `by` grows (see `subscribeDeck`).
 */
export async function loadDeck(): Promise<Deck> {
  const [levels, reading] = await Promise.all([
    fetchJson<Level[]>("data/levels.json"),
    fetchJson<Reading[]>("data/reading.json").catch(() => [] as Reading[]),
  ]);
  for (const L of levels) void ensureLevel(L.id).catch(() => {});
  return { levels, by, reading };
}
