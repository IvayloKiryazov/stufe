export const HOUR = 3600e3;

/**
 * Bunpro SRS: 12 levels. `INTERVALS[n-1]` is the wait (hours) to go from level
 * `n` to `n+1` (4h, 8h, 24h, 2d, 4d, 8d, 2w, 4w, 8w, 4mo, 6mo). Level 12 is
 * "Master" (burned): no further reviews.
 */
export const INTERVALS = [4, 8, 24, 48, 96, 192, 336, 672, 1344, 2880, 4320];
export const MAX_BOX = 12;
/** An item counts as "passed" from Adept 2 up (drives level unlocking). */
export const PASS_BOX = 5;
export const PASS_RATIO = 0.8;
export const LEECH_THRESHOLD = 8;

export interface Entry {
  box: number;
  due: number;
  lapses?: number;
  reps?: number;
  last?: number;
  hist?: number[];
  suspended?: boolean;
  known?: boolean;
}

export function nextBox(box: number, ok: boolean): number {
  return ok ? Math.min(MAX_BOX, box + 1) : Math.max(1, box - 1);
}

function waitHours(fromBox: number): number {
  return INTERVALS[Math.min(Math.max(fromBox - 1, 0), INTERVALS.length - 1)];
}

export function applyGrade(entry: Entry | null | undefined, ok: boolean, now: number): Entry {
  const e: Entry = entry ?? { box: 0, due: 0, lapses: 0, reps: 0, hist: [] };
  const prev = e.box || 0;
  const box = nextBox(prev, ok);
  const mastered = box >= MAX_BOX;
  const hist = (e.hist ?? []).slice(-9);
  hist.push(ok ? 1 : 0);
  return {
    box,
    due: mastered ? now : now + (ok ? waitHours(prev) : waitHours(box)) * HOUR,
    lapses: (e.lapses ?? 0) + (ok ? 0 : 1),
    reps: (e.reps ?? 0) + 1,
    last: now,
    hist,
    suspended: false,
    known: false,
  };
}

export function isActive(e?: Entry | null): boolean {
  return !!e && !e.suspended && !e.known && (e.box ?? 0) < MAX_BOX;
}

export function suspend(e: Entry): Entry {
  return { ...e, suspended: true };
}
export function resume(e: Entry): Entry {
  return { ...e, suspended: false };
}
export function markKnown(e: Entry): Entry {
  return { ...e, known: true, suspended: false, box: MAX_BOX };
}
/** Reset an item's schedule: back to box 1, due now, lapses cleared. */
export function resetEntry(e: Entry, now: number): Entry {
  return {
    box: 1,
    due: now,
    lapses: 0,
    reps: e.reps ?? 0,
    last: now,
    hist: e.hist ?? [],
    suspended: false,
    known: false,
  };
}
export function passed(e?: Entry | null): boolean {
  return !!e && e.box >= PASS_BOX;
}
