import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureLevel, loadDeck, subscribeDeck, type Item, type Level } from "./data";

const LEVELS: Level[] = [
  {
    id: "a1",
    name: "A1",
    title: "Beginner",
    groups: [{ id: "g1", name: "G", kind: "noun", intro: "", items: ["x"] }],
  },
];

const ITEMS_A1: Item[] = [
  { id: "x", level: "a1", group: "g1", groupName: "G", kind: "noun", de: "der X", en: "x" },
];

function mockFetch(map: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const key = String(url);
    if (key in map) return { ok: true, json: async () => map[key] } as Response;
    return { ok: false, status: 404, json: async () => null } as Response;
  });
}

describe("data loader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads levels + reading eagerly and items lazily per level", async () => {
    globalThis.fetch = mockFetch({
      "data/levels.json": LEVELS,
      "data/reading.json": [],
      "data/items/a1.json": ITEMS_A1,
    }) as unknown as typeof fetch;

    const events = vi.fn();
    const unsubscribe = subscribeDeck(events);

    const deck = await loadDeck();
    expect(deck.levels).toHaveLength(1);
    expect(deck.reading).toEqual([]);

    await ensureLevel("a1");
    expect(deck.by["x"]?.en).toBe("x");
    expect(events).toHaveBeenCalled();

    unsubscribe();
  });
});
