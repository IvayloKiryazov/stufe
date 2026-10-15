"""Unit tests for the pipeline's pure helpers (tools/common.py, build_vocab)."""

import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS))

import common  # noqa: E402
from build_vocab import blank_sentence  # noqa: E402


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


if __name__ == "__main__":
    unittest.main()
