import { describe, expect, it } from "vitest";
import { STAGES, stageName } from "./stages";

describe("stageName", () => {
  it("maps boxes to stage names", () => {
    expect(stageName(0)).toBe("Apprentice");
    expect(stageName(1)).toBe("Apprentice");
    expect(stageName(2)).toBe("Guru");
    expect(stageName(3)).toBe("Guru");
    expect(stageName(4)).toBe("Master");
    expect(stageName(5)).toBe("Enlightened");
    expect(stageName(6)).toBe("Enlightened");
    expect(stageName(7)).toBe("Burned");
  });
  it("clamps out-of-range boxes", () => {
    expect(stageName(-3)).toBe("Apprentice");
    expect(stageName(99)).toBe("Burned");
  });
  it("covers 0..7 contiguously", () => {
    const covered: number[] = [];
    for (const s of STAGES) for (let b = s.min; b <= s.max; b++) covered.push(b);
    expect(covered).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
