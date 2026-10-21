import { describe, expect, it } from "vitest";
import { blankWord, pickIndex } from "./cloze";

describe("blankWord", () => {
  it("finds a whole word case-insensitively", () => {
    expect(blankWord("Der Mann ist groß.", "Mann")).toEqual({
      before: "Der ",
      match: "Mann",
      after: " ist groß.",
    });
    expect(blankWord("das Haus", "haus")?.match).toBe("Haus");
  });
  it("does not match substrings", () => {
    expect(blankWord("der Hammer", "Mann")).toBeNull();
  });
  it("returns null when absent or empty", () => {
    expect(blankWord("der Hund", "Katze")).toBeNull();
    expect(blankWord("", "Mann")).toBeNull();
  });
});

describe("pickIndex", () => {
  it("rotates by reps and handles zero length", () => {
    expect(pickIndex(3, 0)).toBe(0);
    expect(pickIndex(3, 4)).toBe(1);
    expect(pickIndex(0, 5)).toBe(0);
  });
});
