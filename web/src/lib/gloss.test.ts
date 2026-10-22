import { describe, expect, it } from "vitest";
import type { Deck } from "./data";
import { buildGlossIndex, glossFor } from "./gloss";

const deck: Deck = {
  levels: [],
  reading: [],
  by: {
    a: { id: "a", level: "a1", group: "g", groupName: "G", kind: "noun", de: "der Mann", en: "man" },
    b: { id: "b", level: "a1", group: "g", groupName: "G", kind: "verb", de: "gehen", en: "to go" },
    c: { id: "c", level: "a1", group: "g", groupName: "G", kind: "gender", de: "der Mann", en: "man" },
  },
};

describe("gloss", () => {
  it("indexes nouns and verbs (not drill tracks)", () => {
    const index = buildGlossIndex(deck);
    expect(index.get("Mann")?.en).toBe("man");
    expect(index.get("gehen")?.en).toBe("to go");
    expect(index.size).toBe(2);
  });
  it("looks up capitalised tokens", () => {
    const index = buildGlossIndex(deck);
    expect(glossFor(index, "Mann")?.en).toBe("man");
    expect(glossFor(index, "gehen")?.id).toBe("b");
    expect(glossFor(index, "unbekannt")).toBeUndefined();
  });
});
