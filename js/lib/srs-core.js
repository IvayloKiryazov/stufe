/* Pure SRS entry transitions (Leitner boxes + suspend/known + per-item history).
   Browser + Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SRSCore = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  var HOUR = 3600e3;
  var HOURS = [0, 4, 8, 24, 72, 168, 336, 720];

  function nextBox(box, ok) {
    return ok ? Math.min(7, box + 1) : Math.max(1, box - (box >= 5 ? 2 : 1));
  }

  function applyGrade(entry, ok, now) {
    var e = entry || { box: 0, due: 0, lapses: 0, reps: 0, hist: [] };
    var box = nextBox(e.box || 0, ok);
    var hist = (e.hist || []).slice(-9);
    hist.push(ok ? 1 : 0);
    return {
      box: box,
      due: now + HOURS[box] * HOUR,
      lapses: (e.lapses || 0) + (ok ? 0 : 1),
      reps: (e.reps || 0) + 1,
      last: now,
      hist: hist,
      suspended: false,
      known: false,
    };
  }

  function isActive(entry) {
    return !!entry && !entry.suspended && !entry.known;
  }
  function suspend(entry) {
    return Object.assign({}, entry, { suspended: true });
  }
  function resume(entry) {
    return Object.assign({}, entry, { suspended: false });
  }
  function markKnown(entry) {
    return Object.assign({}, entry, { known: true, suspended: false, box: 7 });
  }

  return {
    HOURS: HOURS,
    nextBox: nextBox,
    applyGrade: applyGrade,
    isActive: isActive,
    suspend: suspend,
    resume: resume,
    markKnown: markKnown,
  };
});
