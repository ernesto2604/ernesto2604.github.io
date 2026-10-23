import data from './repos.generated.json';
import projectsFile from '../content/projects.json';

export type Repo = {
  name: string;
  description: string;
  url: string;
  homepage: string;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  updatedAt: string;
};

export type Project = (typeof projectsFile.projects)[number] & { data: Repo };

export const fetchedAt: string | null = data.fetchedAt;

// Joins curated project facts with build-time GitHub metadata, in projects.json order.
export const projects: Project[] = projectsFile.projects.map((p) => {
  const repo = (data.repos as unknown as Repo[]).find((r) => r.name === p.repo);
  if (!repo) throw new Error(`No GitHub data for ${p.repo}; run npm run data`);
  return { ...p, data: repo };
});
