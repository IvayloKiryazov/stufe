import { useMemo, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useDeck } from "../hooks/useDeck";
import { useProgress } from "../hooks/useProgress";
import { asrSupported, listenOnce } from "../lib/asr";
import { tokenSimilarity, wordDiff } from "../lib/grade";
import { t } from "../lib/i18n";
import { shuffle } from "../lib/shuffle";
import { store } from "../lib/store";
import { speak } from "../lib/tts";

export default function Speaking() {
  const { deck } = useDeck();
  const lang = useProgress().settings.language;
  const [i, setI] = useState(0);
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [heard, setHeard] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);

  const sentences = useMemo(
    () => (deck ? shuffle(Object.keys(deck.by).filter((id) => deck.by[id].sentence_de)).slice(0, 10) : []),
    [deck],
  );

  if (!deck) return <p className="text-muted">{t(lang, "common.loading")}</p>;
  if (!sentences.length) return <p className="text-muted">{t(lang, "practice.noSentences")}</p>;

  const item = deck.by[sentences[i]];
  const target = item.sentence_de ?? "";

  const start = async () => {
    setMsg("");
    setUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        setUrl(URL.createObjectURL(new Blob(chunks, { type: "audio/webm" })));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setMsg(t(lang, "practice.micUnavailable"));
    }
  };
  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const speechCheck = async () => {
    setMsg("");
    setHeard("");
    try {
      const { transcript } = await listenOnce();
      if (transcript) {
        setHeard(transcript);
        store.logPractice("speaking", tokenSimilarity(transcript, target) >= 0.8, item.level);
      } else setMsg(t(lang, "practice.didNotCatch"));
    } catch {
      setMsg(t(lang, "practice.asrUnavailable"));
    }
  };
  const diff = heard ? wordDiff(heard, target) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <h1 className="text-sm font-normal">{t(lang, "practice.speaking")}</h1>
        <Progress className="flex-1" value={(i / sentences.length) * 100} label={t(lang, "common.sessionProgress")} />
        <span>
          {i + 1}/{sentences.length}
        </span>
      </div>
      <Card>
        <p className="mb-2 text-sm text-muted">{t(lang, "practice.speakingInstruction")}</p>
        <p className="font-serif text-xl" lang="de">
          {target}
        </p>
        <p className="text-sm text-muted">{item.sentence_en}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => speak(target)}>
            <Volume2 className="h-4 w-4" /> {t(lang, "practice.model")}
          </Button>
          {recording ? (
            <Button variant="outline" onClick={stop}>
              <Square className="h-4 w-4" /> {t(lang, "common.stop")}
            </Button>
          ) : (
            <Button variant="outline" onClick={start}>
              <Mic className="h-4 w-4" /> {t(lang, "practice.record")}
            </Button>
          )}
          {asrSupported() && (
            <Button variant="outline" onClick={speechCheck}>
              <Mic className="h-4 w-4" /> {t(lang, "practice.speechCheck")}
            </Button>
          )}
        </div>
        {url && (
          <audio className="mt-3 w-full" src={url} controls aria-label={t(lang, "practice.recording")} />
        )}
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
        {heard && diff && (
          <div className="mt-3 space-y-1 border-t border-line pt-3">
            <p className="text-sm">
              <b>{t(lang, "practice.heard")}</b> <span lang="de">{heard}</span>
            </p>
            <p className="text-sm text-muted">
              {t(lang, "practice.matchTarget", { pct: Math.round(tokenSimilarity(heard, target) * 100) })}
            </p>
            {diff.missing.length > 0 && (
              <p className="text-sm">
                <b>{t(lang, "practice.missing")}</b> <span lang="de">{diff.missing.join(", ")}</span>
              </p>
            )}
            {diff.extra.length > 0 && (
              <p className="text-sm text-bad">
                {t(lang, "practice.extra")} <span lang="de">{diff.extra.join(", ")}</span>
              </p>
            )}
            {diff.missing.length === 0 && diff.extra.length === 0 && (
              <p className="text-sm text-good">{t(lang, "practice.spotOn")}</p>
            )}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => {
              setI((n) => n + 1);
              setUrl(null);
              setMsg("");
              setHeard("");
            }}
          >
            {t(lang, "practice.saidIt")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setUrl(null);
              setMsg("");
              setHeard("");
            }}
          >
            {t(lang, "practice.again")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
