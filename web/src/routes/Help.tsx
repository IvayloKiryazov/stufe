import { Card, CardTitle } from "../components/ui/card";

const ROWS: [string, string][] = [
  ["Enter", "Check your answer, then go to the next card"],
  ["Backspace", "In review feedback, undo your last answer"],
  ["Esc", "Stop the current session"],
  ["ä ö ü ß", "Buttons under the answer field insert a special character"],
  ["Theme", "Toggle auto / light / dark from the top bar"],
  ["Master (burned)", "At SRS level 12 an item leaves the review queue. Re-drill it from Study → Extra study → Burned."],
  ["Leeches", "Items you keep failing are auto-suspended after 8 lapses; practice them from Study → Extra study → Leeches."],
  ["Extra study", "Leeches / Passed / Burned practice never changes your schedule (like Bunpro ghosts)."],
];

export default function Help() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Help</h1>
        <p className="text-muted">Small things that make reviewing faster.</p>
      </header>
      <Card>
        <CardTitle>Keyboard &amp; tips</CardTitle>
        <div className="space-y-1">
          {ROWS.map(([k, v]) => (
            <p key={k} className="text-sm">
              <b>{k}</b> — <span className="text-muted">{v}</span>
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
