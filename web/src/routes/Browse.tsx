import { useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import type { Deck, Group } from "../lib/data";
import type { Progress as Prog } from "../lib/store";
import { unlocked } from "../lib/selectors";
import { passed } from "../lib/srsCore";

function groupProgress(g: Group, progress: Prog) {
  const total = g.items.length;
  const done = g.items.filter((id) => passed(progress.p[id])).length;
  return { total, done };
}

function StudyLink({ levelIdx, group, open }: { levelIdx: number; group: Group; open: boolean }) {
  if (!open) return <span className="text-xs text-muted">locked</span>;
  return (
    <Button asChild variant="link" size="sm">
      <Link to={`/study?group=${encodeURIComponent(group.id)}&level=${levelIdx}`}>Study</Link>
    </Button>
  );
}

function CoursePath({ deck, progress }: { deck: Deck; progress: Prog }) {
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
                  {next && <span className="ml-2 rounded bg-soft px-2 py-0.5 text-xs">Next</span>}
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
  const lang = progress.settings.language;

  if (!deck) return <p className="text-muted">Loading…</p>;
  const isVocab = (g: Group) =>
    g.name.startsWith("Core ") && (g.kind === "noun" || g.kind === "verb" || g.kind === "adj");

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
        {mode === "course"
          ? "The guided course (A1–B1), in order. Follow the path top to bottom."
          : "The optional frequency deck: thousands of high-frequency words by level."}
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
              {p === "all" ? "All" : p === "noun" ? "Nouns" : p === "verb" ? "Verbs" : "Adjectives"}
            </Button>
          ))}
        </div>
      )}

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
                    {level.name} · {level.title} {!open && <span className="text-muted">(locked)</span>}
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
