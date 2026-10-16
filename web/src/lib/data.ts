export type Kind = "noun" | "verb" | "adj" | "cloze";

export interface Conjugation {
  present: string[];
  preterite: string;
  participle: string;
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
  mnemonic?: string;
  prompt?: string;
  answer?: string;
  alt?: string[];
  hint?: string;
  note?: string;
  sentence_de?: string;
  sentence_en?: string;
  attribution?: string;
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

const cache = new Map<string, unknown>();

async function load<T>(name: string): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;
  const res = await fetch(`data/${name}`);
  if (!res.ok) throw new Error(`${name} (${res.status})`);
  const json = (await res.json()) as T;
  cache.set(name, json);
  return json;
}

export const loadLevels = () => load<Level[]>("levels.json");
export const loadItems = () => load<Item[]>("items.json");
export const loadReading = () => load<Reading[]>("reading.json").catch(() => [] as Reading[]);

export async function loadDeck(): Promise<Deck> {
  const [levels, items, reading] = await Promise.all([loadLevels(), loadItems(), loadReading()]);
  const by: Record<string, Item> = {};
  for (const i of items) by[i.id] = i;
  return { levels, by, reading };
}
