import type { Deck, Group } from "./data";
import { deckEnabled, deckKeyOfGroup, deckKeyOfItem, newRemaining } from "./decks";
import { PASS_RATIO, isActive, passed } from "./srsCore";
import type { Progress } from "./store";

export function itemsOfLevel(deck: Deck, i: number): string[] {
  return deck.levels[i].groups.flatMap((g) => g.items);
}

export function levelStats(deck: Deck, i: number, p: Progress) {
  const ids = itemsOfLevel(deck, i);
  let started = 0;
  let passedCount = 0;
  for (const id of ids) {
    if (p.p[id]) {
      started++;
      if (passed(p.p[id])) passedCount++;
    }
  }
  return { total: ids.length, started, passed: passedCount };
}

export function unlocked(deck: Deck, i: number, p: Progress): boolean {
  if (p.settings.unlockAll || i === 0) return true;
  const s = levelStats(deck, i - 1, p);
  if (!s.total) return true;
  return s.passed / s.total >= PASS_RATIO;
}

function activeItem(deck: Deck, p: Progress, id: string): boolean {
  const it = deck.by[id];
  return !!it && deckEnabled(p, deckKeyOfItem(it)) && isActive(p.p[id]);
}

export function dueIds(deck: Deck, p: Progress, now = Date.now()): string[] {
  return Object.keys(p.p).filter((id) => activeItem(deck, p, id) && p.p[id].due <= now);
}

/**
 * Active items due within the next `withinMs` (default 24h), soonest first.
 * Used to "study ahead" of schedule (issue #77).
 */
export function upcomingIds(deck: Deck, p: Progress, now = Date.now(), withinMs = 86400e3): string[] {
  return Object.keys(p.p)
    .filter((id) => activeItem(deck, p, id) && p.p[id].due > now && p.p[id].due <= now + withinMs)
    .sort((a, b) => p.p[a].due - p.p[b].due);
}

function remainingByDeck(deck: Deck, p: Progress, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  const seen = new Set<string>();
  for (const L of deck.levels) {
    for (const g of L.groups) {
      const key = deckKeyOfGroup(g);
      if (seen.has(key)) continue;
      seen.add(key);
      out[key] = newRemaining(p, key, now);
    }
  }
  return out;
}

export function availableIds(deck: Deck, p: Progress, limit = Infinity): string[] {
  const out: string[] = [];
  if (p.settings.vacation) return out;
  const now = Date.now();
  const remaining = remainingByDeck(deck, p, now);
  for (let i = 0; i < deck.levels.length; i++) {
    if (!unlocked(deck, i, p)) continue;
    for (const g of deck.levels[i].groups) {
      const key = deckKeyOfGroup(g);
      if (!deckEnabled(p, key)) continue;
      for (const id of g.items) {
        if (p.p[id]) continue;
        if ((remaining[key] ?? 0) <= 0) break;
        out.push(id);
        remaining[key] = (remaining[key] ?? 0) - 1;
        if (out.length >= limit) return out;
      }
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function newAvailableCount(deck: Deck, p: Progress): number {
  if (p.settings.vacation) return 0;
  return availableIds(deck, p).length;
}

export interface NextUp {
  levelIdx: number;
  group: Group;
}

/** The next incomplete course group (the "up next" on Today). */
export function nextUp(deck: Deck, p: Progress): NextUp | null {
  for (let i = 0; i < deck.levels.length; i++) {
    for (const g of deck.levels[i].groups) {
      if (g.name.startsWith("Core ")) continue; // course only
      if (!deckEnabled(p, deckKeyOfGroup(g))) continue;
      const done = g.items.filter((id) => passed(p.p[id])).length;
      if (g.items.length === 0 || done < g.items.length) return { levelIdx: i, group: g };
    }
  }
  return null;
}
