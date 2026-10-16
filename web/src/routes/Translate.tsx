import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { equals, tokenSimilarity } from "../lib/grade";
import { shuffle } from "../lib/shuffle";

export default function Translate() {
  const { deck } = useDeck();
  const progress = useProgress();
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<"ask" | "fb">("ask");
  const [ok, setOk] = useState(false);
  const [sim, setSim] = useState(0);
  const [okCount, setOkCount] = useState(0);

  const queue = useMemo(() => {
    if (!deck) return [] as string[];
    const all = Object.keys(deck.by).filter((id) => deck.by[id].sentence_de && deck.by[id].sentence_en);
    const learned = all.filter((id) => progress.p[id]);
    return shuffle(learned.length >= 5 ? learned : all).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  if (!deck) return <p className="text-muted">Loading…</p>;
  if (!queue.length) return <p className="text-muted">No sentences available.</p>;

  if (i >= queue.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Translation done</h1>
        <p className="text-muted">
          {okCount} / {queue.length} correct.
        </p>
      </div>
    );
  }

  const item = deck.by[queue[i]];
  const target = item.sentence_de ?? "";

  const check = () => {
    const good = equals(value, target);
    setOk(good);
    setSim(tokenSimilarity(value, target));
    if (good) setOkCount((n) => n + 1);
    setPhase("fb");
  };
  const next = () => {
    setI((n) => n + 1);
    setValue("");
    setPhase("ask");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <h1 className="text-sm font-normal">Translate</h1>
        <Progress className="flex-1" value={(i / queue.length) * 100} label="Session progress" />
        <span>
          {i + 1}/{queue.length}
        </span>
      </div>
      <Card>
        <p className="mb-2 text-sm text-muted">Translate into German</p>
        <p className="font-serif text-xl">{item.sentence_en}</p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={phase === "fb"}
          lang="de"
          autoComplete="off"
          spellCheck={false}
          aria-label="Your German sentence"
          className="mt-3 w-full rounded-md border-2 border-line bg-bg px-3 py-2 text-lg"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (phase === "ask") check();
            else next();
          }}
        />
        <div className="mt-3">
          {phase === "ask" ? (
            <Button disabled={!value.trim()} onClick={check}>
              Check
            </Button>
          ) : (
            <Button onClick={next}>Next</Button>
          )}
        </div>
        {phase === "fb" && (
          <div className="mt-4 border-t border-line pt-4">
            <p className={ok ? "font-bold text-good" : "font-bold text-bad"}>
              {ok ? "Correct" : `Close (${Math.round(sim * 100)}% match)`}
            </p>
            <p className="font-serif" lang="de">
              {target}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
