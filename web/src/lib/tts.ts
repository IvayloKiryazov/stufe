import type { Item } from "./data";
import { speechText } from "./judge";

let voice: SpeechSynthesisVoice | null = null;

function pick() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const vs = window.speechSynthesis.getVoices() || [];
  voice = vs.find((v) => /^de[-_]DE/i.test(v.lang)) ?? vs.find((v) => /^de/i.test(v.lang)) ?? null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pick();
  window.speechSynthesis.onvoiceschanged = pick;
}

export function speak(text: string, opts: { rate?: number; enabled?: boolean } = {}) {
  if (!text || opts.enabled === false) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

let audio: HTMLAudioElement | null = null;

/** Play a native recording (issue #97). Best-effort; ignores autoplay blocks. */
export function playAudio(url: string) {
  if (typeof window === "undefined") return;
  try {
    if (audio) audio.pause();
    audio = new Audio(url);
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Prefer the item's native recording; fall back to browser TTS. */
export function speakItem(item: Item, opts: { rate?: number; enabled?: boolean } = {}) {
  if (opts.enabled === false) return;
  if (item.audio) {
    playAudio(item.audio);
    return;
  }
  speak(speechText(item), opts);
}
