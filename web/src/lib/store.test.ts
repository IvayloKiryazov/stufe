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
