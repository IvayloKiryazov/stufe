import { describe, expect, it } from "vitest";
import { MESSAGES, t } from "./i18n";

describe("i18n", () => {
  it("has the same keys in English and German", () => {
    expect(Object.keys(MESSAGES.de).sort()).toEqual(Object.keys(MESSAGES.en).sort());
  });

  it("has no empty messages", () => {
    for (const lang of ["en", "de"] as const) {
      for (const [key, value] of Object.entries(MESSAGES[lang])) {
        expect(value.trim(), `${lang}.${key}`).not.toBe("");
      }
    }
  });

  it("interpolates parameters", () => {
    expect(t("en", "stats.pace", { n: 7 })).toContain("7");
    expect(t("de", "stats.pace", { n: 7 })).toContain("7");
  });
});
