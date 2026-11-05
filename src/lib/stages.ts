export const STAGES = ['input', 'generate', 'output'] as const;
export type Stage = (typeof STAGES)[number];
