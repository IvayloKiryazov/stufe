import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useProgress } from "../hooks/useProgress";
import { useDeck } from "../hooks/useDeck";
import type { Deck, Item, Reading as Passage } from "../lib/data";
import { buildGlossIndex, glossFor } from "../lib/gloss";
import { t } from "../lib/i18n";
import { speak } from "../lib/tts";

function PassageView({ p, deck }: { p: Passage; deck: Deck }) {
  const [answers, setAnswers] = useState<number[]>(() => p.questions.map(() => -1));
  const [checked, setChecked] = useState(false);
  const [sel, setSel] = useState<Item | null>(null);
  const index = useMemo(() => buildGlossIndex(deck), [deck]);
  const score = p.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);

  return (
    <div className="space-y-6">
      <Link to="/reading" className="text-sm text-muted">
        ← All passages
      </Link>
      <header>
        <h1 className="text-3xl font-bold">{p.title}</h1>
        <p className="text-muted">{p.level.toUpperCase()}</p>
      </header>
      <Card>
        <p className="font-serif text-lg leading-relaxed" lang="de">
          {p.text.split(/(\b[A-Za-zÄÖÜäöüß-]+\b)/).map((tok, i) =>
            /^[A-Za-zÄÖÜäöüß-]+$/.test(tok) ? (
              <button
                key={i}
                type="button"
                onClick={() => setSel(glossFor(index, tok) ?? null)}
                className="rounded hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {tok}
              </button>
            ) : (
              <span key={i}>{tok}</span>
            ),
          )}
        </p>
        {sel && (
          <p className="mt-2 border-t border-line pt-2 text-sm">
            <b lang="de">{sel.de}</b> — <span className="text-muted">{sel.en}</span>
            {sel.plural && <span className="text-muted"> · Pl. {sel.plural}</span>}
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => setSel(null)}>
              Clear
            </Button>
          </p>
        )}
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => speak(p.text)}>
          <Volume2 className="h-4 w-4" /> Listen
        </Button>
      </Card>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Glossary</h2>
        <div className="space-y-1">
          {p.glossary.map(([de, en]) => (
            <p key={de} className="text-sm">
              <b lang="de">{de}</b> — <span className="text-muted">{en}</span>
            </p>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Questions</h2>
        <div className="space-y-4">
          {p.questions.map((q, qi) => (
            <fieldset key={qi}>
              <legend className="mb-1 text-sm" lang="de">
                {qi + 1}. {q.q}
              </legend>
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex min-h-8 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => setChecked(true)}>Check answers</Button>
          {checked && (
            <span className="text-sm">
              {score} / {p.questions.length} correct
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

export default function Reading() {
  const { deck } = useDeck();
  const progress = useProgress();
  const lang = progress.settings.language;
  const { id } = useParams();
  if (!deck) return <p className="text-muted">Loading…</p>;
  if (id) {
    const p = deck.reading.find((r) => r.id === id);
    return p ? <PassageView p={p} deck={deck} /> : <p className="text-muted">Passage not found.</p>;
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(lang, "practice.reading")}</h1>
        <p className="text-muted">Short passages with a glossary and comprehension questions.</p>
      </header>
      {deck.levels.map((L) => {
        const ps = deck.reading.filter((r) => r.level === L.id);
        if (!ps.length) return null;
        return (
          <section key={L.id}>
            <h2 className="mb-2 text-lg font-semibold">
              {L.name} · {L.title}
            </h2>
            <div className="space-y-2">
              {ps.map((p) => (
                <Link
                  key={p.id}
                  to={`/reading/${p.id}`}
                  className="block rounded-lg border border-line bg-surface p-3 text-sm hover:bg-soft"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
