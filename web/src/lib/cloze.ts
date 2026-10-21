export interface Blanked {
  before: string;
  match: string;
  after: string;
}

/** Find `word` as a whole word in `sentence` (case-insensitive). */
export function blankWord(sentence: string, word: string): Blanked | null {
  if (!sentence || !word) return null;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`\\b${escaped}\\b`, "i").exec(sentence);
  if (!m) return null;
  return {
    before: sentence.slice(0, m.index),
    match: m[0],
    after: sentence.slice(m.index + m[0].length),
  };
}

/** Rotate through examples by review count (deterministic, varies over time). */
export function pickIndex(length: number, reps: number): number {
  return length > 0 ? ((reps % length) + length) % length : 0;
}
