import { beforeEach, describe, expect, it } from "vitest";
import { LEECH_THRESHOLD } from "./srsCore";
import { PROGRESS_VERSION, store } from "./store";

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

describe("progress schema migration", () => {
  beforeEach(() => {
    localStorage.clear();
    store.reset();
  });

  it("writes the current schema version", () => {
    expect(store.state.v).toBe(PROGRESS_VERSION);
    expect(JSON.parse(store.export()).v).toBe(PROGRESS_VERSION);
  });

  it("maps an old 7-box schedule onto the 12-level ladder", () => {
    store.import(
      JSON.stringify({
        p: {
          seven: { box: 7, due: 10 },
          four: { box: 4, due: 20 },
          zero: { box: 0, due: 0 },
        },
        history: {},
      }),
    );
    expect(store.state.v).toBe(PROGRESS_VERSION);
    expect(store.state.p.seven.box).toBe(12);
    expect(store.state.p.four.box).toBe(7);
    expect(store.state.p.zero.box).toBe(0);
    expect(store.state.p.seven.due).toBe(10);
  });

  it("defaults new collections when importing an old backup", () => {
    store.import(JSON.stringify({ p: {}, history: {} }));
    expect(store.state.practice).toEqual({});
    expect(store.state.notes).toEqual({});
    expect(store.state.newDecks).toEqual({});
    expect(store.state.settings.decks.course.enabled).toBe(true);
  });
});

describe("store notes, practice and deck preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    store.reset();
  });

  it("stores and removes a user mnemonic", () => {
    store.setNote("a", "  der Mann sieht aus wie ...  ");
    expect(store.state.notes.a).toBe("der Mann sieht aus wie ...");
    store.setNote("a", "   ");
    expect(store.state.notes.a).toBeUndefined();
  });

  it("tracks practice accuracy", () => {
    store.logPractice("reading", true);
    store.logPractice("reading", false);
    store.logPractice("reading", true);
    expect(store.state.practice.reading).toEqual({ attempts: 3, correct: 2 });
  });

  it("tracks new items per deck for the day", () => {
    store.logNewDeck({ course: 2, gender: 1 });
    expect(store.state.newDecks[Object.keys(store.state.newDecks)[0]].course).toBe(2);
  });

  it("updates a single deck preference", () => {
    store.setDeck("gender", { enabled: false, newPerDay: 0 });
    expect(store.state.settings.decks.gender).toEqual({ enabled: false, newPerDay: 0 });
    expect(store.state.settings.decks.course.enabled).toBe(true);
  });

  it("bulk-marks many items known", () => {
    store.markKnownMany(["a", "b", "c"]);
    for (const id of ["a", "b", "c"]) expect(store.state.p[id].known).toBe(true);
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
