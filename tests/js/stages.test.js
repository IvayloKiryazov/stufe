const test = require("node:test");
const assert = require("node:assert");
const { stageName, STAGES } = require("../../js/lib/stages.js");

test("box -> stage name", () => {
  assert.equal(stageName(0), "Apprentice");
  assert.equal(stageName(1), "Apprentice");
  assert.equal(stageName(2), "Guru");
  assert.equal(stageName(3), "Guru");
  assert.equal(stageName(4), "Master");
  assert.equal(stageName(5), "Enlightened");
  assert.equal(stageName(6), "Enlightened");
  assert.equal(stageName(7), "Burned");
});

test("clamps out-of-range boxes", () => {
  assert.equal(stageName(-3), "Apprentice");
  assert.equal(stageName(99), "Burned");
});

test("stages are contiguous from 0 to 7", () => {
  let covered = [];
  for (const s of STAGES) for (let b = s.min; b <= s.max; b++) covered.push(b);
  assert.deepEqual(covered, [0, 1, 2, 3, 4, 5, 6, 7]);
});
