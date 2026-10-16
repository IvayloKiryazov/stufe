import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useDeck } from "../hooks/useDeck";
import { speak } from "../lib/tts";

export default function Listening() {
  const { deck } = useDeck();
  const [id, setId] = useState<string>("");
  const [rate, setRate] = useState("0.9");
  const [reveal, setReveal] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  if (!deck) return <p className="text-muted">Loading…</p>;
  if (!deck.reading.length) return <p className="text-muted">No passages available.</p>;

  const passage = deck.reading.find((r) => r.id === id) ?? deck.reading[0];
  const score = passage.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);

  const choose = (v: string) => {
    setId(v);
    setReveal(false);
    setChecked(false);
    setAnswers([]);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Listening</h1>
        <p className="text-muted">Listen to a passage, answer the questions, then reveal the text.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={passage.id} onValueChange={choose}>
          <SelectTrigger className="w-56" aria-label="Passage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deck.reading.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rate} onValueChange={setRate}>
          <SelectTrigger className="w-32" aria-label="Speed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.7">Slow</SelectItem>
            <SelectItem value="0.9">Normal</SelectItem>
            <SelectItem value="1.1">Fast</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => speak(passage.text, { rate: Number(rate) })}>
          <Volume2 className="h-4 w-4" /> Play
        </Button>
      </div>

      <Card>
        <CardTitle>Questions</CardTitle>
        <div className="space-y-4">
          {passage.questions.map((q, qi) => (
            <fieldset key={qi}>
              <legend className="mb-1 text-sm" lang="de">
                {qi + 1}. {q.q}
              </legend>
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex min-h-8 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`l${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => setChecked(true)}>Check answers</Button>
          <Button variant="outline" onClick={() => setReveal((r) => !r)}>
            {reveal ? "Hide text" : "Show text"}
          </Button>
          {checked && (
            <span className="text-sm">
              {score} / {passage.questions.length} correct
            </span>
          )}
        </div>
        {reveal && (
          <p className="mt-4 border-t border-line pt-4 font-serif" lang="de">
            {passage.text}
          </p>
        )}
      </Card>
    </div>
  );
}
