import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import { equals } from "../lib/grade";
import { shuffle } from "../lib/shuffle";
import { store } from "../lib/store";
import { speak } from "../lib/tts";

export default function Dictation() {
  const { deck } = useDeck();
  const progress = useProgress();
  const lang = progress.settings.language;
  const inputRef = useRef<HTMLInputElement>(null);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<"ask" | "fb">("ask");
  const [ok, setOk] = useState(false);
  const [okCount, setOkCount] = useState(0);

  const queue = useMemo(() => {
    if (!deck) return [] as string[];
    const all = Object.keys(deck.by).filter((id) => deck.by[id].sentence_de);
    const learned = all.filter((id) => progress.p[id]);
    return shuffle(learned.length >= 5 ? learned : all).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  const currentId = queue[i];
  const target = currentId && deck ? deck.by[currentId]?.sentence_de ?? "" : "";

  useEffect(() => {
    if (!currentId) return;
    if (!progress.settings.autoSpeak || !progress.settings.voice) return;
    speak(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, progress.settings.autoSpeak, progress.settings.voice]);

  if (!deck) return <p className="text-muted">{t(lang, "common.loading")}</p>;
  if (!queue.length) return <p className="text-muted">{t(lang, "practice.noSentences")}</p>;

  if (i >= queue.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t(lang, "practice.dictationDone")}</h1>
        <p className="text-muted">{t(lang, "practice.correctCount", { score: okCount, total: queue.length })}</p>
      </div>
    );
  }

  const item = deck.by[queue[i]];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <h1 className="text-sm font-normal">{t(lang, "practice.dictation")}</h1>
        <Progress className="flex-1" value={(i / queue.length) * 100} label={t(lang, "common.sessionProgress")} />
        <span>
          {i + 1}/{queue.length}
        </span>
      </div>
      <Card>
        <p className="mb-3 text-sm text-muted">{t(lang, "practice.dictationInstruction")}</p>
        <Button variant="outline" onClick={() => speak(target)}>
          <Volume2 className="h-4 w-4" /> {t(lang, "common.play")}
        </Button>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={phase === "fb"}
          lang="de"
          autoComplete="off"
          spellCheck={false}
          aria-label={t(lang, "practice.typeWhatYouHear")}
          className="mt-3 w-full rounded-md border-2 border-line bg-bg px-3 py-2 text-lg"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (phase === "ask") {
              const good = equals(value, target);
              setOk(good);
              store.logPractice("dictation", good, item.level);
              if (good) setOkCount((n) => n + 1);
              setPhase("fb");
            } else {
              setI((n) => n + 1);
              setValue("");
              setPhase("ask");
            }
          }}
        />
        <div className="mt-3">
          {phase === "ask" ? (
            <Button
              disabled={!value.trim()}
              onClick={() => {
                const good = equals(value, target);
                setOk(good);
                store.logPractice("dictation", good, item.level);
                if (good) setOkCount((n) => n + 1);
                setPhase("fb");
              }}
            >
              {t(lang, "common.check")}
            </Button>
          ) : (
            <Button onClick={() => { setI((n) => n + 1); setValue(""); setPhase("ask"); }}>{t(lang, "common.next")}</Button>
          )}
        </div>
        {phase === "fb" && (
          <div className="mt-4 border-t border-line pt-4">
            <p className={ok ? "font-bold text-good" : "font-bold text-bad"}>{t(lang, ok ? "common.correct" : "common.notQuite")}</p>
            <p className="font-serif" lang="de">
              {target}
            </p>
            <p className="text-sm text-muted">{item.sentence_en}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
