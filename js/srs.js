/* Staged spaced repetition (Leitner boxes), the same shape as WaniKani/Bunpro.
   Pure transitions live in js/lib/srs-core.js; this wires them to the store. */
(function () {
  "use strict";
  var CORE = window.SRSCore;

  window.SRS = {
    HOURS: CORE.HOURS,
    PASS_BOX: 3,
    PASS_RATIO: 0.8,

    /* Grade an item. Returns the previous entry (for undo / typo override). */
    grade: function (id, ok) {
      var prev = window.Store.entry(id);
      var prevCopy = prev ? JSON.parse(JSON.stringify(prev)) : null;
      window.Store.set(id, CORE.applyGrade(prev, ok, Date.now()));
      window.Store.save();
      return prevCopy;
    },

    restore: function (id, prev) {
      if (prev) window.Store.set(id, prev);
      window.Store.save();
    },

    isDue: function (id, now) {
      var e = window.Store.entry(id);
      return CORE.isActive(e) && e.due <= now;
    },

    passed: function (id) {
      var e = window.Store.entry(id);
      return !!e && e.box >= 3;
    },

    isActive: function (id) {
      return CORE.isActive(window.Store.entry(id));
    },

    suspend: function (id) {
      var e = window.Store.entry(id);
      if (e) { window.Store.set(id, CORE.suspend(e)); window.Store.save(); }
    },

    resume: function (id) {
      var e = window.Store.entry(id);
      if (e) { window.Store.set(id, CORE.resume(e)); window.Store.save(); }
    },

    markKnown: function (id) {
      var e = window.Store.entry(id) || { box: 0 };
      window.Store.set(id, CORE.markKnown(e));
      window.Store.save();
    },
  };
})();
