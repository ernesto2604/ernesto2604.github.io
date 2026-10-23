# Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native execution chosen: the user's brief forbids subagents for the core build). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Static bilingual portfolio "The pipeline that presents me" with a scripted in-browser agent, deployable to GitHub Pages.

**Architecture:** Vite + React SPA, prerendered to static HTML per locale (`/`, `/es/`) by an SSR build + Node prerender script, hydrated on the client. Content is JSON (locale files + locale-independent facts); repo metadata is fetched at build time with a committed fallback. One local lexical scorer (`src/lib/search.ts`) powers both the retrieval scores and the agent matcher.

**Tech Stack:** Vite 8, React 19, TypeScript 6.0.x, Tailwind CSS 4, Motion, Lenis, Lucide, Fontsource (Newsreader, Geist, Geist Mono), Vitest, Playwright + @axe-core/playwright, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-10-23-portfolio-design.md`

## Global Constraints

- Zero cost, fully static, no runtime network calls except user-initiated (YouTube click-to-load, outbound links).
- No GSAP, no i18n library, no Fuse.js. TypeScript `~6.0.3`.
- All copy in `src/content/en.json` / `src/content/es.json`; components never hold user-visible strings.
- No claim without a source (repo, README, profile README, or Ernesto). Illustrative items labelled.
- Glass only on: nav, pipeline indicator, agent panel.
- Honor `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Base path `/`. Repo target `ernesto2604.github.io`.
- Cross-platform npm scripts (Node scripts, no bash-only syntax).
- Budgets: initial JS ≤ 90 KB gz, agent chunk ≤ 25 KB gz, fonts ≤ 130 KB.

## Review Focus

1. Hash deep link on load (`/es/#ring-telemetryops`) must land on the section after hydration, not at top.
2. JS disabled: all content readable (prerendered), CTAs that need JS (agent) hidden via `.js` class.
3. Language toggle with a hash (`#generate`) keeps the hash; stored `es` preference redirects `/` once, never loops.
4. GitHub API unavailable at build: build succeeds from fallback and logs a warning.
5. Agent: empty input, very long input (> 300 chars), only stopwords, mixed EN/ES query → no crash, fallback suggestions.

Tests for each are listed in the owning task.

---

### Task 1: Scaffold, tooling, design tokens

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/contrast.ts`, `tests/unit/contrast.test.ts`, `.gitignore`

- [ ] Remove old Next.js files from git (already deleted in working tree); `npm init`, install pinned deps.
- [ ] Scripts: `dev`, `build` (= `data` → `vite build` → `vite build --ssr` → `prerender`), `preview`, `test`, `test:e2e`, `typecheck`, `data`, `data:refresh`.
- [ ] Tokens from spec §4/§6 as CSS custom properties, exposed to Tailwind via `@theme`.
- [ ] Test `contrast.test.ts`: `contrastRatio(hex, hex): number`; asserts text/bg ≥ 4.5, text-muted on surface-2 ≥ 4.5, accent on bg ≥ 4.5, accent-ink on accent ≥ 4.5, line-strong on surface ≥ 3.
- [ ] `npm test` passes; commit `chore: scaffold vite react app with design tokens`.

### Task 2: i18n

**Files:** `src/content/en.json`, `src/content/es.json`, `src/i18n/index.tsx`, `tests/unit/i18n.test.ts`

**Produces:** `type Locale = 'en' | 'es'`; `<I18nProvider locale>`; `useT(): (key: string, vars?: Record<string,string|number>) => string`; `useLocale(): Locale`; `localePath(locale, hash?)`.

- [ ] Test: key sets of en/es identical (deep), no empty strings, `{var}` placeholders match per key.
- [ ] Implement; missing key throws in dev, returns key in prod. Commit.

### Task 3: Build-time repo data

**Files:** `scripts/fetch-repos.mjs`, `src/data/repos.fallback.json`, `src/content/projects.json`, `src/data/types.ts`, `tests/unit/fetch-repos.test.ts`

**Produces:** `type Repo = { name, description, url, homepage, languages: Record<string,number>, topics: string[], stars, updatedAt }`; `src/data/repos.generated.json` (gitignored); `getRepos(): Repo[]`.

- [ ] Test: `fetchRepos({ fetchImpl })` with a fetch that rejects → returns fallback and `warning` set (Review Focus 4). With a fake success → keeps only names listed in `projects.json`.
- [ ] Implement; `GITHUB_TOKEN` header when present; `data:refresh` rewrites the fallback. Commit.

### Task 4: Prerender, SEO, 404

**Files:** `src/entry-server.tsx`, `scripts/prerender.mjs`, `src/seo/head.ts`, `public/robots.txt`, `tests/unit/head.test.ts`, `tests/e2e/seo.spec.ts`

- [ ] `buildHead(locale): string` returns title, description, canonical, hreflang en/es/x-default, OG/Twitter, JSON-LD Person. Test asserts each per locale.
- [ ] Prerender writes `dist/index.html`, `dist/es/index.html`, `dist/404.html` (noindex, bilingual), `dist/sitemap.xml`.
- [ ] Inline boot script: sets `.js` on `<html>`, `data-lite` heuristic, stored-locale redirect (only on `/`, only if stored `es`; Review Focus 3).
- [ ] E2E: `/es/` has `lang="es"`; with JS disabled hero text and project names are present (Review Focus 2). Commit.

### Task 5: Shell: background, nav, pipeline indicator, language toggle

**Files:** `src/App.tsx`, `src/components/Background.tsx`, `src/components/Nav.tsx`, `src/components/PipelineIndicator.tsx`, `src/components/LangToggle.tsx`, `src/hooks/useActiveStage.ts`, `src/lib/motion.ts`, `tests/e2e/nav.spec.ts`

**Produces:** `STAGES = ['input','retrieval','rerank','generate','output'] as const`; `useReducedMotion()`; `useActiveStage(): Stage`.

- [ ] E2E: load `/#generate` → `#generate` in viewport (Review Focus 1); toggle on `/#generate` → URL `/es/#generate` (Review Focus 3); Tab order reaches skip link first.
- [ ] Lenis only on `(pointer: fine)` and no reduced motion. Glass recipe + fallbacks from spec §5. Commit.

