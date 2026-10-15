/* Pure SRS stage naming (WaniKani-style). Works in the browser and in Node so
   it can be unit-tested directly. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.Stages = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  var STAGES = [
    { min: 0, max: 1, name: "Apprentice" },
    { min: 2, max: 3, name: "Guru" },
    { min: 4, max: 4, name: "Master" },
    { min: 5, max: 6, name: "Enlightened" },
    { min: 7, max: 7, name: "Burned" },
  ];
  function stageName(box) {
    var b = Math.max(0, Math.min(7, box | 0));
    for (var i = 0; i < STAGES.length; i++) {
      if (b >= STAGES[i].min && b <= STAGES[i].max) return STAGES[i].name;
    }
    return STAGES[0].name;
  }
  return { STAGES: STAGES, stageName: stageName };
});
