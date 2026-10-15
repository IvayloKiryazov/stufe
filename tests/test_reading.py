"""Validate the reading passages (data/reading.json)."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class ReadingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.passages = json.loads((ROOT / "data" / "reading.json").read_text(encoding="utf-8"))

    def test_has_passages(self):
        self.assertTrue(len(self.passages) > 0)

    def test_passages_are_well_formed(self):
        for p in self.passages:
            self.assertTrue(p.get("id"), p)
            self.assertTrue(p.get("title"), p["id"])
            self.assertTrue(p.get("text"), p["id"])
            self.assertTrue(p.get("level"), p["id"])
            self.assertTrue(p.get("glossary"), p["id"])
            self.assertTrue(p.get("questions"), p["id"])
            for q in p["questions"]:
                self.assertTrue(q.get("q"), p["id"])
                self.assertGreaterEqual(len(q["options"]), 2, p["id"])
                self.assertTrue(0 <= q["answer"] < len(q["options"]), p["id"])


if __name__ == "__main__":
    unittest.main()
