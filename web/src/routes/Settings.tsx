import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useProgress } from "../hooks/useProgress";
import { store } from "../lib/store";
import { useTheme, type Theme } from "../lib/theme";
import { t } from "../lib/i18n";

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="w-24 rounded-md border border-line bg-surface px-3 py-1.5"
      />
    </label>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const progress = useProgress();
  const s = progress.settings;
  const [importText, setImportText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState("");

  const download = () => {
    const blob = new Blob([store.export()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stufe-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const restore = () => {
    try {
      store.import(importText);
      setMsg("Restored.");
    } catch {
      setMsg("That does not look like a valid backup.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(s.language, "settings.title")}</h1>
        <p className="text-muted">{t(s.language, "settings.subtitle")}</p>
      </header>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>Theme</span>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger className="w-40" aria-label="Theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>Text size</span>
            <Select value={String(s.fontScale)} onValueChange={(v) => store.setSettings({ fontScale: Number(v) })}>
              <SelectTrigger className="w-40" aria-label="Text size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.9">Small</SelectItem>
                <SelectItem value="1">Normal</SelectItem>
                <SelectItem value="1.15">Large</SelectItem>
                <SelectItem value="1.3">Extra large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "common.language")}</span>
            <Select value={s.language} onValueChange={(v) => store.setSettings({ language: v as "en" | "de" })}>
              <SelectTrigger className="w-40" aria-label="Interface language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Study</CardTitle>
        <div className="space-y-3">
          <NumberRow label="New items per lesson" value={s.newPerLesson} min={3} max={20} onChange={(n) => store.setSettings({ newPerLesson: n })} />
          <NumberRow label="Daily new goal" value={s.goalNew} min={0} max={200} onChange={(n) => store.setSettings({ goalNew: n })} />
          <NumberRow label="Daily review goal" value={s.goalReviews} min={0} max={1000} onChange={(n) => store.setSettings({ goalReviews: n })} />
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Unlock all levels</span>
            <input
              type="checkbox"
              checked={s.unlockAll}
              onChange={(e) => store.setSettings({ unlockAll: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Audio (browser German voices)</span>
            <input type="checkbox" checked={s.voice} onChange={(e) => store.setSettings({ voice: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Vacation mode (pause new lessons)</span>
            <input
              type="checkbox"
              checked={s.vacation}
              onChange={(e) => store.setSettings({ vacation: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Review reminders</span>
            <input
              type="checkbox"
              checked={s.reminders}
              onChange={(e) => {
                const on = e.target.checked;
                store.setSettings({ reminders: on });
                if (on && "Notification" in window && Notification.permission === "default") {
                  void Notification.requestPermission().catch(() => {
                    /* leave the setting enabled; the reminder simply won't fire */
                  });
                }
              }}
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardTitle>Progress</CardTitle>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={download}>
              Download backup
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(store.export()).then(
                  () => setMsg("Copied to clipboard."),
                  () => setMsg("Copy failed."),
                );
              }}
            >
              Copy backup
            </Button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste a backup here to restore"
            className="min-h-24 w-full rounded-md border border-line bg-bg p-3 font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={restore} disabled={!importText.trim()}>
              Restore
            </Button>
            <Button
              variant="link"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setMsg("Click again to erase all progress.");
                } else {
                  store.reset();
                  setConfirmReset(false);
                  setMsg("Progress reset.");
                }
              }}
            >
              Reset all progress
            </Button>
          </div>
          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>More</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/help">Help</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/credits">Credits &amp; licenses</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
