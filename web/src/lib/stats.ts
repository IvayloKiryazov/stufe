export interface DayActivity {
  new: number;
  reviews: number;
}
export type History = Record<string, DayActivity>;

function pad(n: number): string {
  return (n < 10 ? "0" : "") + n;
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function bump(history: History, kind: "new" | "reviews", ts: number, n = 1): History {
  const key = dayKey(ts);
  const prev = history[key] ?? { new: 0, reviews: 0 };
  const day: DayActivity = { new: prev.new ?? 0, reviews: prev.reviews ?? 0 };
  day[kind] = (day[kind] ?? 0) + n;
  return { ...history, [key]: day };
}

export function active(day?: DayActivity): boolean {
  return !!day && (day.new ?? 0) + (day.reviews ?? 0) > 0;
}

export function streak(history: History, nowTs: number): number {
  const d = new Date(nowTs);
  if (!active(history[dayKey(d.getTime())])) d.setDate(d.getDate() - 1);
  let count = 0;
  while (active(history[dayKey(d.getTime())])) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function totals(history: History): { new: number; reviews: number; days: number } {
  let n = 0;
  let r = 0;
  let days = 0;
  for (const k of Object.keys(history)) {
    n += history[k].new ?? 0;
    r += history[k].reviews ?? 0;
    days++;
  }
  return { new: n, reviews: r, days };
}

export interface DayCell {
  key: string;
  new: number;
  reviews: number;
  total: number;
}

export function recentDays(history: History, days: number, nowTs: number): DayCell[] {
  const out: DayCell[] = [];
  const base = new Date(nowTs);
  base.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const h = history[key] ?? { new: 0, reviews: 0 };
    out.push({ key, new: h.new ?? 0, reviews: h.reviews ?? 0, total: (h.new ?? 0) + (h.reviews ?? 0) });
  }
  return out;
}
