import { useEffect } from "react";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import { Button } from "./ui/button";

const ROWS: [string, string][] = [
  ["?", "shortcuts.help"],
  ["Enter", "shortcuts.enter"],
  ["Backspace", "shortcuts.backspace"],
  ["Esc", "shortcuts.esc"],
  ["ä ö ü ß", "shortcuts.umlauts"],
];

export function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useProgress().settings.language;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, "common.shortcuts")}
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold">{t(lang, "shortcuts.title")}</h2>
        <div className="space-y-1">
          {ROWS.map(([k, key]) => (
            <p key={k} className="text-sm">
              <b>{k}</b> — <span className="text-muted">{t(lang, key)}</span>
            </p>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={onClose}>{t(lang, "common.close")}</Button>
        </div>
      </div>
    </div>
  );
}
