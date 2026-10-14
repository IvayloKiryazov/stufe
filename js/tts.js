/* Audio via the browser's built-in German voices (Web Speech API).
   No downloads, no keys. Honours the "voice" setting. */
(function () {
  "use strict";
  var voice = null;

  function pick() {
    if (!("speechSynthesis" in window)) return;
    var vs = window.speechSynthesis.getVoices() || [];
    voice =
      vs.find(function (v) { return /^de[-_]DE/i.test(v.lang); }) ||
      vs.find(function (v) { return /^de/i.test(v.lang); }) ||
      null;
  }

  if ("speechSynthesis" in window) {
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }

  window.TTS = {
    available: "speechSynthesis" in window,
    speak: function (text, rate) {
      if (!text || !("speechSynthesis" in window)) return;
      if (!window.Store.settings.voice) return;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "de-DE";
        if (voice) u.voice = voice;
        u.rate = rate || 0.95;
        window.speechSynthesis.speak(u);
      } catch (e) {
        /* ignore */
      }
    },
    refresh: pick,
    hasVoice: function () {
      return !!voice;
    },
  };
})();
