import type { Item } from "./data";
import { fold } from "./grade";

const SEARCHABLE = new Set(["noun", "verb", "adj", "cloze"]);

/**
 * Search words (German/English) and grammar points (by group name).
 * Derived drill tracks (gender/plural/case/vocab-cloze) are excluded so a word
 * shows up once. Results are ranked: German prefix > English prefix > contains.
 */
export function searchItems(items: Iterable<Item>, query: string, limit = 50): Item[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const qn = fold(q);
  const ql = q.toLowerCase();
  const ranked: { it: Item; rank: number }[] = [];
  for (const it of items) {
    if (!SEARCHABLE.has(it.kind)) continue;
    const de = fold(it.de ?? "");
    const en = (it.en ?? "").toLowerCase();
    const gn = (it.groupName ?? "").toLowerCase();
    let rank = -1;
    if (de && de.startsWith(qn)) rank = 0;
    else if (en.startsWith(ql)) rank = 1;
    else if (de.includes(qn)) rank = 2;
    else if (en.includes(ql)) rank = 3;
    else if (gn.includes(ql)) rank = 4;
    if (rank >= 0) ranked.push({ it, rank });
  }
  ranked.sort(
    (a, b) => a.rank - b.rank || (a.it.de ?? a.it.groupName ?? "").localeCompare(b.it.de ?? b.it.groupName ?? ""),
  );
  return ranked.slice(0, limit).map((x) => x.it);
}
