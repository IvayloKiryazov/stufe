const test = require("node:test");
const assert = require("node:assert");
const G = require("../../js/lib/grade.js");

test("fold maps umlauts and sharp s", () => {
  assert.equal(G.fold("Größe"), "groesse");
  assert.equal(G.fold("Über"), "ueber");
});

test("equals ignores case and punctuation", () => {
  assert.equal(G.equals("Das ist ein Test.", "das ist ein test"), true);
  assert.equal(G.equals("Ich heiße Anna!", "Ich heisse Anna"), true);
  assert.equal(G.equals("Der Mann", "die Frau"), false);
});

test("tokenSimilarity is 1 for identical, 0 for disjoint", () => {
  assert.equal(G.tokenSimilarity("Ich trinke Kaffee", "ich trinke kaffee"), 1);
  assert.equal(G.tokenSimilarity("Ich trinke Kaffee", "Der Hund schläft"), 0);
});

test("tokenSimilarity gives partial credit", () => {
  const s = G.tokenSimilarity("Ich trinke gern Kaffee", "Ich trinke Kaffee");
  assert.ok(s > 0.5 && s < 1, String(s));
});
