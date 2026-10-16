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

export function tokenSimilarity(a: string, b: string): number {
  const A = normalizeSentence(a).split(" ").filter(Boolean);
  const B = normalizeSentence(b).split(" ").filter(Boolean);
  if (!A.length || !B.length) return 0;
  const setA = new Set(A);
  const setB = new Set(B);
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  const union = setA.size + setB.size - inter;
  return union ? inter / union : 0;
}
