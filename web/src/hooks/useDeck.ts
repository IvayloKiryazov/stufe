import { useEffect, useState } from "react";
import { loadDeck, subscribeDeck, type Deck } from "../lib/data";

/**
 * Loads the deck. `levels` and `reading` are available immediately; `by` grows
 * as per-level item files stream in, and the hook re-renders on each arrival.
 */
export function useDeck() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadDeck()
      .then((d) => alive && setDeck(d))
      .catch((e) => alive && setError(String(e)));
    const unsubscribe = subscribeDeck(() => {
      if (alive) setDeck((d) => (d ? { ...d } : d));
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return { deck, error };
}
