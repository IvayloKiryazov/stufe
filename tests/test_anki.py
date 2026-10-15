"""Tests for the personal Anki .apkg importer (tools/import_anki.py)."""

import json
import sqlite3
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS))

import import_anki  # noqa: E402


def _make_apkg(path: Path) -> None:
    db = path.with_suffix(".db")
    con = sqlite3.connect(db)
    models = {
        "123": {
            "flds": [
                {"name": "Rank", "ord": 0},
                {"name": "Word", "ord": 1},
                {"name": "IPA", "ord": 2},
                {"name": "Definition 1", "ord": 3},
                {"name": "German 1", "ord": 4},
                {"name": "English 1", "ord": 5},
            ]
        }
    }
    con.execute("CREATE TABLE col (id integer primary key, models text)")
    con.execute("INSERT INTO col VALUES (1, ?)", (json.dumps(models),))
    con.execute("CREATE TABLE notes (id integer primary key, mid integer, flds text)")
    flds = "\x1f".join(
        [
            "299",
            "die Präsentation, -en",
            "pʁɛzɛntaˈt͡si̯oːn",
            "presentation",
            "Am Montag halte ich eine Präsentation.",
            "On Monday I give a presentation.",
        ]
    )
    con.execute("INSERT INTO notes VALUES (1, 123, ?)", (flds,))
    con.commit()
    con.close()
    with zipfile.ZipFile(path, "w") as zf:
        zf.write(db, "collection.anki2")
    db.unlink()


class AnkiImportTest(unittest.TestCase):
    def test_parse_and_map(self):
        with tempfile.TemporaryDirectory() as tmp:
            apkg = Path(tmp) / "deck.apkg"
            _make_apkg(apkg)
            notes = import_anki.parse_apkg(apkg)
            self.assertEqual(len(notes), 1)
            item = import_anki.map_fields(notes[0], "a2")
            self.assertEqual(item["de"], "die Präsentation")
            self.assertEqual(item["en"], "presentation")
            self.assertEqual(item["sentence_de"], "Am Montag halte ich eine Präsentation.")
            self.assertIn("Anki rank 299", item["note"])
            self.assertIn("plural: -en", item["note"])

    def test_map_fields_requires_a_word(self):
        self.assertIsNone(import_anki.map_fields({"Definition 1": "x"}, "a2"))


if __name__ == "__main__":
    unittest.main()