### Task 6: Deploy workflow

**Files:** `.github/workflows/deploy.yml`

- [ ] `actions/checkout`, `setup-node` (22, npm cache), `npm ci`, `npm test`, `npm run build` with `GITHUB_TOKEN`, `upload-pages-artifact` (`dist`), `deploy-pages`. Permissions `pages: write`, `id-token: write`. Commit.

### Task 7: Search scorer (TDD)

**Files:** `src/lib/search.ts`, `tests/unit/search.test.ts`

**Produces:** `normalize(s): string`; `tokenize(s): string[]` (drops EN+ES stopwords); `editDistance(a,b): number` (Damerau, early exit > 2); `createIndex(docs: {id: string; fields: {text: string; weight: number}[]}[]): Index`; `search(index, query, opts?: {limit?: number}): {id: string; score: number; matched: string[]}[]` (score normalized 0..1 vs. top).

- [ ] Tests: accents folded ("telemetría" = "telemetria"); typo "telemtry" matches "telemetry"; 3-char tokens no fuzzy; IDF: rare term outranks common; empty / stopword-only query → `[]`; 1,000-char query does not throw.
- [ ] Implement BM25 (k1 1.2, b 0.75), token match weight: exact 1, prefix (≥ 4 chars) 0.7, edit-distance ≤ 1 (≥ 4 chars) / ≤ 2 (≥ 7 chars) 0.5. Commit.

### Task 8: Hero + Retrieval card (Phase 4 vertical slice, GATE)

**Files:** `src/sections/Input.tsx`, `src/sections/Retrieval.tsx`, `src/components/RepoCard.tsx`, `src/components/ScoreBar.tsx`

- [ ] Hero per spec §2/§6 (typing query, two-tone headline, CTAs, availability chip). Retrieval scores = `search(createIndex(repos), heroQuery)`.
- [ ] Screenshots at 390 / 768 / 1440; console clean; `impeccable` critique. STOP for user feedback.

### Task 9: Retrieval grid + Rerank

**Files:** `src/sections/Retrieval.tsx`, `src/sections/Rerank.tsx`, `src/lib/rerank.ts`, `tests/unit/rerank.test.ts`

- [ ] Test `rerank(repos, projects)`: featured by `rank`, then others by `updatedAt` desc.
- [ ] Topic chips re-run the scorer. Motion `layout` reorder; instant under reduced motion. Commit.

### Task 10: Case studies + diagrams

**Files:** `src/sections/Generate.tsx`, `src/components/CaseStudy.tsx`, `src/components/diagrams/{Ring,Rag,WakeMap}Diagram.tsx`, `src/components/YouTubeLite.tsx`

- [ ] Diagrams: inline SVG, `role="img"`, `<title>` + `<desc>`, plus visible `<details>` text list. Facts only from READMEs/code reviewed in Phase 0.
- [ ] YouTube lite: poster + button, iframe `youtube-nocookie.com` injected on click only. Commit.

### Task 11: Output + footer

**Files:** `src/sections/Output.tsx`, `src/components/Contact.tsx`, `src/components/Footer.tsx`

- [ ] Phone assembled client-side from parts; `tel:` link. CV link only if `profile.json` has a path for the locale. Commit.

### Task 12: Agent matcher (TDD)

**Files:** `src/content/agent/kb.json`, `src/agent/match.ts`, `tests/unit/agent.test.ts`

**Produces:** `matchIntent(query: string, locale: Locale): { intent: Intent | null; score: number; hits: SearchHit[]; suggestions: string[] }`; `planTools(match): ToolCall[]` where `ToolCall = { name: string; args: Record<string,string>; result: string; ms: number }`.

- [ ] Tests (≥ 30 queries): EN and ES per intent, typos ("whats your stak", "proyectos de rgas"), mixed language, empty, > 300 chars, gibberish → fallback (Review Focus 5); `planTools` returns real hit ids/scores.
- [ ] Commit.

### Task 13: Agent panel UI

**Files:** `src/agent/AgentPanel.tsx`, `src/agent/AgentButton.tsx`, `src/agent/useStream.ts`, `src/agent/actions.ts`, `tests/e2e/agent.spec.ts`

- [ ] Lazy import; Ctrl/Cmd+K; dialog + focus trap + Escape returns focus; aria-live polite on completion; history in session; suggested prompts; "How this works" note; actions `scrollTo`, `open`, `highlight`, `switchLocale`.
- [ ] E2E keyboard-only: open with Ctrl+K, type, Enter, answer appears, Escape closes, focus back on trigger. Commit.

### Task 14: OG images, favicons

**Files:** `scripts/og.mjs`, `public/favicon.svg`, `public/manifest.webmanifest`

- [ ] SVG template → PNG via `@resvg/resvg-js` (en/es 1200×630, icons 32/180/512). Commit.

### Task 15: Hardening + audits

- [ ] `tests/e2e/a11y.spec.ts`: axe on `/` and `/es/` and with agent open → 0 critical/serious.
- [ ] Lighthouse mobile on `vite preview`; fix to ≥ 90 ×4. Reduced motion / transparency passes; link check; bilingual copy review.

### Task 16: README + PROGRESS + final verification

- [ ] README sections per DoD. Run build, tests, e2e, Lighthouse; report numbers.
