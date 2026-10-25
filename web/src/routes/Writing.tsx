import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import { tokenSimilarity, wordDiff } from "../lib/grade";
import { shuffle } from "../lib/shuffle";
import { store } from "../lib/store";

export default function Writing() {
  const { deck } = useDeck();
  const progress = useProgress();
  const lang = progress.settings.language;
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [model, setModel] = useState<string | null>(null);

  const sentences = useMemo(
    () =>
      deck
        ? shuffle(Object.keys(deck.by).filter((id) => deck.by[id].sentence_de && deck.by[id].sentence_en)).slice(0, 10)
        : [],
    [deck],
  );

  if (!deck) return <p className="text-muted">{t(lang, "common.loading")}</p>;
  if (!sentences.length) return <p className="text-muted">{t(lang, "practice.noPrompts")}</p>;

  const item = deck.by[sentences[i]];
  const target = item.sentence_de ?? "";
  const sim = model != null ? Math.round(tokenSimilarity(text, target) * 100) : 0;
  const diff = model != null ? wordDiff(text, target) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <h1 className="text-sm font-normal">{t(lang, "practice.writing")}</h1>
        <Progress className="flex-1" value={(i / sentences.length) * 100} label={t(lang, "common.sessionProgress")} />
        <span>
          {i + 1}/{sentences.length}
        </span>
      </div>
      <Card>
        <p className="mb-2 text-sm text-muted">{t(lang, "practice.writingInstruction")}</p>
        <p className="font-serif text-xl">{item.sentence_en}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          lang="de"
          spellCheck={false}
          aria-label={t(lang, "practice.writingPlaceholder")}
          className="mt-3 min-h-24 w-full rounded-md border-2 border-line bg-bg p-3 text-lg"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setModel(target);
              store.logPractice("writing", tokenSimilarity(text, target) >= 0.8, item.level);
            }}
            disabled={!text.trim()}
          >
            {t(lang, "practice.showModel")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setI((n) => n + 1);
              setText("");
              setModel(null);
            }}
          >
            {t(lang, "common.next")}
          </Button>
        </div>
        {model != null && diff && (
          <div className="mt-4 space-y-1 border-t border-line pt-4">
            <p className="font-serif" lang="de">
              {target}
            </p>
            <p className="text-sm text-muted">{t(lang, "practice.matchModel", { pct: sim })}</p>
            {diff.missing.length > 0 && (
              <p className="text-sm">
                <b>{t(lang, "practice.missing")}</b> <span lang="de">{diff.missing.join(", ")}</span>
              </p>
            )}
            {diff.extra.length > 0 && (
              <p className="text-sm text-bad">
                {t(lang, "practice.extra")} <span lang="de">{diff.extra.join(", ")}</span>
              </p>
            )}
            {diff.missing.length === 0 && diff.extra.length === 0 && (
              <p className="text-sm text-good">{t(lang, "practice.perfect")}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
