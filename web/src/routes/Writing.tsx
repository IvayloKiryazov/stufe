import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { tokenSimilarity, wordDiff } from "../lib/grade";
import { shuffle } from "../lib/shuffle";

export default function Writing() {
  const { deck } = useDeck();
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

  if (!deck) return <p className="text-muted">Loading…</p>;
  if (!sentences.length) return <p className="text-muted">No prompts available.</p>;

  const item = deck.by[sentences[i]];
  const target = item.sentence_de ?? "";
  const sim = model != null ? Math.round(tokenSimilarity(text, target) * 100) : 0;
  const diff = model != null ? wordDiff(text, target) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <h1 className="text-sm font-normal">Writing</h1>
        <Progress className="flex-1" value={(i / sentences.length) * 100} label="Session progress" />
        <span>
          {i + 1}/{sentences.length}
        </span>
      </div>
      <Card>
        <p className="mb-2 text-sm text-muted">Write this in German.</p>
        <p className="font-serif text-xl">{item.sentence_en}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          lang="de"
          spellCheck={false}
          aria-label="Your German text"
          className="mt-3 min-h-24 w-full rounded-md border-2 border-line bg-bg p-3 text-lg"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => setModel(target)} disabled={!text.trim()}>
            Show model
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setI((n) => n + 1);
              setText("");
              setModel(null);
            }}
          >
            Next
          </Button>
        </div>
        {model != null && diff && (
          <div className="mt-4 space-y-1 border-t border-line pt-4">
            <p className="font-serif" lang="de">
              {target}
            </p>
            <p className="text-sm text-muted">About {sim}% of your words match the model.</p>
            {diff.missing.length > 0 && (
              <p className="text-sm">
                <b>Missing:</b> <span lang="de">{diff.missing.join(", ")}</span>
              </p>
            )}
            {diff.extra.length > 0 && (
              <p className="text-sm text-bad">
                Extra: <span lang="de">{diff.extra.join(", ")}</span>
              </p>
            )}
            {diff.missing.length === 0 && diff.extra.length === 0 && (
              <p className="text-sm text-good">Perfect match.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
