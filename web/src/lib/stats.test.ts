import { describe, expect, it } from "vitest";
import { bump, dayKey, heatmapWeeks, recentDays, streak, totals, type History } from "./stats";

const DAY = 86400000;
const REF = new Date(2026, 2, 10, 12, 0, 0).getTime();

describe("stats", () => {
  it("dayKey is local YYYY-MM-DD", () => {
    expect(dayKey(REF)).toBe("2026-03-10");
  });
  it("bump is immutable and accumulates", () => {
    const h0: History = {};
    const h1 = bump(h0, "new", REF, 5);
    const h2 = bump(h1, "reviews", REF, 3);
    expect(h0).toEqual({});
    expect(h1["2026-03-10"].new).toBe(5);
    expect(h2["2026-03-10"].reviews).toBe(3);
    expect(h2["2026-03-10"].new).toBe(5);
  });
  it("counts a streak", () => {
    let h: History = {};
    h = bump(h, "reviews", REF);
    h = bump(h, "reviews", REF - DAY);
    h = bump(h, "reviews", REF - 2 * DAY);
    expect(streak(h, REF)).toBe(3);
  });
  it("tolerates an empty today", () => {
    let h: History = {};
    h = bump(h, "new", REF - DAY);
    h = bump(h, "new", REF - 2 * DAY);
    expect(streak(h, REF)).toBe(2);
  });
  it("breaks on a gap", () => {
    let h: History = {};
    h = bump(h, "reviews", REF);
    h = bump(h, "reviews", REF - 3 * DAY);
    expect(streak(h, REF)).toBe(1);
  });
  it("totals everything", () => {
    let h: History = {};
    h = bump(h, "new", REF, 4);
    h = bump(h, "reviews", REF, 9);
    h = bump(h, "reviews", REF - DAY, 1);
    expect(totals(h)).toEqual({ new: 4, reviews: 10, days: 2 });
  });
  it("recentDays is a window ending today", () => {
    const h = bump({}, "reviews", REF, 7);
    const days = recentDays(h, 7, REF);
    expect(days).toHaveLength(7);
    expect(days[6].key).toBe("2026-03-10");
    expect(days[6].total).toBe(7);
    expect(days[0].total).toBe(0);
  });
  it("heatmapWeeks builds week columns of 7, ending at today", () => {
    const h = bump({}, "reviews", REF, 5);
    const wk = heatmapWeeks(h, 4, REF);
    expect(wk).toHaveLength(4);
    expect(wk.every((c) => c.length === 7)).toBe(true);
    const today = wk.flat().find((c) => c?.key === "2026-03-10");
    expect(today?.total).toBe(5);
    // days after today in the current week are empty
    expect(wk[3].some((c) => c === null)).toBe(true);
  });
});
