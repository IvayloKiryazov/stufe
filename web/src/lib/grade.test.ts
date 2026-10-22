import { describe, expect, it } from "vitest";
import { equals, fold, tokenSimilarity, wordDiff } from "./grade";

describe("grade", () => {
  it("folds umlauts and sharp s", () => {
    expect(fold("Größe")).toBe("groesse");
    expect(fold("Über")).toBe("ueber");
  });
  it("equals ignores case and punctuation", () => {
    expect(equals("Das ist ein Test.", "das ist ein test")).toBe(true);
    expect(equals("Ich heiße Anna!", "Ich heisse Anna")).toBe(true);
    expect(equals("Der Mann", "die Frau")).toBe(false);
  });
  it("tokenSimilarity is 1 identical, 0 disjoint", () => {
    expect(tokenSimilarity("Ich trinke Kaffee", "ich trinke kaffee")).toBe(1);
    expect(tokenSimilarity("Ich trinke Kaffee", "Der Hund schläft")).toBe(0);
  });
  it("gives partial credit", () => {
    const s = tokenSimilarity("Ich trinke gern Kaffee", "Ich trinke Kaffee");
    expect(s).toBeGreaterThan(0.5);
    expect(s).toBeLessThan(1);
  });
  it("is order-aware: scrambled words score low", () => {
    expect(tokenSimilarity("der Mann ist groß", "groß ist Mann der")).toBeLessThan(0.5);
    expect(tokenSimilarity("Ich trinke gern Kaffee", "Kaffee gern trinke Ich")).toBeLessThan(0.6);
  });
  it("requires the exact order for equality", () => {
    expect(equals("der Mann ist groß", "groß ist Mann der")).toBe(false);
    expect(equals("der Mann ist groß", "der mann ist gross")).toBe(true);
  });
  it("wordDiff reports missing and extra words", () => {
    expect(wordDiff("Ich trinke Kaffee", "Ich trinke gern Kaffee").missing).toEqual(["gern"]);
    const d = wordDiff("Ich trinke Tee gern", "Ich trinke gern Kaffee");
    expect(d.extra).toContain("tee");
    expect(d.missing).toContain("kaffee");
  });
});
