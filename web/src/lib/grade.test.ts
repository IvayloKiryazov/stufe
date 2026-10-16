import { describe, expect, it } from "vitest";
import { equals, fold, tokenSimilarity } from "./grade";

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
});
