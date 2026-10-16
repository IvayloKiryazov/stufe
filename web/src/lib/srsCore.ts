export const HOURS = [0, 4, 8, 24, 72, 168, 336, 720];
const HOUR = 3600e3;
export const PASS_BOX = 3;
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
  return ok ? Math.min(7, box + 1) : Math.max(1, box - (box >= 5 ? 2 : 1));
}

export function applyGrade(entry: Entry | null | undefined, ok: boolean, now: number): Entry {
  const e: Entry = entry ?? { box: 0, due: 0, lapses: 0, reps: 0, hist: [] };
  const box = nextBox(e.box || 0, ok);
  const hist = (e.hist ?? []).slice(-9);
  hist.push(ok ? 1 : 0);
  return {
    box,
    due: now + HOURS[box] * HOUR,
    lapses: (e.lapses ?? 0) + (ok ? 0 : 1),
    reps: (e.reps ?? 0) + 1,
    last: now,
    hist,
    suspended: false,
    known: false,
  };
}

export function isActive(e?: Entry | null): boolean {
  return !!e && !e.suspended && !e.known;
}

export function suspend(e: Entry): Entry {
  return { ...e, suspended: true };
}
export function resume(e: Entry): Entry {
  return { ...e, suspended: false };
}
export function markKnown(e: Entry): Entry {
  return { ...e, known: true, suspended: false, box: 7 };
}
export function passed(e?: Entry | null): boolean {
  return !!e && e.box >= PASS_BOX;
}
