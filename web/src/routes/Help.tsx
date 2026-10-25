import { Card, CardTitle } from "../components/ui/card";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";

const ROWS: [string, string][] = [
  ["Enter", "help.row.enter"],
  ["Backspace", "help.row.backspace"],
  ["Esc", "help.row.esc"],
  ["ä ö ü ß", "help.row.umlauts"],
  ["Theme", "help.row.theme"],
  ["Master (burned)", "help.row.master"],
  ["Leeches", "help.row.leeches"],
  ["Extra study", "help.row.extra"],
];

export default function Help() {
  const lang = useProgress().settings.language;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(lang, "nav.help")}</h1>
        <p className="text-muted">{t(lang, "help.subtitle")}</p>
      </header>
      <Card>
        <CardTitle>{t(lang, "help.tips")}</CardTitle>
        <div className="space-y-1">
          {ROWS.map(([k, key]) => (
            <p key={k} className="text-sm">
              <b>{k}</b> — <span className="text-muted">{t(lang, key)}</span>
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
