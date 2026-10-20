export function fold(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export function normalizeSentence(s: string): string {
  return fold(s)
    .replace(/[.,!?;:„“"()[\]«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function equals(a: string, b: string): boolean {
  return normalizeSentence(a) === normalizeSentence(b);
}

function lcsLength(a: string[], b: string[]): number {
  const n = b.length;
  let prev = new Array<number>(n + 1).fill(0);
  let cur = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  return prev[n];
}

/**
 * Order-aware similarity in [0, 1]: the length of the longest common
 * subsequence of tokens over the longer sentence. Reordered words score low;
 * only identical (normalised) sentences reach 1.
 */
export function tokenSimilarity(a: string, b: string): number {
  const A = normalizeSentence(a).split(" ").filter(Boolean);
  const B = normalizeSentence(b).split(" ").filter(Boolean);
  if (!A.length || !B.length) return 0;
  return lcsLength(A, B) / Math.max(A.length, B.length);
}
