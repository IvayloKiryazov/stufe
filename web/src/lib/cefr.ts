// CEFR reference material for the levels (issues #72–#74): what a learner can
// do at each level, and which exams the level broadly aligns with.
export const CAN_DO: Record<string, string[]> = {
  a1: [
    "Greet people and introduce yourself",
    "Ask and answer simple questions about everyday life",
    "Understand slow, clearly articulated speech about familiar topics",
  ],
  a2: [
    "Handle short, routine exchanges about familiar matters",
    "Describe your background, immediate environment and needs",
    "Understand short, simple texts and notices",
  ],
  b1: [
    "Deal with most situations that arise while travelling",
    "Describe experiences, events, hopes and give brief reasons",
    "Understand the main points of clear standard speech and texts",
  ],
  b2: [
    "Interact with fluency and spontaneity on many topics",
    "Understand complex texts and technical discussion in your field",
    "Write clear, detailed text and explain a viewpoint",
  ],
  c1: [
    "Express ideas fluently and spontaneously without much searching",
    "Understand demanding, longer texts and implicit meaning",
    "Use language flexibly for social, academic and professional purposes",
  ],
  c2: [
    "Understand with ease virtually everything read or heard",
    "Summarise and reconstruct arguments from complex sources",
    "Express yourself precisely, distinguishing finer shades of meaning",
  ],
};

/** Broad exam alignment (issue #73). */
export const EXAM: Record<string, string> = {
  a1: "Goethe: Start Deutsch 1 · telc Deutsch A1",
  a2: "Goethe-Zertifikat A2 · telc Deutsch A2",
  b1: "Goethe-Zertifikat B1 · telc Deutsch B1",
  b2: "Goethe-Zertifikat B2 · telc Deutsch B2",
  c1: "Goethe-Zertifikat C1 · telc Deutsch C1",
  c2: "Goethe-Zertifikat C2 · telc Deutsch C2",
};

/** The skills the app drills, per level (issue #74). */
export interface Skill {
  key: string;
  label: string;
}

export const SKILLS: Skill[] = [
  { key: "vocab", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
  { key: "cloze", label: "Cloze" },
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];
