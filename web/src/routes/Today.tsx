import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardTitle, Stat } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { dueIds, newAvailableCount } from "../lib/selectors";
import { dayKey, streak } from "../lib/stats";

export default function Today() {
  const { deck, error } = useDeck();
  const progress = useProgress();

  if (error) {
    return (
      <Card>
        <CardTitle>Could not load data</CardTitle>
        <p className="text-sm text-muted">{error}</p>
      </Card>
    );
  }
  if (!deck) return <p className="text-muted">Loading…</p>;

  const now = Date.now();
  const due = dueIds(deck, progress, now).length;
  const fresh = newAvailableCount(deck, progress);
  const today = progress.history[dayKey(now)] ?? { new: 0, reviews: 0 };
  const st = streak(progress.history, now);
  const goalNew = progress.settings.goalNew || 1;
  const goalReviews = progress.settings.goalReviews || 1;
  const newPct = Math.min(100, Math.round(((today.new ?? 0) / goalNew) * 100));
  const revPct = Math.min(100, Math.round(((today.reviews ?? 0) / goalReviews) * 100));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Today</h1>
        <p className="text-muted">Your daily session.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat value={due} label="reviews due" />
        <Stat value={st} label="day streak" />
      </div>

      <Card>
        <CardTitle>Daily goal</CardTitle>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>New items</span>
              <span className="text-muted">
                {today.new ?? 0} / {progress.settings.goalNew}
              </span>
            </div>
            <Progress value={newPct} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Reviews</span>
              <span className="text-muted">
                {today.reviews ?? 0} / {progress.settings.goalReviews}
              </span>
            </div>
            <Progress value={revPct} />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link to="/study">Start session</Link>
        </Button>
        <span className="text-sm text-muted">{fresh.toLocaleString()} new items available</span>
      </div>
    </div>
  );
}
