import { describe, expect, it } from "vitest";
import { INTERVALS, MAX_BOX, applyGrade, isActive, markKnown, nextBox, passed, resume, suspend } from "./srsCore";

const NOW = 1000000;
const HOUR = 3600000;

describe("srsCore", () => {
  it("moves the box up on success and down on failure (Bunpro: one level)", () => {
    expect(nextBox(0, true)).toBe(1);
    expect(nextBox(7, true)).toBe(8);
    expect(nextBox(MAX_BOX, true)).toBe(MAX_BOX);
    expect(nextBox(3, false)).toBe(2);
    expect(nextBox(5, false)).toBe(4);
    expect(nextBox(1, false)).toBe(1);
  });
  it("records reps, lapses and history; schedules per the Bunpro ladder", () => {
    let e = applyGrade(null, true, NOW);
    expect(e.box).toBe(1);
    expect(e.reps).toBe(1);
    expect(e.lapses).toBe(0);
    expect(e.hist).toEqual([1]);
    expect(e.due).toBe(NOW + INTERVALS[0] * HOUR); // box 1 -> 2 waits 4h
    e = applyGrade(e, false, NOW);
    expect(e.lapses).toBe(1);
    expect(e.hist).toEqual([1, 0]);
    expect(e.box).toBe(1);
  });
  it("burns at the top level (no further review)", () => {
    let e = { box: MAX_BOX - 1, due: 0 };
    e = applyGrade(e, true, NOW);
    expect(e.box).toBe(MAX_BOX);
    expect(isActive(e)).toBe(false);
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
    expect(e.box).toBe(MAX_BOX);
  });
  it("passed at box >= PASS_BOX (5)", () => {
    expect(passed({ box: 4, due: 0 })).toBe(false);
    expect(passed({ box: 5, due: 0 })).toBe(true);
  });
});
