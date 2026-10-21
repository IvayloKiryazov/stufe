"""Validate the generated deck (data/items.json + data/levels.json)."""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLE = re.compile(r"^(der|die|das) ")


class DatasetTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.items = json.loads((ROOT / "data" / "items.json").read_text(encoding="utf-8"))
        cls.levels = json.loads((ROOT / "data" / "levels.json").read_text(encoding="utf-8"))

    def test_ids_are_unique(self):
        ids = [i["id"] for i in self.items]
        self.assertEqual(len(ids), len(set(ids)))

    def test_cloze_items_have_blank_and_answer(self):
        for i in self.items:
            if i["kind"] == "cloze":
                self.assertIn("___", i["prompt"], i["id"])
                self.assertTrue(i["answer"].strip(), i["id"])

    def test_nouns_carry_an_article(self):
        for i in self.items:
            if i["kind"] == "noun":
                self.assertRegex(i["de"], ARTICLE, i["id"])

    def test_every_level_reference_resolves(self):
        by_id = {i["id"] for i in self.items}
        for level in self.levels:
            for group in level["groups"]:
                self.assertTrue(group["items"], level["id"] + "/" + group["id"])
                for item_id in group["items"]:
                    self.assertIn(item_id, by_id)

    def test_grammar_groups_have_a_subtitle(self):
        for level in self.levels:
            for group in level["groups"]:
                if group["kind"] == "cloze":
                    self.assertTrue(group.get("subtitle"), level["id"] + "/" + group["id"])

    def test_items_have_required_fields(self):
        for i in self.items:
            self.assertTrue(i.get("level"), i["id"])
            self.assertTrue(i.get("group"), i["id"])
            self.assertTrue(i.get("groupName"), i["id"])
            self.assertIn(i["kind"], {"noun", "verb", "adj", "cloze", "gender", "plural", "case"}, i["id"])

    def test_case_items_are_valid(self):
        # #79: definite-article case drill track.
        cases = [i for i in self.items if i["kind"] == "case"]
        self.assertTrue(cases, "no case items generated")
        for i in cases:
            self.assertIn(i["answer"], {"den", "dem", "des", "die", "der", "das"}, i["id"])
            self.assertTrue(
                any(label in i["prompt"] for label in ("Akkusativ", "Dativ", "Genitiv")), i["id"]
            )

    def test_every_noun_has_gender_and_plural_tracks(self):
        # #78: each noun with an article/plural also has its own drill cards.
        nouns = [i for i in self.items if i["kind"] == "noun"]
        gender_de = {i["de"] for i in self.items if i["kind"] == "gender"}
        plural_prompt = {i["prompt"] for i in self.items if i["kind"] == "plural"}
        for n in nouns:
            self.assertIn(n["de"], gender_de, n["id"])
            if n.get("plural"):
                self.assertIn(n["de"], plural_prompt, n["id"])

    def test_verbs_have_conjugation_tables(self):
        # #80: the whole verb deck is conjugated from Wiktionary.
        verbs = [i for i in self.items if i["kind"] == "verb"]
        missing = [i["id"] for i in verbs if not i.get("conjugation")]
        self.assertEqual(missing, [], f"{len(missing)} verbs without conjugation")
        for i in verbs:
            self.assertEqual(len(i["conjugation"]["present"]), 6, i["id"])

    def test_curated_vocab_has_ipa(self):
        # #81: curated vocab now gets IPA from Wiktionary (a couple of words
        # genuinely have no IPA in the extract).
        curated = [
            i
            for i in self.items
            if not i["id"].startswith("freq-") and i["kind"] in ("noun", "verb", "adj")
        ]
        missing = [i["id"] for i in curated if not i.get("ipa")]
        self.assertLessEqual(len(missing), 5, missing)


if __name__ == "__main__":
    unittest.main()
