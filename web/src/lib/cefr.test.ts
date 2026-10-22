import { describe, expect, it } from "vitest";
import { CAN_DO, EXAM, SKILLS } from "./cefr";

describe("cefr reference", () => {
  it("has can-do statements and exam alignment for every level", () => {
    for (const level of ["a1", "a2", "b1", "b2", "c1", "c2"]) {
      expect(CAN_DO[level]?.length ?? 0).toBeGreaterThan(0);
      expect(EXAM[level]).toBeTruthy();
    }
  });
  it("lists the skills the app drills", () => {
    expect(SKILLS.length).toBeGreaterThan(0);
  });
});
