export function daysToFinish(remaining: number, perDay: number): number {
  if (perDay <= 0) return Infinity;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / perDay);
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function reviewLoad(perDay: number, reviewsPerItem = 7): number {
  return Math.round(perDay * reviewsPerItem);
}
