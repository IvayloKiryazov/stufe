import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import type { Deck } from "../lib/data";
import { passed } from "../lib/srsCore";

function Point({ deck, levelIdx, groupId }: { deck: Deck; levelIdx: number; groupId: string }) {
  const level = deck.levels[levelIdx];
  const g = level?.groups.find((x) => x.id === groupId);
  if (!g) return <p className="text-muted">Grammar point not found.</p>;
  const examples = g.items
    .map((id) => deck.by[id])
    .filter((i) => i && i.kind === "cloze")
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <Link to="/grammar" className="text-sm text-muted">
        ← All grammar
      </Link>
      <header>
        <h1 className="text-3xl font-bold">{g.name}</h1>
        {g.subtitle && <p className="text-muted">{g.subtitle}</p>}
        <p className="text-sm text-muted">
          {level.name} · {level.title}
        </p>
      </header>
      <Card>
        <CardTitle>Rule</CardTitle>
        <p className="text-sm">{g.intro}</p>
      </Card>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Examples</h2>
        <div className="space-y-3">
          {examples.map((i) => (
            <div key={i.id}>
              <p className="font-serif" lang="de">
                {(i.prompt ?? "").replace("___", i.answer ?? "")}
              </p>
              <p className="text-sm text-muted">{i.en}</p>
            </div>
          ))}
        </div>
      </section>
      <Button asChild>
        <Link to={`/study?mode=practice&group=${encodeURIComponent(g.id)}&level=${levelIdx}`}>
          Cram this point
        </Link>
      </Button>
    </div>
  );
}

export default function Grammar() {
  const { deck } = useDeck();
  const progress = useProgress();
  const { level, group } = useParams();

  if (!deck) return <p className="text-muted">Loading…</p>;
  if (level != null && group != null)
    return <Point deck={deck} levelIdx={Number(level)} groupId={group} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Grammar</h1>
        <p className="text-muted">Study a point, see the rule and examples.</p>
      </header>
      {deck.levels.map((L, i) => {
        const groups = L.groups.filter((g) => g.kind === "cloze");
        if (!groups.length) return null;
        return (
          <section key={L.id}>
            <h2 className="mb-3 text-lg font-semibold">
              {L.name} · {L.title}
            </h2>
            <div className="space-y-3">
              {groups.map((g) => {
                const total = g.items.length;
                const done = g.items.filter((id) => passed(progress.p[id])).length;
                return (
                  <Link
                    key={g.id}
                    to={`/grammar/${i}/${encodeURIComponent(g.id)}`}
                    className="block rounded-lg border border-line bg-surface p-3 hover:bg-soft"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{g.name}</span>
                      <span className="text-xs text-muted">
                        {done} / {total}
                      </span>
                    </div>
                    {g.subtitle && <div className="text-xs text-muted">{g.subtitle}</div>}
                    <Progress className="mt-2" value={total ? (done / total) * 100 : 0} label={`${g.name} progress`} />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
