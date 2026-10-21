import { beforeEach, describe, expect, it } from "vitest";
import { LEECH_THRESHOLD } from "./srsCore";
import { store } from "./store";

describe("store leech auto-suspend", () => {
  beforeEach(() => {
    localStorage.clear();
    store.reset();
  });

  it("suspends an item after LEECH_THRESHOLD lapses", () => {
    const id = "x";
    for (let i = 0; i < LEECH_THRESHOLD; i++) store.grade(id, false);
    expect(store.state.p[id].suspended).toBe(true);
  });

  it("does not suspend before the threshold", () => {
    store.grade("y", false);
    expect(store.state.p["y"].suspended).toBeFalsy();
  });
});

describe("store export/import", () => {
  beforeEach(() => {
    localStorage.clear();
    store.reset();
  });

  it("round-trips progress, history and settings", () => {
    store.grade("a", true);
    store.setSettings({ language: "de", autoSpeak: true });
    store.log("reviews", 3);

    const dump = store.export();
    store.reset();
    expect(Object.keys(store.state.p)).toHaveLength(0);

    store.import(dump);
    expect(store.state.p["a"]).toBeTruthy();
    expect(store.state.settings.language).toBe("de");
    expect(store.state.settings.autoSpeak).toBe(true);
    expect(Object.keys(store.state.history).length).toBeGreaterThan(0);
  });

  it("fills missing settings from defaults on import", () => {
    store.import(JSON.stringify({ p: {}, history: {} }));
    expect(store.state.settings.newPerLesson).toBe(5);
    expect(store.state.settings.language).toBe("en");
  });

  it("throws on malformed input and leaves state untouched", () => {
    store.grade("b", true);
    expect(() => store.import("not json")).toThrow();
    expect(store.state.p["b"]).toBeTruthy();
  });
});

describe("store reschedule / reset", () => {
  beforeEach(() => {
    localStorage.clear();
    store.reset();
  });

  it("reschedules an item to a given due time", () => {
    store.grade("a", true);
    store.reschedule("a", 12345);
    expect(store.state.p["a"].due).toBe(12345);
  });

  it("resets an item to box 1 due now with lapses cleared", () => {
    for (let i = 0; i < 3; i++) store.grade("a", false);
    store.resetItem("a");
    const e = store.state.p["a"];
    expect(e.box).toBe(1);
    expect(e.lapses).toBe(0);
    expect(e.due).toBeLessThanOrEqual(Date.now());
  });
});
