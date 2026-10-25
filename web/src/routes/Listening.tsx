import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import { store } from "../lib/store";
import { speak } from "../lib/tts";

export default function Listening() {
  const { deck } = useDeck();
  const progress = useProgress();
  const lang = progress.settings.language;
  const [id, setId] = useState<string>("");
  const [rate, setRate] = useState("0.9");
  const [reveal, setReveal] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const passage = deck?.reading.find((r) => r.id === id) ?? deck?.reading[0] ?? null;

  useEffect(() => {
    if (!passage) return;
    if (!progress.settings.autoSpeak || !progress.settings.voice) return;
    speak(passage.text, { rate: Number(rate) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage?.id, progress.settings.autoSpeak, progress.settings.voice]);

  if (!deck) return <p className="text-muted">{t(lang, "common.loading")}</p>;
  if (!deck.reading.length) return <p className="text-muted">{t(lang, "practice.noPassages")}</p>;
  if (!passage) return <p className="text-muted">{t(lang, "practice.noPassages")}</p>;

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
        <h1 className="text-3xl font-bold">{t(lang, "practice.listening")}</h1>
        <p className="text-muted">{t(lang, "practice.listenHint")}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={passage.id} onValueChange={choose}>
          <SelectTrigger className="w-56" aria-label={t(lang, "practice.passage")}>
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
          <SelectTrigger className="w-32" aria-label={t(lang, "practice.speed")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.7">{t(lang, "practice.slow")}</SelectItem>
            <SelectItem value="0.9">{t(lang, "practice.normal")}</SelectItem>
            <SelectItem value="1.1">{t(lang, "practice.fast")}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => speak(passage.text, { rate: Number(rate) })}>
          <Volume2 className="h-4 w-4" /> {t(lang, "common.play")}
        </Button>
      </div>

      <Card>
        <CardTitle>{t(lang, "common.questions")}</CardTitle>
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
                    onChange={() =>
                      setAnswers((a) => {
                        const next = a.slice();
                        next[qi] = oi;
                        return next;
                      })
                    }
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              setChecked(true);
              store.logPractice("listening", score >= Math.ceil(passage.questions.length * 0.8), passage.level);
            }}
          >
            {t(lang, "common.checkAnswers")}
          </Button>
          <Button variant="outline" onClick={() => setReveal((r) => !r)}>
            {t(lang, reveal ? "common.hideText" : "common.showText")}
          </Button>
          {checked && (
            <span className="text-sm">
              {t(lang, "practice.correctCount", { score, total: passage.questions.length })}
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
