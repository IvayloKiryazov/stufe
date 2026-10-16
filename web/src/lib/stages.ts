export interface Stage {
  min: number;
  max: number;
  name: string;
}

export const STAGES: Stage[] = [
  { min: 0, max: 1, name: "Apprentice" },
  { min: 2, max: 3, name: "Guru" },
  { min: 4, max: 4, name: "Master" },
  { min: 5, max: 6, name: "Enlightened" },
  { min: 7, max: 7, name: "Burned" },
];

export function stageName(box: number): string {
  const b = Math.max(0, Math.min(7, Math.trunc(box)));
  return STAGES.find((s) => b >= s.min && b <= s.max)?.name ?? STAGES[0].name;
}
