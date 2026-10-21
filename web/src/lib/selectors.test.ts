import { describe, expect, it } from "vitest";
import type { Deck } from "./data";
import { dueIds, upcomingIds } from "./selectors";
import type { Entry } from "./srsCore";
import type { Progress } from "./store";

const deck: Deck = {
  levels: [],
  reading: [],
  by: {
    a: { id: "a", level: "a1", group: "g", groupName: "G", kind: "noun" },
    b: { id: "b", level: "a1", group: "g", groupName: "G", kind: "noun" },
    c: { id: "c", level: "a1", group: "g", groupName: "G", kind: "noun" },
  },
};

const mk = (p: Record<string, Entry>) => ({ p, history: {}, settings: {} }) as unknown as Progress;

const HOUR = 3600e3;
const NOW = 1_000_000_000;

describe("selectors: due / upcoming", () => {
  const p = mk({
    a: { box: 2, due: NOW - 1000 },
    b: { box: 2, due: NOW + 2 * HOUR },
    c: { box: 2, due: NOW + 30 * HOUR },
  });

  it("dueIds returns only items due now or earlier", () => {
    expect(dueIds(deck, p, NOW)).toEqual(["a"]);
  });

  it("upcomingIds returns soonest-first within the window only", () => {
    expect(upcomingIds(deck, p, NOW, 24 * HOUR)).toEqual(["b"]);
    expect(upcomingIds(deck, p, NOW, 48 * HOUR)).toEqual(["b", "c"]);
  });

  it("excludes suspended items", () => {
    const suspended = mk({ b: { box: 2, due: NOW + HOUR, suspended: true } });
    expect(upcomingIds(deck, suspended, NOW, 24 * HOUR)).toEqual([]);
  });
});
