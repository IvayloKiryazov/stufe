export interface Stage {
  min: number;
  max: number;
  name: string;
}

/** Bunpro's SRS level names (SRS 1–12). Box 0 = not yet learned. */
export const STAGES: Stage[] = [
  { min: 1, max: 3, name: "Beginner" },
  { min: 4, max: 6, name: "Adept" },
  { min: 7, max: 9, name: "Seasoned" },
  { min: 10, max: 11, name: "Expert" },
  { min: 12, max: 12, name: "Master" },
];

export function stageName(box: number): string {
  const b = Math.max(0, Math.min(12, Math.trunc(box)));
  if (b === 0) return "New";
  return STAGES.find((s) => b >= s.min && b <= s.max)?.name ?? STAGES[0].name;
}
