import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardTitle } from "./ui/card";

const KEY = "stufe-onboarded";

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

/** First-run explanation, dismissed once (issue #95). */
export function Onboarding() {
  const [hidden, setHidden] = useState(seen);
  if (hidden) return null;
  return (
    <Card>
      <CardTitle>Welcome to Stufe</CardTitle>
      <p className="text-base text-muted">
        Spaced repetition for German — vocabulary and grammar as parallel SRS queues.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Learn new items in <b>lessons</b>, then keep them alive in <b>reviews</b>.</li>
        <li>
          A correct answer moves an item up one SRS level (Beginner → Adept → Seasoned → Expert →
          Master); a wrong answer drops it one. Items that reach <b>Master</b> leave the queue.
        </li>
        <li>Reveal cards show the meaning, IPA, conjugation and example sentences.</li>
        <li>Everything is stored on your device — no account needed.</li>
      </ul>
      <div className="mt-4">
        <Button
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setHidden(true);
          }}
        >
          Got it
        </Button>
      </div>
    </Card>
  );
}
