import { useEffect, useState } from "react";
import { Card, CardTitle } from "../components/ui/card";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";

export default function Credits() {
  const lang = useProgress().settings.language;
  const [credits, setCredits] = useState<string[]>([]);
  useEffect(() => {
    fetch("data/attribution.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCredits(d ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(lang, "nav.credits")}</h1>
        <p className="text-muted">Stufe is MIT-licensed. The language data comes from open sources.</p>
      </header>
      <Card>
        <CardTitle>Sources</CardTitle>
        <p className="text-sm">
          <b>Example sentences</b> — <a href="https://tatoeba.org">Tatoeba</a>, CC BY 2.0 FR.
        </p>
        <p className="text-sm">
          <b>Noun gender &amp; plurals</b> —{" "}
          <a href="https://github.com/gambolputty/german-nouns">german-nouns</a>, CC BY-SA 4.0.
        </p>
        <p className="text-sm">
          <b>Dictionary / IPA / glosses</b> —{" "}
          <a href="https://kaikki.org/dictionary/German/">kaikki.org</a> (Wiktionary), CC BY-SA 4.0.
        </p>
        <p className="text-sm">
          <b>Word frequency</b> —{" "}
          <a href="https://github.com/hermitdave/FrequencyWords">FrequencyWords</a>, MIT.
        </p>
      </Card>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Sentence credits</h2>
        <div className="space-y-1">
          {credits.map((c) => (
            <p key={c} className="text-xs text-muted">
              {c}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
