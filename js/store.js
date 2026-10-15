/* Persistence: progress, daily history and settings in localStorage
   (with an in-memory fallback). */
(function () {
  "use strict";
  var KEY = "stufe-progress-v2";
  var DEFAULTS = {
    p: {},
    history: {},
    settings: {
      unlockAll: false,
      voice: true,
      autoSpeak: false,
      newPerLesson: 5,
      goalNew: 20,
      goalReviews: 50,
      theme: "auto",
      fontScale: 1,
    },
  };
  var mem = null;

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function readRaw() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return mem;
    }
  }
  function writeRaw(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch (e) {
      mem = v;
    }
  }
  function normalize(o) {
    return {
      p: o.p || {},
      history: o.history || {},
      settings: Object.assign({}, DEFAULTS.settings, o.settings || {}),
    };
  }
  function load() {
    var raw = readRaw();
    if (!raw) return clone(DEFAULTS);
    try {
      return normalize(JSON.parse(raw));
    } catch (e) {
      return clone(DEFAULTS);
    }
  }

  var S = load();

  window.Store = {
    get progress() {
      return S.p;
    },
    get history() {
      return S.history;
    },
    get settings() {
      return S.settings;
    },
    entry: function (id) {
      return S.p[id];
    },
    set: function (id, entry) {
      S.p[id] = entry;
    },
    /* Record activity for today (kind: "new" | "reviews"). */
    log: function (kind, n) {
      S.history = window.Stats.bump(S.history, kind, Date.now(), n);
      this.save();
    },
    save: function () {
      writeRaw(JSON.stringify(S));
    },
    reset: function () {
      S = clone(DEFAULTS);
      this.save();
    },
    export: function () {
      return JSON.stringify(S, null, 2);
    },
    import: function (text) {
      S = normalize(JSON.parse(text));
      this.save();
    },
  };
})();
