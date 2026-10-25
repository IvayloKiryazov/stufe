import { Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { useProgress } from "../hooks/useProgress";
import { t } from "../lib/i18n";
import { speak } from "../lib/tts";

// grapheme, example word, hint
const SOUNDS: [string, string, string][] = [
  ["a", "Vater", "long 'ah'"],
  ["a", "Mann", "short 'a'"],
  ["e", "Tee", "long 'ay'"],
  ["e", "Bett", "short 'e'"],
  ["i", "Kino", "long 'ee'"],
  ["i", "mit", "short 'i'"],
  ["o", "Boot", "long 'oh'"],
  ["o", "Sonne", "short 'o'"],
  ["u", "Uhr", "long 'oo'"],
  ["u", "und", "short 'u'"],
  ["ä", "Bär", "like 'e' in bed"],
  ["ö", "schön", "rounded 'er' without r"],
  ["ü", "Tür", "rounded 'ee'"],
  ["ei", "Eis", "like 'eye'"],
  ["ie", "Liebe", "long 'ee'"],
  ["eu / äu", "neu", "like 'oy'"],
  ["au", "Haus", "like 'ow'"],
  ["ch", "Buch", "harsh after a/o/u"],
  ["ch", "ich", "soft after e/i"],
  ["sch", "Schule", "like 'sh'"],
  ["sp", "Sport", "s + p at word start ('shp')"],
  ["st", "Stadt", "s + t at word start ('sht')"],
  ["r", "rot", "guttural r"],
  ["z", "Zeit", "like 'ts'"],
  ["v", "Vater", "like 'f'"],
  ["w", "Wasser", "like 'v'"],
  ["s", "sagen", "like 'z' before a vowel"],
  ["ß", "Straße", "sharp 's'"],
  ["qu", "Quelle", "like 'kv'"],
  ["j", "Jahr", "like 'y'"],
  ["h", "Haus", "breathed at start, silent after a vowel"],
];

export default function Pronunciation() {
  const lang = useProgress().settings.language;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t(lang, "practice.pronunciation")}</h1>
        <p className="text-muted">{t(lang, "practice.pronunciationHint")}</p>
      </header>
      <Card>
        <CardTitle>{t(lang, "practice.sounds")}</CardTitle>
        <div className="grid gap-1 sm:grid-cols-2">
          {SOUNDS.map(([g, word, hint], i) => (
            <div key={i} className="flex items-center justify-between gap-2 border-b border-line py-2">
              <div>
                <span className="font-serif text-lg font-bold" lang="de">
                  {g}
                </span>
                <span className="ml-3 text-sm" lang="de">
                  {word}
                </span>
                <span className="ml-2 text-xs text-muted">{hint}</span>
              </div>
              <Button variant="ghost" size="icon" aria-label={t(lang, "common.playWord", { word })} onClick={() => speak(word)}>
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
