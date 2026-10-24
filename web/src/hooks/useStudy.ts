import { useCallback, useState } from "react";
import type { Deck } from "../lib/data";
import { judge } from "../lib/judge";
import { availableIds, dueIds, itemsOfLevel, upcomingIds } from "../lib/selectors";
import { shuffle } from "../lib/shuffle";
import type { Entry } from "../lib/srsCore";
import { store } from "../lib/store";

export type Mode = "lesson" | "review" | "practice" | "checkpoint";

export interface Last {
  ok: boolean;
  msg: string;
  first: boolean;
}

export interface Session {
  mode: Mode;
  queue: string[];
  total: number;
  completed: number;
  phase: "ask" | "fb";
  last: Last | null;
  lastId?: string;
  given: string;
  firstOK: number;
  firstTotal: number;
  seen: Record<string, true>;
  prev: Record<string, Entry | null>;
  finished: boolean;
  wrapUp: boolean;
}

function mk(mode: Mode, ids: string[]): Session {
  return {
    mode,
    queue: ids,
    total: ids.length,
    completed: 0,
    phase: "ask",
    last: null,
    given: "",
    firstOK: 0,
    firstTotal: 0,
    seen: {},
    prev: {},
    finished: false,
    wrapUp: false,
  };
}

export function useStudy(deck: Deck | null) {
  const [session, setSession] = useState<Session | null>(null);

  const startLessons = useCallback(() => {
    if (!deck) return;
    const batch = availableIds(deck, store.state, store.state.settings.newPerLesson);
    if (batch.length) setSession(mk("lesson", batch));
  }, [deck]);

  const startGroup = useCallback(
    (levelIdx: number, groupId: string) => {
      if (!deck) return;
      const g = deck.levels[levelIdx]?.groups.find((x) => x.id === groupId);
      if (!g) return;
      const batch = g.items.filter((id) => !store.state.p[id]).slice(0, store.state.settings.newPerLesson);
      if (batch.length) setSession(mk("lesson", batch));
    },
    [deck],
  );

  const startGroupPractice = useCallback(
    (levelIdx: number, groupId: string) => {
      if (!deck) return;
      const g = deck.levels[levelIdx]?.groups.find((x) => x.id === groupId);
      if (!g) return;
      const ids = g.items.filter((id) => deck.by[id]);
      if (ids.length) setSession(mk("practice", shuffle(ids)));
    },
    [deck],
  );

  const startReviews = useCallback(
    (practice = false, explicit?: string[]) => {
      if (!deck) return;
      const ids =
        explicit && explicit.length
          ? explicit.slice()
          : practice
            ? shuffle(Object.keys(store.state.p).filter((id) => deck.by[id])).slice(0, 20)
            : shuffle(dueIds(deck, store.state));
      if (ids.length) setSession(mk(practice ? "practice" : "review", ids));
    },
    [deck],
  );

  const stop = useCallback(() => setSession(null), []);

  /** A scored checkpoint over a level's items; does not change the schedule. */
  const startCheckpoint = useCallback(
    (levelIdx: number) => {
      if (!deck) return;
      const ids = itemsOfLevel(deck, levelIdx).filter((id) => deck.by[id]);
      if (ids.length) setSession(mk("checkpoint", shuffle(ids).slice(0, 10)));
    },
    [deck],
  );

  /** Study items that are due later (ahead of schedule). Grades count. */
  const startAhead = useCallback(
    (withinMs?: number) => {
      if (!deck) return;
      const ids = upcomingIds(deck, store.state, Date.now(), withinMs);
      if (ids.length) setSession(mk("review", ids));
    },
    [deck],
  );

  /* Finish the current card and end the session (no new cards pulled in). */
  const wrapUp = useCallback(() => {
    if (!session) return;
    setSession({ ...session, queue: session.queue.slice(0, 1), wrapUp: true });
  }, [session]);

  const submit = useCallback(
    (given: string) => {
      if (!session || !deck) return;
      const id = session.queue[0];
      const item = deck.by[id];
      const j = judge(item, given);
      const first = !session.seen[id];
      const seen = { ...session.seen };
      const prev = { ...session.prev };
      let firstOK = session.firstOK;
      let firstTotal = session.firstTotal;
      if (first) {
        seen[id] = true;
        firstTotal++;
        if (j.ok) firstOK++;
        if (session.mode === "lesson" || session.mode === "review") prev[id] = store.grade(id, j.ok);
      }
      setSession({
        ...session,
        seen,
        prev,
        firstOK,
        firstTotal,
        last: { ok: j.ok, msg: j.msg, first },
        lastId: id,
        given,
        phase: "fb",
      });
    },
    [session, deck],
  );

  const next = useCallback(() => {
    if (!session) return;
    const id = session.queue[0];
    const queue = session.queue.slice(1);
    let completed = session.completed;
    if (session.last?.ok) completed++;
    else queue.push(id);
    setSession({ ...session, queue, completed, phase: "ask", last: null, given: "", finished: queue.length === 0 });
  }, [session]);

  const override = useCallback(() => {
    if (!session?.last || !session.lastId) return;
    if (session.last.first && (session.mode === "lesson" || session.mode === "review")) {
      store.restore(session.lastId, session.prev[session.lastId] ?? null);
      store.grade(session.lastId, true);
    }
    setSession({
      ...session,
      last: { ...session.last, ok: true, msg: "" },
      firstOK: session.last.first ? session.firstOK + 1 : session.firstOK,
    });
  }, [session]);

  const undo = useCallback(() => {
    if (!session?.lastId) return;
    if (session.mode === "lesson" || session.mode === "review") store.restore(session.lastId, session.prev[session.lastId] ?? null);
    setSession({ ...session, phase: "ask", last: null, given: "" });
  }, [session]);

  const drop = useCallback(
    (fn: (id: string) => void) => {
      if (!session) return;
      const id = session.queue[0];
      if (session.mode === "lesson" || session.mode === "review") fn(id);
      const queue = session.queue.slice(1);
      setSession({ ...session, queue, phase: "ask", last: null, given: "", finished: queue.length === 0 });
    },
    [session],
  );
  const suspendCurrent = useCallback(() => drop((id) => store.suspend(id)), [drop]);
  const knowCurrent = useCallback(() => drop((id) => store.markKnown(id)), [drop]);
  const resetCurrent = useCallback(() => drop((id) => store.resetItem(id)), [drop]);

  const lessonNext = useCallback(() => {
    if (!session || !deck) return;
    if (session.completed < session.total - 1) {
      setSession({ ...session, completed: session.completed + 1 });
      return;
    }
    const now = Date.now();
    session.queue.forEach((id) => store.setEntry(id, { box: 1, due: now }));
    store.log("new", session.total);
    startReviews(false);
  }, [session, deck, startReviews]);

  return {
    session,
    startLessons,
    startGroup,
    startGroupPractice,
    startReviews,
    startAhead,
    startCheckpoint,
    lessonNext,
    submit,
    next,
    override,
    undo,
    suspendCurrent,
    knowCurrent,
    resetCurrent,
    stop,
    wrapUp,
  };
}
