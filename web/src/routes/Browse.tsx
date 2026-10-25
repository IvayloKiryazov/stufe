import { useState } from "react";
import { Link } from "react-router-dom";
import { Art } from "../components/Art";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import type { Deck, Group } from "../lib/data";
import type { Progress as Prog } from "../lib/store";
import { unlocked } from "../lib/selectors";
import { passed } from "../lib/srsCore";
import { store } from "../lib/store";

function groupProgress(g: Group, progress: Prog) {
  const total = g.items.length;
  const done = g.items.filter((id) => passed(progress.p[id])).length;
  return { total, done };
}

function StudyLink({ levelIdx, group, open }: { levelIdx: number; group: Group; open: boolean }) {
  const lang = useProgress().settings.language;
  if (!open) return <span className="text-xs text-muted">{t(lang, "browse.locked")}</span>;
  return (
    <Button asChild variant="link" size="sm">
      <Link to={`/study?group=${encodeURIComponent(group.id)}&level=${levelIdx}`}>{t(lang, "browse.study")}</Link>
    </Button>
  );
}

function CoursePath({ deck, progress }: { deck: Deck; progress: Prog }) {
  const lang = progress.settings.language;
  const flat = deck.levels.flatMap((L, i) =>
    L.groups.filter((g) => !g.name.startsWith("Core ")).map((g) => ({ L, i, g })),
  );
  const isComplete = (g: Group) => {
    const { total, done } = groupProgress(g, progress);
    return total > 0 && done >= total;
  };
  const firstIncomplete = flat.findIndex((x) => !isComplete(x.g));

  return (
    <ol className="space-y-2">
      {flat.map(({ L, i, g }, idx) => {
        const { total, done } = groupProgress(g, progress);
        const open = unlocked(deck, i, progress);
        const next = idx === firstIncomplete;
        return (
          <li key={g.id} className={`rounded-lg border bg-surface p-3 ${next ? "border-ink" : "border-line"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">
                  {idx + 1}. {g.name}
                  {next && <span className="ml-2 rounded bg-soft px-2 py-0.5 text-xs">{t(lang, "browse.next")}</span>}
                </div>
                {g.subtitle && <div className="text-xs text-muted">{g.subtitle}</div>}
              </div>
              <StudyLink levelIdx={i} group={g} open={open} />
            </div>
            <Progress className="mt-2" value={total ? (done / total) * 100 : 0} label={`${g.name} progress`} />
            <div className="text-xs text-muted">
              {done}/{total} · {L.name}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Browse() {
  const { deck } = useDeck();
  const progress = useProgress();
  const [mode, setMode] = useState<"course" | "vocab">("course");
  const [pos, setPos] = useState<"all" | "noun" | "verb" | "adj">("all");
  const [topN, setTopN] = useState(50);
  const [confirmKnown, setConfirmKnown] = useState(false);
  const lang = progress.settings.language;

  if (!deck) return <p className="text-muted">{t(lang, "common.loading")}</p>;
  const isVocab = (g: Group) =>
    g.name.startsWith("Core ") && (g.kind === "noun" || g.kind === "verb" || g.kind === "adj");
  const idxOf = (level: string) => deck.levels.findIndex((l) => l.id === level);
  const ranked = Object.values(deck.by)
    .filter((i) => i.freqRank && (i.kind === "noun" || i.kind === "verb" || i.kind === "adj"))
    .sort((a, b) => (a.freqRank ?? 0) - (b.freqRank ?? 0));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t(lang, "browse.title")}</h1>
        <div className="flex gap-1 rounded-lg bg-soft p-1">
          {(["course", "vocab"] as const).map((m) => (
            <Button key={m} size="sm" variant={mode === m ? "default" : "ghost"} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {t(lang, m === "course" ? "browse.course" : "browse.vocabulary")}
            </Button>
          ))}
        </div>
      </header>
      <p className="text-sm text-muted">
        {mode === "course" ? t(lang, "browse.courseHint") : t(lang, "browse.vocabHint")}
      </p>

      {mode === "vocab" && (
        <div className="flex flex-wrap gap-1">
          {(["all", "noun", "verb", "adj"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={pos === p ? "default" : "ghost"}
              aria-pressed={pos === p}
              onClick={() => setPos(p)}
            >
              {p === "all"
                ? t(lang, "browse.all")
                : p === "noun"
                  ? t(lang, "browse.nouns")
                  : p === "verb"
                    ? t(lang, "browse.verbs")
                    : t(lang, "browse.adjectives")}
            </Button>
          ))}
        </div>
      )}

      {mode === "vocab" && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted">{t(lang, "browse.topByFrequency")}</span>
          {[50, 100, 250].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={topN === n ? "default" : "ghost"}
              aria-pressed={topN === n}
              onClick={() => setTopN(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      )}

      {mode === "vocab" && (() => {
        const visible = ranked.slice(0, topN);
        const unknown = visible.filter((it) => !progress.p[it.id]?.known);
        return (
          <Card>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t(lang, "browse.topN", { n: topN })}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={!unknown.length}
                onClick={() => {
                  if (!confirmKnown) {
                    setConfirmKnown(true);
                    return;
                  }
                  store.markKnownMany(unknown.map((it) => it.id));
                  setConfirmKnown(false);
                }}
              >
                {t(lang, confirmKnown ? "browse.markKnownConfirm" : "browse.markKnownMany", { n: unknown.length })}
              </Button>
            </div>
            <ul className="space-y-1">
              {visible.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="text-xs text-muted">#{it.freqRank}</span>{" "}
                    <span className="font-serif" lang="de">
                      <Art text={it.de ?? ""} />
                    </span>{" "}
                    <span className="text-muted">— {it.en}</span>
                    {progress.p[it.id]?.known && <span className="ml-2 text-xs text-good">{t(lang, "browse.known")}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => store.markKnown(it.id)}>
                      {t(lang, "common.knowThis")}
                    </Button>
                    <Link
                      to={`/study?mode=practice&group=${encodeURIComponent(it.group)}&level=${idxOf(it.level)}`}
                      className="text-xs text-muted underline"
                    >
                      {t(lang, "browse.practice")}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })()}

      {mode === "course" ? (
        <CoursePath deck={deck} progress={progress} />
      ) : (
        <Accordion type="multiple" className="rounded-xl border border-line bg-surface px-4">
          {deck.levels.map((level, i) => {
            const open = unlocked(deck, i, progress);
            const groups = level.groups.filter((g) => isVocab(g) && (pos === "all" || g.kind === pos));
            if (!groups.length) return null;
            return (
              <AccordionItem key={level.id} value={level.id}>
                <AccordionTrigger>
                  <span>
                    {level.name} · {level.title} {!open && <span className="text-muted">({t(lang, "browse.locked")})</span>}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {groups.map((g) => {
                      const { total, done } = groupProgress(g, progress);
                      return (
                        <div key={g.id} className="border-l-2 border-soft pl-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm">{g.name}</span>
                            <StudyLink levelIdx={i} group={g} open={open} />
                          </div>
                          <Progress value={total ? (done / total) * 100 : 0} label={`${g.name} progress`} />
                          <div className="text-xs text-muted">
                            {done} / {total}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
