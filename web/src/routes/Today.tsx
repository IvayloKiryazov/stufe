import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardTitle, Stat } from "../components/ui/card";
import { Onboarding } from "../components/Onboarding";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { dueIds, nextUp } from "../lib/selectors";
import { dayKey, streak } from "../lib/stats";
import { t } from "../lib/i18n";

export default function Today() {
  const { deck, error } = useDeck();
  const progress = useProgress();

  // Review reminder: once per day, if due and permitted.
  useEffect(() => {
    if (!deck || !progress.settings.reminders) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const due = dueIds(deck, progress).length;
    if (due <= 0) return;
    const key = dayKey(Date.now());
    if (localStorage.getItem("stufe-reminded") === key) return;
    try {
      new Notification(t(progress.settings.language, "today.reviewsDue"), {
        body: t(progress.settings.language, "today.reminderBody", { n: due }),
      });
      localStorage.setItem("stufe-reminded", key);
    } catch {
      /* ignore */
    }
  }, [deck, progress]);

  if (error) {
    return (
      <Card>
        <CardTitle>{t(progress.settings.language, "common.loadError")}</CardTitle>
        <p className="text-sm text-muted">{error}</p>
      </Card>
    );
  }
  if (!deck) return <p className="text-muted">{t(progress.settings.language, "common.loading")}</p>;

  const now = Date.now();
  const lang = progress.settings.language;
  const due = dueIds(deck, progress, now).length;
  const next = nextUp(deck, progress);
  const today = progress.history[dayKey(now)] ?? { new: 0, reviews: 0 };
  const st = streak(progress.history, now);
  const goalNew = progress.settings.goalNew || 1;
  const goalReviews = progress.settings.goalReviews || 1;
  const newPct = Math.min(100, Math.round(((today.new ?? 0) / goalNew) * 100));
  const revPct = Math.min(100, Math.round(((today.reviews ?? 0) / goalReviews) * 100));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(lang, "today.title")}</h1>
        <p className="text-muted">{t(lang, "today.subtitle")}</p>
      </header>

      <Onboarding />

      <div className="grid grid-cols-2 gap-3">
        <Stat value={due} label={t(lang, "today.reviewsDue")} />
        <Stat value={st} label={t(lang, "today.streak")} />
      </div>

      <Card>
        <CardTitle>{t(lang, "today.goal")}</CardTitle>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{t(lang, "today.new")}</span>
              <span className="text-muted">
                {today.new ?? 0} / {progress.settings.goalNew}
              </span>
            </div>
            <Progress value={newPct} label={t(lang, "today.newGoal")} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{t(lang, "today.reviews")}</span>
              <span className="text-muted">
                {today.reviews ?? 0} / {progress.settings.goalReviews}
              </span>
            </div>
            <Progress value={revPct} label={t(lang, "today.reviewsGoal")} />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link to="/study">{t(lang, "today.start")}</Link>
        </Button>
      </div>

      {next && (
        <Card>
          <CardTitle>{t(lang, "today.upNext")}</CardTitle>
          <p className="mb-3 text-sm text-muted">{next.group.name}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/study?group=${encodeURIComponent(next.group.id)}&level=${next.levelIdx}`}>
                {t(lang, "today.startGroup")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/browse">{t(lang, "today.browse")}</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
