# ernesto2604.github.io

Personal portfolio of Ernesto Contreras, AI Engineer and Forward Deployed Engineer.

The page is built as the AI pipeline it describes. Scrolling moves a question through four stages: **Input**, **Retrieval**, **Generate** and **Output**. A scripted agent (Ctrl/Cmd + K) answers questions about the projects. It shows the lookups it really makes in local data and then streams a pre-written answer. It runs entirely in the browser: no LLM, no backend, no tracking.

- English at `/`, Spanish at `/es/`. Both pages are prerendered to static HTML.
- Hosted on GitHub Pages and built by GitHub Actions.
- Stack: Vite 8, React 19, TypeScript 6, Tailwind CSS 4, Lenis, Lucide, Vitest, Playwright with axe-core, and Lighthouse.

## Run locally

Requirements: Node.js 22 or later, and npm.

```bash
npm install
npx playwright install chromium   # only needed for e2e tests and OG image generation
npm run dev                       # http://localhost:5173 (fetches repo data first)
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Fetches repo data, type-checks, builds the client and the SSR bundle, then prerenders `dist/` (both locales, `404.html`, `sitemap.xml`). |
| `npm run preview` | Serves `dist/` at http://localhost:4173. |
| `npm test` | Runs the unit tests (Vitest): search scorer, agent matcher, i18n key parity, contrast tokens, SEO head, diagram labels. |
| `npm run test:e2e` | Runs the Playwright tests against `npm run preview`: navigation, no-JS, agent keyboard flow and axe accessibility. Build first. |
| `npm run data:refresh` | Refreshes the committed fallback `src/data/repos.fallback.json` from the GitHub API. |
| `npm run og` | Regenerates `public/og-*.png` and the PNG icons with Playwright's Chromium. |
| `node scripts/screenshots.mjs <dir> <w>x<h> <path> <scrollY or #hash>...` | Takes screenshots of the preview build (dev aid). |

## Project layout

```
src/
  content/           all copy and editable data
    en.json, es.json   UI strings and case-study text (same keys, enforced by a test)
    projects.json      locale-independent project facts (repo, rank, stack, search tags, links)
    profile.json       name, contact, CV paths, photo
    agent/kb.json      the agent's bilingual knowledge base
  sections/          Story (stages 1-3, pinned), Generate (case studies), Output (about and contact)
  components/        Nav, PipelineIndicator, Diagram (+ diagrams.ts layouts), Footer, ...
  agent/             match.ts (intent matcher), tools.ts (tool calls), AgentPanel, AgentHost
  lib/search.ts      BM25 scorer with typo tolerance, shared by Retrieval and the agent
  i18n/              tiny typed t() and provider (no i18n library)
scripts/             fetch-repos, prerender, og, screenshots
tests/unit, tests/e2e
```

## Edit content

All visible text lives in `src/content/en.json` and `src/content/es.json`. Components never contain copy. When you add a key to one file, add it to the other: `npm test` fails if the key sets, the `{placeholders}` or any empty values differ.

- **Hero, about, skills, experience:** `hero.*` and `output.*`.
- **Case studies:** `cases.<slug>.*` holds the problem, approach, decisions, limitations, next steps, diagram labels and the text alternative of each diagram.
- **Contact:** edit `src/content/profile.json`.
  - The phone number is stored as parts and joined in the browser, so it is not in the static HTML.
  - **CV:** put the PDFs in `public/cv/` and set `"cv": { "en": "/cv/ernesto-contreras-cv-en.pdf", "es": "/cv/..." }`. The download link appears only for locales with a path.
  - **Photo:** `photo` is the base path of the generated set (`/photo/ernesto`). Put the original in `assets-src/` (git-ignored) and run `python scripts/photo.py` (needs Pillow with AVIF); it writes AVIF/WebP at 400/640/960 px without metadata.

## Add a project

1. Add an entry to `src/content/projects.json` with these fields:
   - `slug`, and `repo` (the GitHub repository name).
   - `rank`: a number makes it featured, `null` puts it under "Also built".
   - `stack` and `tags`. The tags are the search terms the Retrieval stage scores against, in English and in Spanish without accents.
   - `links.video`: optional.
2. Add `projects.<slug>.{name, summary, fact}` to both locale files.
3. For a featured project, also do the following:
   - Add `cases.<slug>` to both locale files. Copy the shape of an existing case.
   - Add a layout to `src/components/diagrams.ts`. The viewBox is 720 × 420; each node has an `s` reveal step, and each edge draws after its source node.
   - Run `npm test`: it checks that every diagram label fits in two lines in both languages.
4. Run `npm run data:refresh` so the fallback snapshot includes the new repository.

## Edit the agent's knowledge base

`src/content/agent/kb.json` holds one entry per intent:

