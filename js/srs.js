/* Staged spaced repetition (Leitner boxes), the same shape as WaniKani/Bunpro:
   fixed intervals with a visible finish line. Box 0 -> 7, "passed" at box 3. */
(function () {
  "use strict";
  var HOUR = 3600e3;
  var HOURS = [0, 4, 8, 24, 72, 168, 336, 720]; // wait after reaching box n
  var PASS_BOX = 3;
  var PASS_RATIO = 0.8;

  window.SRS = {
    HOURS: HOURS,
    PASS_BOX: PASS_BOX,
    PASS_RATIO: PASS_RATIO,

    /* Grade an item. Returns the previous entry (for typo override) or null. */
    grade: function (id, ok) {
      var prev = window.Store.entry(id);
      var box0 = prev ? prev.box : 0;
      var prevCopy = prev ? { box: prev.box, due: prev.due } : null;
      var box = ok
        ? Math.min(7, box0 + 1)
        : Math.max(1, box0 - (box0 >= 5 ? 2 : 1));
      window.Store.set(id, { box: box, due: Date.now() + HOURS[box] * HOUR });
      window.Store.save();
      return prevCopy;
    },

    restore: function (id, prev) {
      if (prev) window.Store.set(id, prev);
      window.Store.save();
    },

    isDue: function (id, now) {
      var e = window.Store.entry(id);
      return !!e && e.due <= now;
    },

    passed: function (id) {
      var e = window.Store.entry(id);
      return !!e && e.box >= PASS_BOX;
    },
  };
})();
