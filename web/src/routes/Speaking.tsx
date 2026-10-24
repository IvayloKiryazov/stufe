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

  if (!deck) return <p className="text-muted">Loading…</p>;
  if (!sentences.length) return <p className="text-muted">No sentences available.</p>;

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
      setMsg("Microphone unavailable in this browser.");
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
      if (transcript) setHeard(transcript);
      else setMsg("I didn't catch that — try again.");
    } catch {
      setMsg("Speech recognition isn't available in this browser.");
    }
  };
  const diff = heard ? wordDiff(heard, target) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <h1 className="text-sm font-normal">{t(lang, "practice.speaking")}</h1>
        <Progress className="flex-1" value={(i / sentences.length) * 100} label="Session progress" />
        <span>
          {i + 1}/{sentences.length}
        </span>
      </div>
      <Card>
        <p className="mb-2 text-sm text-muted">Say this out loud, then compare with the model.</p>
        <p className="font-serif text-xl" lang="de">
          {target}
        </p>
        <p className="text-sm text-muted">{item.sentence_en}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => speak(target)}>
            <Volume2 className="h-4 w-4" /> Model
          </Button>
          {recording ? (
            <Button variant="outline" onClick={stop}>
              <Square className="h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button variant="outline" onClick={start}>
              <Mic className="h-4 w-4" /> Record
            </Button>
          )}
          {asrSupported() && (
            <Button variant="outline" onClick={speechCheck}>
              <Mic className="h-4 w-4" /> Speech check
            </Button>
          )}
        </div>
        {url && (
          <audio className="mt-3 w-full" src={url} controls aria-label="Your recording" />
        )}
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
        {heard && diff && (
          <div className="mt-3 space-y-1 border-t border-line pt-3">
            <p className="text-sm">
              <b>I heard:</b> <span lang="de">{heard}</span>
            </p>
            <p className="text-sm text-muted">
              {Math.round(tokenSimilarity(heard, target) * 100)}% match to the model.
            </p>
            {diff.missing.length > 0 && (
              <p className="text-sm">
                <b>Missing:</b> <span lang="de">{diff.missing.join(", ")}</span>
              </p>
            )}
            {diff.extra.length > 0 && (
              <p className="text-sm text-bad">
                Extra: <span lang="de">{diff.extra.join(", ")}</span>
              </p>
            )}
            {diff.missing.length === 0 && diff.extra.length === 0 && (
              <p className="text-sm text-good">Spot on.</p>
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
            I said it
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setUrl(null);
              setMsg("");
              setHeard("");
            }}
          >
            Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