```json
{
  "id": "ring",
  "project": "ring-telemetryops",
  "triggers": ["ring", "doorbell", "timbre", "telemetría"],
  "tools": ["search_projects", "read_repo", "show_architecture"],
  "answer": { "en": "...", "es": "..." },
  "actions": [{ "type": "scrollTo", "target": "#ring-telemetryops" }]
}
```

- **`triggers`:** words or short phrases in either language. Matching ignores case and accents and tolerates typos (prefix match, or an edit distance of 1 to 2 on longer words).
- **`weight` (optional):** lowers a generic intent so specific intents win when both match. `projects` uses 0.6.
- **`searchQuery` (optional):** what `search_projects` looks up when the user's words are too generic.
- **`tools`:** which simulated tool calls to show:
  - `search_projects`
  - `read_repo` and `show_architecture`: these need `project`.
  - `get_profile`
  - `get_contact`
- **`actions`:** buttons shown under the answer:
  - `scrollTo` and `highlight`, which take a CSS id.
  - `switchLocale`, which takes `en` or `es`.
  - Button labels live in `agent.targets.*` in the locale files.
- **`suggestions` and `fallback`:** what the agent offers when nothing scores above `MIN_SCORE` in `src/agent/match.ts`.

After you edit the knowledge base, add a test query to `tests/unit/agent.test.ts` and run `npm test`.

## Change language strings

Edit both `src/content/en.json` and `src/content/es.json`. The client downloads only the active locale; the server prerender uses both. SEO tags are built from `meta.*` in `src/seo/head.ts`.

The language toggle is a real link to the other page and keeps the current `#hash`. It stores the choice in `localStorage`. A small inline script on `/` sends a returning visitor to `/es/` only if they chose Spanish before; nothing is detected from IP or browser language.

## Deploy to Cloudflare Pages

Cloudflare Pages builds and deploys from Git on every push to `main`; other branches get preview URLs.

1. In the Cloudflare dashboard, open **Workers & Pages → Create → Pages → Connect to Git** and pick this repository.
2. Name the project `ernesto-portfolio` so it is served at https://ernesto-portfolio.pages.dev/. A different name or a custom domain means changing `siteUrl` in `src/content/profile.json`, `public/robots.txt`, `public/llms.txt` and `tests/unit/head.test.ts`, then running `npm run og`.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Node version comes from `.node-version` (22).
4. Optional: add a `GITHUB_TOKEN` environment variable (a read-only token) to raise the GitHub API rate limit.

The build asks the GitHub API for repository metadata. If that fails, it falls back to the committed snapshot, so the build never breaks on rate limits.

Unknown paths are served `dist/404.html` by Cloudflare Pages. That file is a static, bilingual, `noindex` page. `public/_headers` marks the hashed files in `/assets/` as immutable.

`.github/workflows/ci.yml` runs the unit tests and the build on pushes and pull requests; it does not deploy.

## Design notes

- **Pinned story.** Stages 1 to 3 form a sticky scene driven by native scroll on screens of at least 1024 × 740 px.
  - Without motion preference, or on smaller screens, the same DOM stacks as normal sections.
  - `html[data-pinned]` is set before first paint in `public/boot.js`.
- **Glass.** Only the nav, the pipeline indicator and the agent dialog use glass. They become solid with `prefers-reduced-transparency` and on low-memory devices.
- **Fonts.** Inter (wght + opsz) and Geist Mono (OFL-1.1), latin subset, self-hosted in `public/fonts/` with their licenses.
- **Icons.** Lucide (ISC).

---

## En español

Portfolio personal de Ernesto Contreras. La página recorre un pipeline de IA (entrada, recuperación, reordenación, generación y salida). Incluye un agente con guion (Ctrl/Cmd + K) que funciona entero en el navegador: no usa LLM, no tiene backend y no lleva rastreo.

- **Desarrollo local:** `npm install` y después `npm run dev`. Los tests se lanzan con `npm test` y, tras `npm run build`, con `npm run test:e2e`.
- **Textos:** están en `src/content/en.json` y `src/content/es.json`, con las mismas claves (un test lo comprueba).
- **Proyectos:** se definen en `src/content/projects.json` y los casos de estudio en `cases.<slug>`.
- **Agente:** su base de conocimiento está en `src/content/agent/kb.json`.
- **Despliegue:** Cloudflare Pages, conectado al repositorio por Git.
  1. En Cloudflare, **Workers & Pages → Create → Pages → Connect to Git**, con el proyecto llamado `ernesto-portfolio`.
  2. Comando de build `npm run build`, directorio de salida `dist`. La versión de Node sale de `.node-version`.
  3. Si cambia el dominio, actualiza `siteUrl` en `src/content/profile.json`, `public/robots.txt`, `public/llms.txt` y `tests/unit/head.test.ts`, y ejecuta `npm run og`.
