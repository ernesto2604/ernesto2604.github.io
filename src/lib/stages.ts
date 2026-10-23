export const STAGES = ['input', 'retrieval', 'rerank', 'generate', 'output'] as const;
export type Stage = (typeof STAGES)[number];
