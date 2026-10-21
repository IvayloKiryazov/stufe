import { describe, expect, it } from "vitest";
import { STAGES, stageName } from "./stages";

describe("stageName", () => {
  it("maps Bunpro SRS levels to stage names", () => {
    expect(stageName(0)).toBe("New");
    expect(stageName(1)).toBe("Beginner");
    expect(stageName(3)).toBe("Beginner");
    expect(stageName(4)).toBe("Adept");
    expect(stageName(6)).toBe("Adept");
    expect(stageName(7)).toBe("Seasoned");
    expect(stageName(9)).toBe("Seasoned");
    expect(stageName(10)).toBe("Expert");
    expect(stageName(11)).toBe("Expert");
    expect(stageName(12)).toBe("Master");
  });
  it("clamps out-of-range boxes", () => {
    expect(stageName(-3)).toBe("New");
    expect(stageName(99)).toBe("Master");
  });
  it("covers 1..12 contiguously", () => {
    const covered: number[] = [];
    for (const s of STAGES) for (let b = s.min; b <= s.max; b++) covered.push(b);
    expect(covered).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
