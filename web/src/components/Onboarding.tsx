import { useState } from "react";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
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
  const lang = useProgress().settings.language;
  if (hidden) return null;
  return (
    <Card>
      <CardTitle>{t(lang, "onboarding.title")}</CardTitle>
      <p className="text-base text-muted">{t(lang, "onboarding.body")}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>{t(lang, "onboarding.lesson")}</li>
        <li>{t(lang, "onboarding.stage")}</li>
        <li>{t(lang, "onboarding.reveal")}</li>
        <li>{t(lang, "onboarding.local")}</li>
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
          {t(lang, "onboarding.gotIt")}
        </Button>
      </div>
    </Card>
  );
}
