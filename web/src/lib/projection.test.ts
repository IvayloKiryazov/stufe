import { describe, expect, it } from "vitest";
import { addDays, daysToFinish, reviewLoad } from "./projection";

describe("projection", () => {
  it("rounds up and handles edges", () => {
    expect(daysToFinish(10, 5)).toBe(2);
    expect(daysToFinish(11, 5)).toBe(3);
    expect(daysToFinish(0, 5)).toBe(0);
    expect(daysToFinish(10, 0)).toBe(Infinity);
  });
  it("addDays moves the date forward", () => {
    const base = new Date(2026, 0, 1).getTime();
    const later = new Date(addDays(base, 10));
    expect(later.getFullYear()).toBe(2026);
    expect(later.getMonth()).toBe(0);
    expect(later.getDate()).toBe(11);
  });
  it("scales review load with pace", () => {
    expect(reviewLoad(5, 7)).toBe(35);
    expect(reviewLoad(0, 7)).toBe(0);
    expect(reviewLoad(20)).toBe(140);
  });
});
