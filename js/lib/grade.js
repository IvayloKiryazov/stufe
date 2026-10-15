/* Pure answer grading for dictation / translation. Browser + Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.Grade = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  function fold(s) {
    return String(s)
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss");
  }

  /* Lenient normalisation for whole sentences: drop punctuation, fold umlauts. */
  function normalizeSentence(s) {
    return fold(s)
      .replace(/[.,!?;:„“"()\[\]«»]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function equals(a, b) {
    return normalizeSentence(a) === normalizeSentence(b);
  }

  /* Jaccard similarity over word sets, 0..1 (for partial credit). */
  function tokenSimilarity(a, b) {
    var A = normalizeSentence(a).split(" ").filter(Boolean);
    var B = normalizeSentence(b).split(" ").filter(Boolean);
    if (!A.length || !B.length) return 0;
    var setA = {}, setB = {};
    A.forEach(function (w) { setA[w] = 1; });
    B.forEach(function (w) { setB[w] = 1; });
    var inter = 0;
    for (var w in setA) if (setB[w]) inter++;
    var union = Object.keys(setA).length + Object.keys(setB).length - inter;
    return union ? inter / union : 0;
  }

  return { fold: fold, normalizeSentence: normalizeSentence, equals: equals, tokenSimilarity: tokenSimilarity };
});
