import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { Art } from "../components/Art";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Chip } from "../components/ui/chip";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { useStudy } from "../hooks/useStudy";
import type { Item } from "../lib/data";
import { speechText } from "../lib/judge";
import { dueIds } from "../lib/selectors";
import { passed } from "../lib/srsCore";
import { shuffle } from "../lib/shuffle";
import { stageName } from "../lib/stages";
import { store } from "../lib/store";
import { speak } from "../lib/tts";

const UMLAUTS = ["ä", "ö", "ü", "ß"];

function labelFor(it: Item): string {
  if (it.kind === "noun") return "German word with its article";
  if (it.kind === "verb") return "Verb (infinitive)";
  if (it.kind === "adj") return "Adjective";
  if (it.kind === "gender") return "Article (der/die/das)";
  if (it.kind === "plural") return "Plural form";
  return "Fill in the blank";
}

function Prompt({ it }: { it: Item }) {
  if (it.kind === "cloze") {
    return (
      <>
        <p className="font-serif text-2xl" lang="de">
          {(it.prompt ?? "").split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className="mx-1 inline-block w-[3ch] border-b-2 border-ink align-baseline" />}
            </span>
          ))}
        </p>
        <p className="text-muted">{it.en}</p>
        {it.hint && <Chip lang="de">{it.hint}</Chip>}
      </>
    );
  }
  if (it.kind === "gender" || it.kind === "plural") {
    return (
      <p className="font-serif text-2xl" lang="de">
        {it.prompt}
      </p>
    );
  }
  return <p className="font-serif text-2xl">{it.en}</p>;
}

function Reveal({ it }: { it: Item }) {
  return (
    <div className="space-y-1">
      {it.kind === "noun" && (
        <>
          <p className="font-serif text-xl" lang="de">
            <Art text={it.de ?? ""} />
          </p>
          {it.plural && (
            <p className="font-serif text-muted" lang="de">
              Plural: <Art text={it.plural} />
            </p>
          )}
        </>
      )}
      {(it.kind === "verb" || it.kind === "adj") && (
        <>
          <p className="font-serif text-xl" lang="de">
            {it.de}
          </p>
          {it.forms && (
            <p className="font-serif text-muted" lang="de">
              {it.forms}
            </p>
          )}
        </>
      )}
      {it.kind === "cloze" && (
        <>
          <p className="font-serif text-xl" lang="de">
            {(it.prompt ?? "").replace("___", it.answer ?? "")}
          </p>
          <p className="text-muted">{it.en}</p>
        </>
      )}
      {(it.kind === "gender" || it.kind === "plural") && (
        <>
          <p className="font-serif text-xl" lang="de">
            {it.de}
          </p>
          <p className="text-muted">{it.en}</p>
        </>
      )}
      {it.ipa && <p className="text-muted">{it.ipa}</p>}
      {it.conjugation?.present && (
        <p className="text-sm text-muted" lang="de">
          ich {it.conjugation.present[0]} · du {it.conjugation.present[1]} · er {it.conjugation.present[2]}
          <br />
          wir {it.conjugation.present[3]} · ihr {it.conjugation.present[4]} · sie {it.conjugation.present[5]}
        </p>
      )}
      {it.sentence_de && (
        <p className="text-sm text-muted" lang="de">
          <Art text={it.sentence_de} />
        </p>
      )}
      {it.sentence_en && <p className="text-sm text-muted">{it.sentence_en}</p>}
      {it.mnemonic && <p className="text-sm text-muted">{it.mnemonic}</p>}
      {it.note && <p className="text-sm text-muted">{it.note}</p>}
    </div>
  );
}

