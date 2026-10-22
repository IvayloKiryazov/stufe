import { useEffect } from "react";
import { Button } from "./ui/button";

const ROWS: [string, string][] = [
  ["?", "Show this shortcut sheet"],
  ["Enter", "Check your answer / go to the next card"],
  ["Backspace", "Undo the last answer (in review feedback)"],
  ["Esc", "Stop the current session"],
  ["ä ö ü ß", "Buttons under the answer field insert a special character"],
];

export function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        aria-label="Keyboard shortcuts"
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold">Keyboard shortcuts</h2>
        <div className="space-y-1">
          {ROWS.map(([k, v]) => (
            <p key={k} className="text-sm">
              <b>{k}</b> — <span className="text-muted">{v}</span>
            </p>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
