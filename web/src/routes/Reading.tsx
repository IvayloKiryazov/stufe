import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useDeck } from "../hooks/useDeck";
import type { Reading as Passage } from "../lib/data";
import { speak } from "../lib/tts";

function PassageView({ p }: { p: Passage }) {
  const [answers, setAnswers] = useState<number[]>(() => p.questions.map(() => -1));
  const [checked, setChecked] = useState(false);
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
          {p.text}
        </p>
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
  const { id } = useParams();
  if (!deck) return <p className="text-muted">Loading…</p>;
  if (id) {
    const p = deck.reading.find((r) => r.id === id);
    return p ? <PassageView p={p} /> : <p className="text-muted">Passage not found.</p>;
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Reading</h1>
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
