import { Card, CardTitle, Stat } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { addDays, daysToFinish, reviewLoad } from "../lib/projection";
import { itemsOfLevel } from "../lib/selectors";
import { isActive, passed } from "../lib/srsCore";
import { recentDays, streak, totals } from "../lib/stats";

const HEAT = ["var(--soft)", "#a7dcc0", "#6cc79e", "#37a878", "#1d7d57"];
function heat(v: number, max: number): string {
  if (v <= 0) return HEAT[0];
  return HEAT[Math.min(4, Math.max(1, Math.ceil((v / max) * 4)))];
}

export default function Stats() {
  const { deck } = useDeck();
  const progress = useProgress();
  if (!deck) return <p className="text-muted">Loading…</p>;

  const now = Date.now();
  const t = totals(progress.history);
  const st = streak(progress.history, now);
  const started = Object.keys(progress.p).filter((id) => deck.by[id]).length;
  const passedCount = Object.keys(progress.p).filter((id) => deck.by[id] && passed(progress.p[id])).length;
  const days = recentDays(progress.history, 35, now);
  const max = Math.max(1, ...days.map((d) => d.total));
  const leeches = Object.keys(progress.p)
    .filter((id) => deck.by[id] && (progress.p[id].lapses ?? 0) > 0)
    .sort((a, b) => (progress.p[b].lapses ?? 0) - (progress.p[a].lapses ?? 0))
    .slice(0, 20);
  const perDay = progress.settings.newPerLesson || 5;

  const dayStart = (d: number) => {
    const x = new Date(now);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() + d);
    return x.getTime();
  };
  const forecast = Array.from({ length: 14 }, (_, d) => {
    const start = dayStart(d);
    const end = start + 86400000;
    const count = Object.keys(progress.p).filter(
      (id) => deck.by[id] && isActive(progress.p[id]) && progress.p[id].due >= start && progress.p[id].due < end,
    ).length;
    return { d, count };
  });
  let cum = 0;
  const projections = deck.levels.map((L, i) => {
    const ids = itemsOfLevel(deck, i);
    const remaining = ids.length - ids.filter((id) => progress.p[id]).length;
    const d = daysToFinish(remaining, perDay);
    if (Number.isFinite(d)) cum += d;
    return { L, remaining, d, by: Number.isFinite(d) ? addDays(now, cum) : null };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stats</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={st} label="day streak" />
            <Stat value={t.reviews} label="reviews all time" />
            <Stat value={started} label="items started" />
            <Stat value={passedCount} label="items passed" />
          </div>
          <Card>
            <CardTitle>Last 5 weeks</CardTitle>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => (
                <span
                  key={d.key}
                  title={`${d.key}: ${d.total}`}
                  className="aspect-square rounded"
                  style={{ backgroundColor: heat(d.total, max) }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              {t.new} new items and {t.reviews} reviews over {t.days} active days.
            </p>
          </Card>
          <Card>
            <CardTitle>Next 14 days</CardTitle>
            <div className="flex items-end gap-1">
              {forecast.map((f) => (
                <div key={f.d} className="flex-1" title={`+${f.d}d: ${f.count}`}>
                  <div
                    className="w-full rounded-t opacity-70"
                    style={{ height: `${Math.min(80, f.count * 3) + 2}px`, backgroundColor: "var(--ink)" }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              Due today {forecast[0].count} · tomorrow {forecast[1].count} · next 7 days{" "}
              {forecast.slice(0, 7).reduce((n, f) => n + f.count, 0)}
            </p>
          </Card>
          {leeches.length > 0 && (
            <Card>
              <CardTitle>Leeches</CardTitle>
              <div className="space-y-1">
                {leeches.map((id) => {
                  const it = deck.by[id];
                  const label = it.kind === "cloze" ? `${it.prompt} → ${it.answer}` : `${it.en} → ${it.de}`;
                  return (
                    <p key={id} className="text-sm">
                      <b>{progress.p[id].lapses ?? 0}×</b> {label}
                    </p>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projections" className="space-y-4 pt-4">
          <Card>
            <CardTitle>At your pace of {perDay} new items/day</CardTitle>
            <div className="space-y-1">
              {projections.map((p) => (
                <p key={p.L.id} className="text-sm">
                  <b>{p.L.name}</b> — {p.remaining} left · {Number.isFinite(p.d) ? `${p.d} days` : "∞"}
                  {p.by && ` · by ${new Date(p.by).toLocaleDateString()}`}
                </p>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              Estimated steady-state review load: about {reviewLoad(perDay)} reviews/day.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
