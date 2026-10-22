import { useState } from "react";
import { Link } from "react-router-dom";
import { Art } from "../components/Art";
import { useDeck } from "../hooks/useDeck";
import type { Item } from "../lib/data";
import { searchItems } from "../lib/search";

function Result({ it, levelIdx }: { it: Item; levelIdx: number }) {
  return (
    <Link
      to={`/study?mode=practice&group=${encodeURIComponent(it.group)}&level=${levelIdx}`}
      className="block rounded-lg border border-line bg-surface p-3 text-sm hover:bg-soft"
    >
      <div className="font-serif text-lg" lang="de">
        {it.kind === "cloze" ? (
          <>
            {it.groupName}: {it.prompt}
          </>
        ) : (
          <Art text={it.de ?? ""} />
        )}
      </div>
      {it.en && <div className="text-muted">{it.en}</div>}
      <div className="text-xs text-muted">
        {it.groupName} · {it.level.toUpperCase()}
      </div>
    </Link>
  );
}

export default function Search() {
  const { deck } = useDeck();
  const [q, setQ] = useState("");

  if (!deck) return <p className="text-muted">Loading…</p>;
  const results = searchItems(Object.values(deck.by), q);
  const idxOf = (level: string) => deck.levels.findIndex((l) => l.id === level);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted">Find words (German or English) and grammar points.</p>
      </header>
      <label className="block">
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type at least two letters…"
          aria-label="Search"
          className="w-full rounded-md border-2 border-line bg-bg px-3 py-2 text-lg"
        />
      </label>
      {q.trim().length >= 2 && (
        <p className="text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"}
        </p>
      )}
      <ul className="space-y-2">
        {results.map((it) => (
          <li key={it.id}>
            <Result it={it} levelIdx={idxOf(it.level)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
