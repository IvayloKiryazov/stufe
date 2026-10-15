/* Pure projection maths: finish dates and steady-state review load.
   Browser + Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.Projection = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  /* Days needed to introduce `remaining` new items at `perDay`. Infinity if
     the pace is zero. */
  function daysToFinish(remaining, perDay) {
    if (perDay <= 0) return Infinity;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / perDay);
  }

  function addDays(ts, days) {
    var d = new Date(ts);
    d.setDate(d.getDate() + days);
    return d.getTime();
  }

  /* Steady-state reviews per day = new items/day x reviews per item (each item
     passes through one graded stage per box). */
  function reviewLoad(perDay, reviewsPerItem) {
    var r = reviewsPerItem == null ? 7 : reviewsPerItem;
    return Math.round(perDay * r);
  }

  return { daysToFinish: daysToFinish, addDays: addDays, reviewLoad: reviewLoad };
});
