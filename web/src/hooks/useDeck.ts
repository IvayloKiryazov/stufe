import { useEffect, useState } from "react";
import { loadDeck, type Deck } from "../lib/data";

export function useDeck() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadDeck()
      .then((d) => alive && setDeck(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);
  return { deck, error };
}
