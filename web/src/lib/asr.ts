// On-device speech recognition via the Web Speech API (issue #84, v1).
// Free and key-less; Chromium/Edge only, usually needs network for the engine.
// We use it as a *speech check* (transcript + word diff), not phoneme scoring.
export interface AsrResult {
  transcript: string;
  confidence: number;
}

export function asrSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function listenOnce(lang = "de-DE"): Promise<AsrResult> {
  return new Promise((resolve, reject) => {
    if (!asrSupported()) {
      reject(new Error("unsupported"));
      return;
    }
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: (e: unknown) => void;
      onerror: (e: unknown) => void;
      onend: () => void;
      start: () => void;
    };
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let settled = false;
    recognition.onresult = (event: unknown) => {
      settled = true;
      const e = event as { results: { 0: { 0: { transcript: string; confidence: number } } } };
      const alt = e.results[0][0];
      resolve({ transcript: alt.transcript ?? "", confidence: alt.confidence ?? 0 });
    };
    recognition.onerror = (event: unknown) => {
      if (!settled) reject(new Error((event as { error?: string }).error ?? "error"));
    };
    recognition.onend = () => {
      if (!settled) resolve({ transcript: "", confidence: 0 });
    };
    try {
      recognition.start();
    } catch (err) {
      reject(err as Error);
    }
  });
}
