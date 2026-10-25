import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useProgress } from "../hooks/useProgress";
import { backupSupported, chooseBackupFile } from "../lib/backup";
import { DECKS, store } from "../lib/store";
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
      setMsg(t(s.language, "settings.restored"));
    } catch {
      setMsg(t(s.language, "settings.invalid"));
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(s.language, "settings.title")}</h1>
        <p className="text-muted">{t(s.language, "settings.subtitle")}</p>
      </header>

      <Card>
        <CardTitle>{t(s.language, "settings.appearance")}</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "settings.theme")}</span>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger className="w-40" aria-label={t(s.language, "settings.themeAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t(s.language, "settings.auto")}</SelectItem>
                <SelectItem value="light">{t(s.language, "settings.light")}</SelectItem>
                <SelectItem value="dark">{t(s.language, "settings.dark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "settings.textSize")}</span>
            <Select value={String(s.fontScale)} onValueChange={(v) => store.setSettings({ fontScale: Number(v) })}>
              <SelectTrigger className="w-40" aria-label={t(s.language, "settings.textSizeAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.9">{t(s.language, "settings.small")}</SelectItem>
                <SelectItem value="1">{t(s.language, "settings.normal")}</SelectItem>
                <SelectItem value="1.15">{t(s.language, "settings.large")}</SelectItem>
                <SelectItem value="1.3">{t(s.language, "settings.extraLarge")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "common.language")}</span>
            <Select value={s.language} onValueChange={(v) => store.setSettings({ language: v as "en" | "de" })}>
              <SelectTrigger className="w-40" aria-label={t(s.language, "settings.languageAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t(s.language, "settings.english")}</SelectItem>
                <SelectItem value="de">{t(s.language, "settings.deutsch")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>{t(s.language, "settings.study")}</CardTitle>
        <div className="space-y-3">
          <NumberRow label={t(s.language, "settings.newPerLesson")} value={s.newPerLesson} min={3} max={20} onChange={(n) => store.setSettings({ newPerLesson: n })} />
          <NumberRow label={t(s.language, "settings.dailyNew")} value={s.goalNew} min={0} max={200} onChange={(n) => store.setSettings({ goalNew: n })} />
          <NumberRow label={t(s.language, "settings.dailyReview")} value={s.goalReviews} min={0} max={1000} onChange={(n) => store.setSettings({ goalReviews: n })} />
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "settings.unlockAll")}</span>
            <input
              type="checkbox"
              checked={s.unlockAll}
              onChange={(e) => store.setSettings({ unlockAll: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "settings.audio")}</span>
            <input type="checkbox" checked={s.voice} onChange={(e) => store.setSettings({ voice: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "settings.vacation")}</span>
            <input
              type="checkbox"
              checked={s.vacation}
              onChange={(e) => store.setSettings({ vacation: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t(s.language, "settings.reminders")}</span>
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
        <CardTitle>{t(s.language, "settings.decks")}</CardTitle>
        <p className="mb-3 text-sm text-muted">{t(s.language, "settings.decksHint")}</p>
        <div className="space-y-3">
          {DECKS.map((deck) => (
            <div key={deck} className="space-y-1 border-b border-line pb-2 last:border-0">
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>{t(s.language, `deck.${deck}`)}</span>
                <input
                  type="checkbox"
                  checked={s.decks[deck].enabled}
                  onChange={(e) => store.setDeck(deck, { enabled: e.target.checked })}
                />
              </label>
              <NumberRow
                label={t(s.language, "settings.newPerDay")}
                value={s.decks[deck].newPerDay}
                min={0}
                max={200}
                onChange={(n) => store.setDeck(deck, { newPerDay: n })}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>{t(s.language, "settings.progress")}</CardTitle>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={download}>
              {t(s.language, "settings.download")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(store.export()).then(
                  () => setMsg(t(s.language, "settings.copied")),
                  () => setMsg(t(s.language, "settings.copyFailed")),
                );
              }}
            >
              {t(s.language, "settings.copy")}
            </Button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t(s.language, "settings.paste")}
            className="min-h-24 w-full rounded-md border border-line bg-bg p-3 font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={restore} disabled={!importText.trim()}>
              {t(s.language, "settings.restore")}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setMsg(t(s.language, "settings.resetConfirm"));
                } else {
                  store.reset();
                  setConfirmReset(false);
                  setMsg(t(s.language, "settings.resetDone"));
                }
              }}
            >
              {t(s.language, "settings.resetAll")}
            </Button>
          </div>
          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>{t(s.language, "settings.backupFile")}</CardTitle>
        {backupSupported() ? (
          <>
            <p className="text-sm text-muted">{t(s.language, "settings.backupHint")}</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={async () => {
                const ok = await chooseBackupFile();
                setMsg(t(s.language, ok ? "settings.backupLinked" : "settings.backupUnchanged"));
              }}
            >
              {t(s.language, "settings.keepBackup")}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted">{t(s.language, "settings.backupUnsupported")}</p>
        )}
      </Card>

      <Card>
        <CardTitle>{t(s.language, "settings.more")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/help">{t(s.language, "settings.help")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/credits">{t(s.language, "settings.credits")}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
