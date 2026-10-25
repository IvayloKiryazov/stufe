import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardTitle, Stat } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { CAN_DO, EXAM, SKILLS } from "../lib/cefr";
import { t as tr } from "../lib/i18n";
import { addDays, daysToFinish, reviewLoad } from "../lib/projection";
import { itemsOfLevel } from "../lib/selectors";
import { isActive, passed } from "../lib/srsCore";
import { heatmapWeeks, streak, totals } from "../lib/stats";

const HEAT = ["var(--soft)", "#a7dcc0", "#6cc79e", "#37a878", "#1d7d57"];
function heat(v: number, max: number): string {
  if (v <= 0) return HEAT[0];
  return HEAT[Math.min(4, Math.max(1, Math.ceil((v / max) * 4)))];
}

export default function Stats() {
  const { deck } = useDeck();
  const progress = useProgress();
  const lang = progress.settings.language;
  if (!deck) return <p className="text-muted">{tr(lang, "common.loading")}</p>;

  const now = Date.now();
  const t = totals(progress.history);
  const st = streak(progress.history, now);
  const started = Object.keys(progress.p).filter((id) => deck.by[id]).length;
  const passedCount = Object.keys(progress.p).filter((id) => deck.by[id] && passed(progress.p[id])).length;
  const weekly = heatmapWeeks(progress.history, 26, now);
  const max = Math.max(1, ...weekly.flat().filter(Boolean).map((c) => c!.total));
  const leeches = Object.keys(progress.p)
    .filter((id) => deck.by[id] && (progress.p[id].lapses ?? 0) > 0)
    .sort((a, b) => (progress.p[b].lapses ?? 0) - (progress.p[a].lapses ?? 0))
    .slice(0, 20);
  const perDay = progress.settings.newPerLesson || 5;

  const skillProgress = SKILLS.map((s) => {
    const label = tr(lang, `skill.${s.key}`);
    if (s.key === "vocabulary" || s.key === "grammar" || s.key === "cloze") {
      const kind = s.key === "vocabulary" ? "noun" : s.key === "grammar" ? "cloze" : "vocab-cloze";
      const ids = Object.keys(deck.by).filter((id) => deck.by[id].kind === kind);
      const done = ids.filter((id) => passed(progress.p[id])).length;
      return {
        ...s,
        label,
        label2: tr(lang, "stats.skillSrs", { done, total: ids.length }),
        pct: ids.length ? (done / ids.length) * 100 : 0,
      };
    }
    let attempts = 0;
    let correct = 0;
    for (const [key, value] of Object.entries(progress.practice)) {
      if (key === s.key || key.startsWith(`${s.key}:`)) {
        attempts += value.attempts;
        correct += value.correct;
      }
    }
    return {
      ...s,
      label,
      label2: attempts
        ? tr(lang, "stats.skillAccuracy", { pct: Math.round((correct / attempts) * 100), n: attempts })
        : tr(lang, "stats.skillNotStarted"),
      pct: attempts ? (correct / attempts) * 100 : 0,
    };
  });

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
      <h1 className="text-3xl font-bold">{tr(lang, "stats.title")}</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{tr(lang, "stats.overview")}</TabsTrigger>
          <TabsTrigger value="levels">{tr(lang, "stats.levels")}</TabsTrigger>
          <TabsTrigger value="projections">{tr(lang, "stats.projections")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={st} label={tr(lang, "stats.dayStreak")} />
            <Stat value={t.reviews} label={tr(lang, "stats.reviewsAll")} />
            <Stat value={started} label={tr(lang, "stats.itemsStarted")} />
            <Stat value={passedCount} label={tr(lang, "stats.itemsPassed")} />
          </div>
          <Card>
            <CardTitle>{tr(lang, "stats.activity")}</CardTitle>
            <div className="overflow-x-auto pb-1">
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {weekly.flat().map((d, i) => (
                  <span
                    key={d?.key ?? `future-${i}`}
                    title={d ? `${d.key}: ${d.total}` : undefined}
                    aria-hidden={d ? undefined : true}
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: d ? heat(d.total, max) : "transparent" }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">
              {tr(lang, "stats.activitySummary", { new: t.new, reviews: t.reviews, days: t.days })}
            </p>
          </Card>
          <Card>
            <CardTitle>{tr(lang, "stats.next14")}</CardTitle>
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
              {tr(lang, "stats.dueToday", { n: forecast[0].count })} ·{" "}
              {tr(lang, "stats.tomorrow", { n: forecast[1].count })} ·{" "}
              {tr(lang, "stats.next7", { n: forecast.slice(0, 7).reduce((n, f) => n + f.count, 0) })}
            </p>
          </Card>
          <Card>
            <CardTitle>{tr(lang, "stats.skills")}</CardTitle>
            <div className="space-y-2">
              {skillProgress.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span>{s.label}</span>
                    <span className="text-xs text-muted">{s.label2}</span>
                  </div>
                  <Progress value={s.pct} label={s.label} />
                </div>
              ))}
            </div>
          </Card>
          {leeches.length > 0 && (
            <Card>
              <CardTitle>{tr(lang, "stats.leeches")}</CardTitle>
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

        <TabsContent value="levels" className="space-y-4 pt-4">
          <Card>
            <CardTitle>{tr(lang, "stats.canDo")}</CardTitle>
            <div className="space-y-4">
              {deck.levels.map((L, i) => {
                const ids = itemsOfLevel(deck, i);
                const done = ids.filter((id) => passed(progress.p[id])).length;
                return (
                  <div key={L.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {L.name} · {L.title}
                      </span>
                      <span className="text-xs text-muted">
                        {done}/{ids.length}
                      </span>
                    </div>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted">
                      {(CAN_DO[L.id] ?? []).map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                    {EXAM[L.id] && <p className="mt-1 text-xs text-muted">{EXAM[L.id]}</p>}
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link to={`/study?mode=checkpoint&level=${i}`}>{tr(lang, "stats.checkpoint")}</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardTitle>{tr(lang, "stats.skills")}</CardTitle>
            <p className="text-sm text-muted">{tr(lang, "stats.skillsHint")}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {SKILLS.map((s) => (
                <span key={s.key} className="rounded-full bg-soft px-3 py-0.5 text-xs text-muted">
                  {tr(lang, `skill.${s.key}`)}
                </span>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4 pt-4">
          <Card>
            <CardTitle>{tr(lang, "stats.pace", { n: perDay })}</CardTitle>
            <div className="space-y-1">
              {projections.map((p) => (
                <p key={p.L.id} className="text-sm">
                  <b>{p.L.name}</b> — {tr(lang, "stats.left", { n: p.remaining })} ·{" "}
                  {Number.isFinite(p.d) ? tr(lang, "stats.days", { n: p.d }) : "∞"}
                  {p.by && ` · ${tr(lang, "stats.by", { date: new Date(p.by).toLocaleDateString() })}`}
                </p>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              {tr(lang, "stats.reviewLoad", { n: reviewLoad(perDay) })}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
