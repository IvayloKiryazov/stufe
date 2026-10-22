import { describe, expect, it } from "vitest";
import type { Item } from "./data";
import { searchItems } from "./search";

const items: Item[] = [
  { id: "1", level: "a1", group: "g", groupName: "People", kind: "noun", de: "der Mann", en: "man" },
  { id: "2", level: "a1", group: "g", groupName: "Food", kind: "noun", de: "das Wasser", en: "water" },
  { id: "3", level: "a2", group: "gg", groupName: "Perfekt", kind: "cloze", prompt: "Ich ___", answer: "habe", en: "I have" },
  { id: "4", level: "a1", group: "g", groupName: "der Mann", kind: "gender", prompt: "Mann", answer: "der", de: "der Mann", en: "man" },
];

describe("searchItems", () => {
  it("needs at least two characters", () => {
    expect(searchItems(items, "m")).toEqual([]);
  });
  it("finds German words (umlaut-folded) and excludes drill tracks", () => {
    const res = searchItems(items, "mann");
    expect(res.map((i) => i.id)).toEqual(["1"]);
  });
  it("finds by English", () => {
    expect(searchItems(items, "water").map((i) => i.id)).toEqual(["2"]);
  });
  it("finds grammar points by group name", () => {
    expect(searchItems(items, "perfekt").map((i) => i.id)).toEqual(["3"]);
  });
});
