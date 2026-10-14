/* Persistence: progress + settings in localStorage (with in-memory fallback). */
(function () {
  "use strict";
  var KEY = "stufe-progress-v2";
  var DEFAULTS = {
    p: {},
    settings: { unlockAll: false, voice: true, autoSpeak: false, newPerLesson: 5 },
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
  function load() {
    var raw = readRaw();
    if (!raw) return clone(DEFAULTS);
    try {
      var o = JSON.parse(raw);
      return {
        p: o.p || {},
        settings: Object.assign({}, DEFAULTS.settings, o.settings || {}),
      };
    } catch (e) {
      return clone(DEFAULTS);
    }
  }

  var S = load();

  window.Store = {
    get progress() {
      return S.p;
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
      var o = JSON.parse(text);
      S = {
        p: o.p || {},
        settings: Object.assign({}, DEFAULTS.settings, o.settings || {}),
      };
      this.save();
    },
  };
})();
