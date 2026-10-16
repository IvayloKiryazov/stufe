#!/usr/bin/env python3
"""One-off migration: rename grammar groups to the Bunpro convention.

Bunpro titles a point with the target-language *pattern* and gives a short
English *function* as the subtitle. We do the same for German: the group `name`
becomes the German pattern/formula and `subtitle` the English function.

Run from tools/:  python3 apply_naming.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# group id -> (German pattern title, English subtitle)
NAMING: dict[str, tuple[str, str]] = {
    # A1
    "pronouns": ("Personalpronomen (ich, du, er …)", "Subject pronouns"),
    "sein-haben": ("sein / haben (Präsens)", "to be / to have"),
    "articles": ("Artikel: der/die/das, ein/eine", "Definite & indefinite articles"),
    "plural": ("Plural der Nomen", "Plural nouns"),
    "regular-verbs": ("Präsens regelmäßiger Verben", "Regular verbs (present tense)"),
    "stem-changing": ("Präsens mit Vokalwechsel", "Stem-changing verbs"),
    "nominative-accusative": ("Nominativ & Akkusativ", "Nominative & accusative"),
    "possessive": ("Possessivartikel (mein, dein …)", "Possessive articles"),
    "word-order": ("Wortstellung, Fragen, Negation", "Word order, questions, negation"),
    "modal-verbs": ("Modalverben (können, müssen …)", "Modal verbs"),
    "separable": ("Trennbare Verben (auf-, ein-)", "Separable verbs"),
    "imperative": ("Imperativ (du, ihr, Sie)", "Imperative"),
    "perfect": ("Perfekt: haben/sein + Partizip II", "The perfect tense"),
    "time-prepositions": ("Präpositionen der Zeit und des Ortes", "Time & place prepositions"),
    "numbers-time": ("Zahlen, Datum und Uhrzeit", "Numbers, dates and time"),
    # A2
    "dative-case": ("Dativ: dem / der / dem", "The dative case"),
    "dative-pronouns": ("Personalpronomen im Dativ (mir, dir …)", "Dative pronouns"),
    "two-way-prepositions": ("Wechselpräpositionen (in, an, auf …)", "Two-way prepositions"),
    "adjective-endings-definite": ("Adjektivendungen nach der/die/das", "Adjective endings after der/die/das"),
    "adjective-endings-indefinite": ("Adjektivendungen nach ein/kein/mein", "Adjective endings after ein/kein/mein"),
    "preterite": ("Präteritum", "The simple past"),
    "subordinate-clauses": ("Nebensätze mit dass / weil / wenn", "Subordinate clauses"),
    "comparative-superlative": ("Komparativ und Superlativ", "Comparative & superlative"),
    "reflexive-verbs": ("Reflexive Verben (Akkusativ)", "Reflexive verbs"),
    "konjunktiv2-basics": ("Konjunktiv II: hätte, wäre, würde", "Konjunktiv II basics"),
    "relative-clauses": ("Relativsätze", "Relative clauses"),
    "genitive": ("Genitiv: des / der", "The genitive case"),
    # B1
    "infinitive-zu": ("Infinitiv mit zu", "Infinitive with zu"),
    "um-zu-damit": ("um … zu / damit", "Purpose clauses"),
    "temporal-clauses": ("Temporalsätze (als, wenn, nachdem …)", "Time clauses"),
    "indirect-questions": ("Indirekte Fragen (ob, W-Frage)", "Indirect questions"),
    "plusquamperfekt": ("Plusquamperfekt", "The past perfect"),
    "passive": ("Passiv: werden + Partizip II", "The passive voice"),
    "future": ("Futur I (werden + Infinitiv)", "The future"),
    "konjunktiv2-full": ("Konjunktiv II (Vergangenheit, irreale Bedingung)", "Konjunktiv II"),
    "verbs-with-prepositions": ("Verben mit Präpositionen (warten auf …)", "Verbs with prepositions"),
    "connectors": ("Konnektoren und Wortstellung", "Connectors and word order"),
    "genitive-prepositions": ("Präpositionen mit Genitiv (wegen, trotz …)", "Genitive prepositions"),
    "n-declension": ("N-Deklination (der Junge → den Jungen)", "Weak masculine nouns"),
    # B2
    "konjunktiv2-vergangenheit": ("Konjunktiv II der Vergangenheit (hätte gemacht)", "Konjunktiv II: past"),
    "irreale-bedingungen": ("Irreale Bedingung: wenn / Verb-erst", "Unreal conditions"),
    "konzessivsaetze": ("Konzessivsätze (obwohl, trotzdem …)", "Concessive clauses"),
    "als-ob": ("Irrealer Vergleich: als ob / als", "Irreal comparison: als ob"),
    "zweiteilige-konnektoren": ("Zweiteilige Konnektoren (entweder … oder, je … desto)", "Two-part connectors"),
    "passiversatzformen": ("Passiversatzformen (sein + zu, sich lassen)", "Passive alternatives"),
    "partizip-adjektive": ("Partizipien als Adjektive", "Participles as adjectives"),
    "nominalisierung": ("Nominalisierung (Verben → Nomen)", "Nominalisation"),
    "subjektive-modalverben": ("Subjektive Modalverben (Vermutung)", "Subjective modal verbs"),
    "futur2": ("Futur II (werden + Partizip II)", "The future perfect"),
    "relativsaetze-was-wo": ("Relativsätze mit was, wo, wer", "Relative clauses: was, wo, wer"),
    "adjektive-praepositionen": ("Adjektive mit Präpositionen (interessiert an …)", "Adjectives with prepositions"),
    # C1
    "erweiterte-partizipialattribute": (
        "Erweiterte Partizipialattribute (die von ihm geschriebene E-Mail)",
        "Extended participle attributes",
    ),
    "partizipialkonstruktionen": ("Partizipialkonstruktionen", "Participial clauses"),
    "funktionsverbgefuege": ("Funktionsverbgefüge (zur Verfügung stehen)", "Noun + verb phrases"),
    "konjunktiv1": ("Konjunktiv I (indirekte Rede)", "Konjunktiv I"),
    "nominalstil": ("Nominalstil vs. Verbalstil", "Nominal vs. verbal style"),
    "konnektoren-c1": ("Konnektoren (C1: sofern, zumal, indes)", "Advanced connectors"),
    "wortbildung": ("Wortbildung (Präfixe, Suffixe)", "Word formation"),
    "vorfeldbesetzung": ("Vorfeldbesetzung (Betonung)", "Fronting for emphasis"),
    "ausklammerung": ("Ausklammerung", "Extraposition"),
    "relativ-was-auch-immer": ("wer / was auch immer, egal wie", "Whatever / whoever"),
    "praepositionale-attribute": ("Präpositionale Attribute (das Interesse an …)", "Prepositional attributes"),
    # C2
    "register-stilebenen": ("Register & Stilebenen (gehoben / umgangssprachlich)", "Register & style"),
    "distanz-konjunktiv1": ("Distanz-Konjunktiv I (Presse)", "Reportive Konjunktiv I"),
    "komplexe-nominalsyntax": ("Komplexe Nominalsyntax (Genitivketten)", "Complex noun phrases"),
    "idiomatik": ("Idiomatik (Redewendungen)", "Idioms"),
    "gehobene-kollokationen": ("Gehobene Kollokationen (Kritik üben)", "Elevated collocations"),
    "gehoberene-kollokationen": ("Gehobene Kollokationen (Kritik üben)", "Elevated collocations"),
    "seltene-literarische-formen": ("Seltene und literarische Formen", "Rare & literary forms"),
    "wortstellung-komplex": ("Komplexe Wortstellung (Partizipialphrasen)", "Complex word order"),
}


def main() -> int:
    changed = 0
    for path in sorted((ROOT / "content" / "grammar").glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for g in doc["groups"]:
            if g["id"] in NAMING:
                name, subtitle = NAMING[g["id"]]
                g["name"] = name
                g["subtitle"] = subtitle
                changed += 1
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"renamed {changed} grammar groups")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
