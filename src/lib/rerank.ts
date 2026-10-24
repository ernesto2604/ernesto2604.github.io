type Rankable = { slug: string; rank: number | null; data: { updatedAt: string } };

// The site's rerank rule: the author's featured projects by rank, then the rest by most recent push.
export function rerank<T extends Rankable>(items: T[]): T[] {
  const featured = items.filter((x) => x.rank !== null).sort((a, b) => a.rank! - b.rank!);
  const rest = items.filter((x) => x.rank === null).sort((a, b) => b.data.updatedAt.localeCompare(a.data.updatedAt));
  return [...featured, ...rest];
}
