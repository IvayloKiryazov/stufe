import type { Deck, Item } from "./data";

/** headword -> vocabulary item, for looking up a word glossed in a passage. */
export function buildGlossIndex(deck: Deck): Map<string, Item> {
  const index = new Map<string, Item>();
  for (const it of Object.values(deck.by)) {
    if (it.kind === "noun" && it.de) {
      const word = it.de.split(" ", 2)[1];
      if (word) index.set(word, it);
    } else if ((it.kind === "verb" || it.kind === "adj") && it.de) {
      index.set(it.de, it);
    }
  }
  return index;
}

/** Best-effort lookup, trying the token, its lowercase and capitalised form. */
export function glossFor(index: Map<string, Item>, token: string): Item | undefined {
  if (index.has(token)) return index.get(token);
  const lower = token.toLowerCase();
  if (index.has(lower)) return index.get(lower);
  const cap = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  return index.get(cap);
}
