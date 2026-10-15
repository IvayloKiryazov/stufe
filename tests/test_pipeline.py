"""Unit tests for the pipeline's pure helpers (tools/common.py, build_vocab)."""

import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS))

import common  # noqa: E402
import build_frequency  # noqa: E402
import build_conjugations  # noqa: E402
import mnemonic  # noqa: E402
from common import blank_sentence  # noqa: E402


def _temp_csv(text: str) -> Path:
    fh = tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8")
    fh.write(text)
    fh.close()
    return Path(fh.name)


class LoadNounsTest(unittest.TestCase):
    def test_gender_columns_and_plural_only(self):
        path = _temp_csv(
            "lemma,pos,genus,genus 1,genus 2,nominativ plural\n"
            "Mann,Substantiv,m,,,Männer\n"
            "Herz,Substantiv,,n,,Herzen\n"
            "Leute,Substantiv,,,,Leute\n"
            "Ding,Substantiv,x,,,Dinger\n"
        )
        nouns = common.load_nouns(path)
        self.assertEqual(nouns["Mann"].article, "der")
        self.assertEqual(nouns["Mann"].plural, "die Männer")
        self.assertEqual(nouns["Herz"].article, "das")  # gender lives in "genus 1"
        self.assertEqual(nouns["Leute"].article, "die")  # plural-only
        self.assertNotIn("Ding", nouns)  # unknown gender -> skipped


class SentenceIndexTest(unittest.TestCase):
    def setUp(self):
        self.pairs = [
            ("Ich sehe das Haus.", "I see the house.", "attr1"),
            ("Haus ist groß.", "House is big.", "attr2"),
            ("Der Mann liest.", "The man reads.", "attr3"),
        ]
        self.index = common.build_sentence_index(self.pairs)

    def test_indexes_mid_sentence_tokens(self):
        self.assertIn("Haus", self.index)
        self.assertEqual(self.index["Haus"][0], "Ich sehe das Haus.")

    def test_skips_sentence_initial_tokens(self):
        # "Ich" and "Haus" (in the 2nd sentence) are only sentence-initial
        self.assertNotIn("Ich", self.index)
        self.assertEqual(self.index["Haus"][0], "Ich sehe das Haus.")

    def test_find_example_is_case_sensitive(self):
        self.assertIsNotNone(common.find_example(self.index, "Haus"))
        self.assertIsNone(common.find_example(self.index, "haus"))

    def test_find_example_uses_extra_forms(self):
        self.assertIsNone(common.find_example(self.index, "Häuser"))
        self.assertIsNotNone(common.find_example(self.index, "Häuser", ["Haus"]))


class BlankSentenceTest(unittest.TestCase):
    def test_blanks_mid_sentence_occurrence(self):
        self.assertEqual(
            blank_sentence("Das Haus ist groß.", "Haus"), ("Das ___ ist groß.", "Haus")
        )

    def test_refuses_sentence_initial_only(self):
        self.assertIsNone(blank_sentence("Haus ist groß.", "Haus"))

    def test_returns_none_when_absent(self):
        self.assertIsNone(blank_sentence("Der Mann liest.", "Haus"))


class ExtractNounTest(unittest.TestCase):
    def _entry(self, **over):
        entry = {
            "word": "Haus",
            "pos": "noun",
            "head_templates": [{"name": "de-noun", "args": {"1": "n,-:s"}}],
            "forms": [
                {"form": "Häuser", "tags": ["plural"]},
                {"form": "Haus", "tags": ["definite", "nominative", "plural"]},
            ],
            "senses": [
                {
                    "glosses": ["house"],
                    "examples": [
                        {"text": "Das Haus ist groß.", "translation": "The house is big.", "type": "example"}
                    ],
                }
            ],
            "sounds": [{"ipa": "/haʊs/"}],
        }
        entry.update(over)
        return entry

    def test_extracts_fields(self):
        info = build_frequency.extract_noun(self._entry())
        self.assertEqual(info["article"], "das")
        self.assertEqual(info["plural"], "Häuser")
        self.assertEqual(info["gloss"], "house")
        self.assertEqual(info["ipa"], "/haʊs/")
        self.assertEqual(info["example"], ("Das Haus ist groß.", "The house is big."))

    def test_rejects_non_nouns(self):
        self.assertIsNone(build_frequency.extract_noun({"word": "ist", "pos": "verb"}))

    def test_rejects_nouns_without_gender(self):
        entry = self._entry(head_templates=[{"name": "head", "args": {}}])
        self.assertIsNone(build_frequency.extract_noun(entry))

    def test_rejects_gerunds_and_deverbals(self):
        gerund = self._entry(senses=[{"glosses": ["gerund of haben"]}])
        self.assertIsNone(build_frequency.extract_noun(gerund))
        deverbal = self._entry(
            senses=[{"glosses": ["existence"], "categories": [{"name": "German deverbals"}]}]
        )
        self.assertIsNone(build_frequency.extract_noun(deverbal))

    def test_skips_quotation_examples(self):
        entry = self._entry(
            senses=[
                {
                    "glosses": ["house"],
                    "examples": [{"text": "A long quotation", "translation": "x", "type": "quotation"}],
                }
            ]
        )
        self.assertIsNone(build_frequency.extract_noun(entry)["example"])


class ConjugationTest(unittest.TestCase):
    def _entry(self):
        return {
            "pos": "verb",
            "forms": [
                {"form": "mache", "tags": ["first-person", "singular", "present", "indicative"]},
                {"form": "machst", "tags": ["second-person", "singular", "present", "indicative"]},
                {"form": "macht", "tags": ["third-person", "singular", "present", "indicative"]},
                {"form": "machen", "tags": ["first-person", "plural", "present", "indicative"]},
                {"form": "macht", "tags": ["second-person", "plural", "present", "indicative"]},
                {"form": "machen", "tags": ["third-person", "plural", "present", "indicative"]},
                {"form": "machte", "tags": ["third-person", "singular", "preterite", "indicative"]},
                {"form": "gemacht", "tags": ["participle", "past"]},
                {"form": "mache", "tags": ["first-person", "singular", "subjunctive"]},
            ],
        }

    def test_extracts_present_preterite_participle(self):
        c = build_conjugations.extract_conjugation(self._entry())
        self.assertEqual(c["present"], ["mache", "machst", "macht", "machen", "macht", "machen"])
        self.assertEqual(c["preterite"], "machte")
        self.assertEqual(c["participle"], "gemacht")

    def test_requires_all_six_persons(self):
        partial = {"forms": [{"form": "x", "tags": ["present", "indicative", "first-person", "singular"]}]}
        self.assertIsNone(build_conjugations.extract_conjugation(partial))


class MnemonicTest(unittest.TestCase):
    def test_feminine_ending(self):
        self.assertIn("-ung", mnemonic.gender_mnemonic("Wohnung", "die"))

    def test_neuter_ending(self):
        self.assertIn("-chen", mnemonic.gender_mnemonic("Mädchen", "das"))

    def test_masculine_ending(self):
        self.assertIn("-ling", mnemonic.gender_mnemonic("Frühling", "der"))

    def test_fallback(self):
        self.assertIn("memorise", mnemonic.gender_mnemonic("Mann", "der"))


if __name__ == "__main__":
    unittest.main()