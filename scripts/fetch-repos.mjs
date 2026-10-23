// Fetches repository metadata from the GitHub REST API at build time.
// Never fails the build: on any error it falls back to the committed snapshot.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const FALLBACK = new URL('src/data/repos.fallback.json', root);
const GENERATED = new URL('src/data/repos.generated.json', root);
const PROJECTS = new URL('src/content/projects.json', root);

/**
 * @param {{ names: string[], fallback: unknown[], fetchImpl?: typeof fetch, token?: string, owner?: string }} opts
 * @returns {Promise<{ repos: any[], warning?: string }>}
 */
export async function fetchRepos({ names, fallback, fetchImpl = fetch, token, owner = 'ernesto2604' }) {
  const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
  if (token) headers.authorization = `Bearer ${token}`;
  const get = async (path) => {
    const res = await fetchImpl(`https://api.github.com${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`);
    return res.json();
  };

  try {
    const list = await get(`/users/${owner}/repos?per_page=100`);
    const repos = await Promise.all(
      names.map(async (name) => {
        const r = list.find((item) => item.name === name);
        if (!r) throw new Error(`repo ${name} missing from API answer`);
        return {
          name: r.name,
          description: r.description ?? '',
          url: r.html_url,
          homepage: r.homepage ?? '',
          languages: await get(`/repos/${owner}/${name}/languages`),
          topics: r.topics ?? [],
          stars: r.stargazers_count,
          updatedAt: r.pushed_at,
        };
      }),
    );
    return { repos };
  } catch (error) {
    return { repos: fallback, warning: `Using fallback repo data: ${error.message}` };
  }
}

async function main() {
  const projects = JSON.parse(await readFile(PROJECTS, 'utf8'));
  const fallback = JSON.parse(await readFile(FALLBACK, 'utf8').catch(() => '{"repos":[]}')).repos;
  const { repos, warning } = await fetchRepos({
    names: projects.projects.map((p) => p.repo),
    fallback,
    token: process.env.GITHUB_TOKEN,
    owner: projects.owner,
  });
  if (warning) console.warn(`[data] ${warning}`);
  const snapshot = JSON.stringify({ fetchedAt: warning ? null : new Date().toISOString(), repos }, null, 2) + '\n';
  if (warning && process.argv.includes('--refresh-fallback')) {
    console.error('[data] Not refreshing the fallback from the fallback itself.');
    process.exitCode = 1;
    return;
  }
  if (warning) await writeFile(GENERATED, await readFile(FALLBACK, 'utf8'));
  else await writeFile(GENERATED, snapshot);
  if (!warning && process.argv.includes('--refresh-fallback')) await writeFile(FALLBACK, snapshot);
  console.log(`[data] ${repos.length} repos ${warning ? 'from fallback' : 'from GitHub'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
