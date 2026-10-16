import { useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import type { Group } from "../lib/data";
import { unlocked } from "../lib/selectors";
import { passed } from "../lib/srsCore";

export default function Browse() {
  const { deck } = useDeck();
  const progress = useProgress();
  const [mode, setMode] = useState<"course" | "vocab">("course");

  if (!deck) return <p className="text-muted">Loading…</p>;

  const isVocab = (g: Group) => g.name.startsWith("Core ");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Browse</h1>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "course" | "vocab")}>
          <TabsList>
            <TabsTrigger value="course">Course</TabsTrigger>
            <TabsTrigger value="vocab">Vocabulary</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      <p className="text-sm text-muted">
        {mode === "course"
          ? "The guided course (A1–B1): nouns, verbs and grammar in order."
          : "The optional frequency deck: thousands of high-frequency words by level."}
      </p>

      <Accordion type="multiple" className="rounded-xl border border-line bg-surface px-4">
        {deck.levels.map((level, i) => {
          const open = unlocked(deck, i, progress);
          const groups = level.groups.filter((g) => (mode === "vocab") === isVocab(g));
          if (!groups.length) return null;
          return (
            <AccordionItem key={level.id} value={level.id}>
              <AccordionTrigger>
                <span>
                  {level.name} · {level.title}{" "}
                  {!open && <span className="text-muted">(locked)</span>}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {groups.map((g) => {
                    const total = g.items.length;
                    const done = g.items.filter((id) => passed(progress.p[id])).length;
                    return (
                      <div key={g.id} className="border-l-2 border-soft pl-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm">{g.name}</span>
                          {open ? (
                            <Button asChild variant="link" size="sm">
                              <Link to={`/study?group=${encodeURIComponent(g.id)}&level=${i}`}>Study</Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted">locked</span>
                          )}
                        </div>
                        <Progress value={total ? (done / total) * 100 : 0} />
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
    </div>
  );
}
