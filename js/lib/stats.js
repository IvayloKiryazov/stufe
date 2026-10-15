/* Pure daily-activity helpers: day keys, history recording, streaks, totals.
   Works in the browser and in Node for unit testing. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.Stats = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  /* Return a new history object with `n` (default 1) added to today's `kind`. */
  function bump(history, kind, ts, n) {
    var key = dayKey(ts);
    var next = {};
    for (var k in history) if (Object.prototype.hasOwnProperty.call(history, k)) next[k] = history[k];
    var day = { new: 0, reviews: 0 };
    if (history[key]) {
      day.new = history[key].new || 0;
      day.reviews = history[key].reviews || 0;
    }
    day[kind] = (day[kind] || 0) + (n == null ? 1 : n);
    next[key] = day;
    return next;
  }

  function active(day) {
    return !!day && (day.new || 0) + (day.reviews || 0) > 0;
  }

  /* Consecutive days with activity, counting back from today (or yesterday if
     today has no activity yet). */
  function streak(history, nowTs) {
    var d = new Date(nowTs);
    if (!active(history[dayKey(d.getTime())])) {
      d.setDate(d.getDate() - 1);
    }
    var count = 0;
    while (active(history[dayKey(d.getTime())])) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  function totals(history) {
    var out = { new: 0, reviews: 0, days: 0 };
    for (var k in history) {
      if (!Object.prototype.hasOwnProperty.call(history, k)) continue;
      out.new += history[k].new || 0;
      out.reviews += history[k].reviews || 0;
      out.days++;
    }
    return out;
  }

  return { dayKey: dayKey, bump: bump, streak: streak, totals: totals, active: active };
});
