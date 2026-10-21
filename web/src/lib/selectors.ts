import type { Deck } from "./data";
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

export function dueIds(deck: Deck, p: Progress, now = Date.now()): string[] {
  return Object.keys(p.p).filter((id) => deck.by[id] && isActive(p.p[id]) && p.p[id].due <= now);
}

/**
 * Active items due within the next `withinMs` (default 24h), soonest first.
 * Used to "study ahead" of schedule (issue #77).
 */
export function upcomingIds(deck: Deck, p: Progress, now = Date.now(), withinMs = 86400e3): string[] {
  return Object.keys(p.p)
    .filter((id) => deck.by[id] && isActive(p.p[id]) && p.p[id].due > now && p.p[id].due <= now + withinMs)
    .sort((a, b) => p.p[a].due - p.p[b].due);
}

export function newAvailableCount(deck: Deck, p: Progress): number {
  if (p.settings.vacation) return 0;
  let n = 0;
  deck.levels.forEach((_, i) => {
    if (!unlocked(deck, i, p)) return;
    for (const id of itemsOfLevel(deck, i)) if (!p.p[id]) n++;
  });
  return n;
}

export function availableIds(deck: Deck, p: Progress, limit = Infinity): string[] {
  const out: string[] = [];
  if (p.settings.vacation) return out;
  for (let i = 0; i < deck.levels.length; i++) {
    if (!unlocked(deck, i, p)) continue;
    for (const id of itemsOfLevel(deck, i)) {
      if (!p.p[id]) {
        out.push(id);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}
