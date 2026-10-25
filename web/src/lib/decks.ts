import type { Group, Item } from "./data";
import type { DeckKey, Progress } from "./store";
import { dayKey } from "./stats";

/** Map a study group to the user-visible deck/track it belongs to. */
export function deckKeyOfGroup(g: Group): DeckKey {
  if (g.kind === "gender" || g.kind === "plural" || g.kind === "case" || g.kind === "vocab-cloze") {
    return (g.kind === "vocab-cloze" ? "cloze" : g.kind) as DeckKey;
  }
  if (g.name.startsWith("Core ")) return "core";
  return "course";
}

export function deckKeyOfItem(it: Item): DeckKey {
  if (it.kind === "gender" || it.kind === "plural" || it.kind === "case" || it.kind === "vocab-cloze") {
    return (it.kind === "vocab-cloze" ? "cloze" : it.kind) as DeckKey;
  }
  if (it.groupName.startsWith("Core ")) return "core";
  return "course";
}

export function deckEnabled(p: Progress, key: DeckKey): boolean {
  return p.settings.decks?.[key]?.enabled !== false;
}

/** New items already started today for this deck. */
export function newToday(p: Progress, key: DeckKey, now = Date.now()): number {
  return p.newDecks?.[dayKey(now)]?.[key] ?? 0;
}

/** Remaining new allowance for this deck today. */
export function newRemaining(p: Progress, key: DeckKey, now = Date.now()): number {
  const cap = p.settings.decks?.[key]?.newPerDay ?? 0;
  return Math.max(0, cap - newToday(p, key, now));
}
