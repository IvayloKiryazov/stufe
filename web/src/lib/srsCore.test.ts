import { describe, expect, it } from "vitest";
import { HOURS, applyGrade, isActive, markKnown, nextBox, passed, resume, suspend } from "./srsCore";

const NOW = 1000000;

describe("srsCore", () => {
  it("moves the box up on success and down on failure", () => {
    expect(nextBox(0, true)).toBe(1);
    expect(nextBox(7, true)).toBe(7);
    expect(nextBox(3, false)).toBe(2);
    expect(nextBox(5, false)).toBe(3);
  });
  it("records reps, lapses and history", () => {
    let e = applyGrade(null, true, NOW);
    expect(e.box).toBe(1);
    expect(e.reps).toBe(1);
    expect(e.lapses).toBe(0);
    expect(e.hist).toEqual([1]);
    expect(e.due).toBe(NOW + HOURS[1] * 3600000);
    e = applyGrade(e, false, NOW);
    expect(e.lapses).toBe(1);
    expect(e.hist).toEqual([1, 0]);
    expect(e.box).toBe(1);
  });
  it("caps history at 10", () => {
    let e = applyGrade(null, true, NOW);
    for (let i = 0; i < 15; i++) e = applyGrade(e, i % 2 === 0, NOW);
    expect(e.hist).toHaveLength(10);
  });
  it("suspend/resume/known toggle activity", () => {
    let e = applyGrade(null, true, NOW);
    expect(isActive(e)).toBe(true);
    e = suspend(e);
    expect(isActive(e)).toBe(false);
    e = resume(e);
    expect(isActive(e)).toBe(true);
    e = markKnown(e);
    expect(isActive(e)).toBe(false);
    expect(e.box).toBe(7);
  });
  it("passed at box >= 3", () => {
    expect(passed({ box: 2, due: 0 })).toBe(false);
    expect(passed({ box: 3, due: 0 })).toBe(true);
  });
});