export default function Study() {
  const { deck, error } = useDeck();
  const progress = useProgress();
  const study = useStudy(deck);
  const { session } = study;
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [params] = useSearchParams();
  const startedRef = useRef(false);

  useEffect(() => {
    if (session?.phase === "ask") setValue("");
  }, [session?.queue[0], session?.phase]);

  // Auto-start a session when arriving from Browse or Grammar.
  useEffect(() => {
    if (startedRef.current || !deck || session) return;
    const g = params.get("group");
    const lvl = params.get("level");
    const mode = params.get("mode");
    if (g && lvl != null) {
      startedRef.current = true;
      if (mode === "practice") study.startGroupPractice(Number(lvl), g);
      else study.startGroup(Number(lvl), g);
    }
  }, [deck, params, session, study]);

  if (error) {
    return (
      <Card>
        <CardTitle>Could not load data</CardTitle>
        <p className="text-sm text-muted">{error}</p>
      </Card>
    );
  }
  if (!deck) return <p className="text-muted">Loading…</p>;

  if (!session) {
    const due = dueIds(deck, progress).length;
    const leeches = Object.keys(progress.p)
      .filter((id) => deck.by[id] && (progress.p[id].lapses ?? 0) > 0)
      .sort((a, b) => (progress.p[b].lapses ?? 0) - (progress.p[a].lapses ?? 0))
      .slice(0, 20);
    const passedIds = Object.keys(progress.p).filter((id) => deck.by[id] && passed(progress.p[id])).slice(0, 20);
    const burnedIds = Object.keys(progress.p).filter((id) => deck.by[id] && (progress.p[id].box ?? 0) >= 7).slice(0, 20);
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Study</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardTitle>Reviews</CardTitle>
            <p className="mb-3 text-sm text-muted">{due} due</p>
            <Button onClick={() => study.startReviews(false)} disabled={!due}>
              Start reviews
            </Button>
          </Card>
          <Card>
            <CardTitle>Lessons</CardTitle>
            <p className="mb-3 text-sm text-muted">
              {progress.settings.vacation ? "Paused (vacation mode)" : "Learn new items"}
            </p>
            <Button onClick={study.startLessons} disabled={progress.settings.vacation}>
              Start lessons
            </Button>
          </Card>
          <Card className="sm:col-span-2">
            <CardTitle>Extra study</CardTitle>
            <p className="mb-3 text-sm text-muted">Practice without changing your schedule</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!leeches.length} onClick={() => study.startReviews(true, shuffle(leeches))}>
                Leeches ({leeches.length})
              </Button>
              <Button variant="outline" disabled={!passedIds.length} onClick={() => study.startReviews(true, shuffle(passedIds))}>
                Passed ({passedIds.length})
              </Button>
              <Button variant="outline" disabled={!burnedIds.length} onClick={() => study.startReviews(true, shuffle(burnedIds))}>
                Burned ({burnedIds.length})
              </Button>
              <Button variant="outline" onClick={() => study.startReviews(true)}>
                Any learned
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (session.finished) {
    const pct = session.firstTotal ? Math.round((session.firstOK / session.firstTotal) * 100) : 0;
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Done</h1>
        <Card>
          <p className="text-lg">
            {session.firstOK} of {session.firstTotal} right on the first try ({pct}%).
          </p>
        </Card>
        <Button asChild>
          <Link to="/">Back to Today</Link>
        </Button>
      </div>
    );
  }

  const isLesson = session.mode === "lesson";
  const it = isLesson ? deck.by[session.queue[session.completed]] : deck.by[session.queue[0]];
  const pos = isLesson ? session.completed + 1 : session.completed;
  const fb = !isLesson && session.phase === "fb";
  const stage = fb && session.lastId ? store.state.p[session.lastId] : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="capitalize">{session.mode}</span>
        <Progress value={(pos / session.total) * 100} className="flex-1" label="Session progress" />
        <span>
          {pos}/{session.total}
        </span>
        <Button variant="ghost" size="sm" onClick={study.wrapUp}>
          Wrap up
        </Button>
        <Button variant="ghost" size="sm" onClick={study.stop}>
          Stop
        </Button>
      </div>

      <Card className={fb ? (session.last?.ok ? "border-l-4 border-l-good" : "border-l-4 border-l-bad") : undefined}>
        <div className="mb-2 text-sm text-muted">{labelFor(it)}</div>
        <Prompt it={it} />

        {isLesson ? (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <Reveal it={it} />
            <Button variant="ghost" size="sm" onClick={() => speak(speechText(it), { enabled: progress.settings.voice })}>
              <Volume2 className="h-4 w-4" /> Listen
            </Button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              readOnly={fb}
              lang="de"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Your answer"
              className="mt-3 w-full rounded-md border-2 border-line bg-bg px-3 py-2 text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (session.phase === "ask") study.submit(value);
                  else study.next();
                }
              }}
            />
            {!fb && (
              <div className="mt-2 flex gap-2">
                {UMLAUTS.map((c) => (
                  <Button
                    key={c}
                    variant="outline"
                    size="sm"
                    lang="de"
                    onClick={() => {
                      const el = inputRef.current;
                      const s = el?.selectionStart ?? value.length;
                      const e = el?.selectionEnd ?? s;
                      setValue(value.slice(0, s) + c + value.slice(e));
                      requestAnimationFrame(() => {
                        el?.focus();
                        el?.setSelectionRange(s + 1, s + 1);
                      });
                    }}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            )}
            <div className="mt-3">
              {session.phase === "ask" ? (
                <Button onClick={() => study.submit(value)} disabled={!value.trim()}>
                  Check
                </Button>
              ) : (
                <Button onClick={study.next}>Next</Button>
              )}
            </div>
            {fb && (
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <p className={session.last?.ok ? "font-bold text-good" : "font-bold text-bad"}>
                  {session.last?.ok ? "Correct" : "Not quite"}
                </p>
                {stage && <Chip>{stageName(stage.box)}</Chip>}
                {session.lastId && store.state.p[session.lastId]?.suspended && (
                  <p className="text-sm text-muted">Leech — auto-suspended. Resume it from Extra study → Leeches.</p>
                )}
                <Reveal it={it} />
                {session.last?.msg && <p className="text-sm text-muted">{session.last.msg}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => speak(speechText(it), { enabled: progress.settings.voice })}>
                    <Volume2 className="h-4 w-4" /> Listen
                  </Button>
                  <Button variant="ghost" size="sm" onClick={study.undo}>
                    Undo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={study.suspendCurrent}>
                    Suspend
                  </Button>
                  <Button variant="ghost" size="sm" onClick={study.knowCurrent}>
                    I know this
                  </Button>
                  {!session.last?.ok && (
                    <Button variant="link" size="sm" onClick={study.override}>
                      I was right (typo)
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {isLesson && (
          <div className="mt-4">
            <Button onClick={study.lessonNext}>
              {session.completed === session.total - 1 ? "Add to reviews" : "Next"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
