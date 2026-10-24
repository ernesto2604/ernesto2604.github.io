export const STAGES = ['input', 'retrieval', 'generate', 'output'] as const;
export type Stage = (typeof STAGES)[number];
