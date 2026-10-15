const test = require("node:test");
const assert = require("node:assert");
const { dayKey, bump, streak, totals } = require("../../js/lib/stats.js");

const DAY = 86400000;
// a fixed reference: 2026-03-10 local noon
const REF = new Date(2026, 2, 10, 12, 0, 0).getTime();

test("dayKey is local YYYY-MM-DD", () => {
  assert.equal(dayKey(REF), "2026-03-10");
});

test("bump is immutable and accumulates", () => {
  const h0 = {};
  const h1 = bump(h0, "new", REF, 5);
  const h2 = bump(h1, "reviews", REF, 3);
  assert.deepEqual(h0, {}, "original untouched");
  assert.equal(h1["2026-03-10"].new, 5);
  assert.equal(h2["2026-03-10"].reviews, 3);
  assert.equal(h2["2026-03-10"].new, 5, "new preserved");
});

test("streak counts consecutive days ending today", () => {
  let h = {};
  h = bump(h, "reviews", REF);
  h = bump(h, "reviews", REF - DAY);
  h = bump(h, "reviews", REF - 2 * DAY);
  assert.equal(streak(h, REF), 3);
});

test("streak tolerates an empty today (counts from yesterday)", () => {
  let h = {};
  h = bump(h, "new", REF - DAY);
  h = bump(h, "new", REF - 2 * DAY);
  assert.equal(streak(h, REF), 2);
});

test("streak breaks on a gap", () => {
  let h = {};
  h = bump(h, "reviews", REF);
  h = bump(h, "reviews", REF - 3 * DAY);
  assert.equal(streak(h, REF), 1);
});

test("totals sums everything", () => {
  let h = {};
  h = bump(h, "new", REF, 4);
  h = bump(h, "reviews", REF, 9);
  h = bump(h, "reviews", REF - DAY, 1);
  assert.deepEqual(totals(h), { new: 4, reviews: 10, days: 2 });
});
