const test = require("node:test");
const assert = require("node:assert");
const S = require("../../js/lib/srs-core.js");

const NOW = 1000000;

test("nextBox moves up on success, down on failure", () => {
  assert.equal(S.nextBox(0, true), 1);
  assert.equal(S.nextBox(7, true), 7);
  assert.equal(S.nextBox(3, false), 2);
  assert.equal(S.nextBox(5, false), 3); // steeper drop for high boxes
});

test("applyGrade records reps, lapses and history", () => {
  let e = null;
  e = S.applyGrade(e, true, NOW);
  assert.equal(e.box, 1);
  assert.equal(e.reps, 1);
  assert.equal(e.lapses, 0);
  assert.deepEqual(e.hist, [1]);
  assert.equal(e.due, NOW + S.HOURS[1] * 3600000);
  e = S.applyGrade(e, false, NOW);
  assert.equal(e.lapses, 1);
  assert.deepEqual(e.hist, [1, 0]);
  assert.equal(e.box, 1); // floor at 1
});

test("history is capped at 10 entries", () => {
  let e = null;
  for (let i = 0; i < 15; i++) e = S.applyGrade(e, i % 2 === 0, NOW);
  assert.equal(e.hist.length, 10);
});

test("suspend / resume / known toggle activity", () => {
  let e = S.applyGrade(null, true, NOW);
  assert.equal(S.isActive(e), true);
  e = S.suspend(e);
  assert.equal(S.isActive(e), false);
  e = S.resume(e);
  assert.equal(S.isActive(e), true);
  e = S.markKnown(e);
  assert.equal(S.isActive(e), false);
  assert.equal(e.box, 7);
});
