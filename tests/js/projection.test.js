const test = require("node:test");
const assert = require("node:assert");
const { daysToFinish, addDays, reviewLoad } = require("../../js/lib/projection.js");

test("daysToFinish rounds up and handles edge cases", () => {
  assert.equal(daysToFinish(10, 5), 2);
  assert.equal(daysToFinish(11, 5), 3);
  assert.equal(daysToFinish(0, 5), 0);
  assert.equal(daysToFinish(10, 0), Infinity);
});

test("addDays moves the date forward", () => {
  const base = new Date(2026, 0, 1).getTime();
  const later = new Date(addDays(base, 10));
  assert.equal(later.getFullYear(), 2026);
  assert.equal(later.getMonth(), 0);
  assert.equal(later.getDate(), 11);
});

test("reviewLoad scales with the pace", () => {
  assert.equal(reviewLoad(5, 7), 35);
  assert.equal(reviewLoad(0, 7), 0);
  assert.equal(reviewLoad(20), 140); // default 7 reviews per item
});
