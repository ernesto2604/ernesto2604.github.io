# Design brief: "The pipeline that presents me"

Status: APPROVED 2026-10-23 (see section 13 for follow-up answers).

## 1. Intent

A static, bilingual (EN default, ES) portfolio for Ernesto, aimed at recruiters,
hiring managers and engineers hiring AI Engineers and Forward Deployed Engineers
(and adjacent roles). The site must *demonstrate* AI-systems thinking: the page is
structured as a retrieval pipeline, and a scripted in-browser agent answers
questions with visible, truthful "tool calls" over local data.

Success: a reviewer understands in 10 seconds who Ernesto is and what he built,
can reach a deep, honest case study in two clicks or one question, and finds no
claim that is not backed by a repo, README or Ernesto's own statement.

Facts confirmed with Ernesto (2026-10-23):
- Based in Madrid, Spain. Actively looking, available immediately. AI Engineer and
  FDE equally, open to related roles, relocation and hybrid.
- Featured, in order: ring-telemetryops, hybrid-rag-api, WakeMap
  (code facts from `lastVersionWakeMap`: Flutter + Node/Express Gemini proxy).
  The profile README's "FastAPI/PostgreSQL/JWT" line for WakeMap is NOT used.
- Ring uses Amazon Bedrock with Claude Haiku 4.5 (not Claude 3 Haiku).
- Secondary cards: AI_surveillance_hub, secure-auth-go, mediterraneanChurros.
  Excluded: the `ernesto2604` profile repo, the `agent-deployment-challenge` fork,
  `wakeMap_submission` (superseded by `lastVersionWakeMap` as the code source, but
  its README is the richer description and is cited for features/limitations).
- Contact: email, LinkedIn, GitHub, phone (+34). Photo: yes (pending file).
- CV: PDF pending; a print-friendly download will be published.
- Hosting: `ernesto2604.github.io` repo, base path `/`.
- Accent: signal amber.

## 2. Concept and section map

Scrolling walks a query through a pipeline. Each stage is a `<section>` with an
id, reachable by hash and by the pipeline indicator.

| # | Stage (hash) | Content | Surface |
|---|---|---|---|
| 01 | INPUT `#input` | A query types itself: "Who is Ernesto and what has he built?". Then: name, role line ("AI Engineer · Forward Deployed Engineer"), one-line value prop, location + availability chip, CTAs: "Ask the agent (Ctrl K)" and "See the work". Photo, small and framed, beside the headline on desktop, below on mobile. | Background layer |
| 02 | RETRIEVAL `#retrieval` | Six repos as "retrieved chunks": name, description, languages, topics, stars, last update (build-time GitHub data). Each shows a relevance score computed by the site's real local lexical scorer against the hero query; a caption states exactly that. | Opaque cards |
| 03 | RERANK `#rerank` | Cards animate into a new order (Motion `layout`). The rerank rule is shown plainly: "featured by the author, then recency". Featured three rise and expand; the other three compact into an "also built" row. | Opaque cards |
| 04 | GENERATE `#generate` | Three case studies (`#ring-telemetryops`, `#hybrid-rag-api`, `#wakemap`): problem, approach, SVG architecture diagram (with `<title>`, `<desc>` and a text list equivalent), stack, key decisions, honest limitations, next steps, repo/demo links, real visuals when provided. | Opaque, wide reading column |
| 05 | OUTPUT `#output` | About (short bio), skills grouped (AI & retrieval, backend & data, cloud & ops, languages, frontend & mobile), experience and education (from CV), contact, CV download. | Opaque |
| — | Footer | An "output log": `status 200 · 5 stages · 0 network requests from the agent` (true statement), language toggle, links, and an oversized cropped wordmark "ERNESTO" in the display face. | Background layer |

Fewer, better sections: no testimonials, no blog, no "services".

## 3. Reference study (visited 2026-10-23)

Reachable: godly.website (redirects to recent.design), awwwards portfolio list,
footer.design, landdding.com, 60fps.design, motionin.design, fontinlogo.com,
iconly.design, modulify.ai/templates. Not usable: on.design (login wall),
wonderlist.design (grid rendered empty in the test browser).

Patterns adopted:
1. **Oversized cropped wordmark footer** (footer.design's own 404 "Four04"): ends
   the page with weight and memory without extra content.
2. **Ghosted giant numerals behind headings** (60fps.design's ghost "60FPS"
   masthead): each stage gets a huge low-contrast stage number "01…05" behind its
   title; decorative, `aria-hidden`.
3. **Two-tone editorial headline** (landdding, fontinlogo: bright first clause,
   muted second): the hero query is muted, the answer (name/role) bright. Encodes
   input vs output.
4. **Mono metadata strip with small caps labels** (landdding's DESIGNS / 2.5k
   counters): repo cards show LANG / UPDATED / STARS in mono, real values only.
5. **Filter chips row** (recent.design, modulify): topic chips above the retrieval
   grid; selecting one re-scores with that term (real scorer, visible change).
6. **Media-first cards with a corner arrow affordance** (recent.design cards):
   case-study cards link out with a consistent arrow icon.
7. **Current-item dot in a slim index** (recent.design sidebar "Design ●"): the
   pipeline indicator uses a dot + label for the active stage.
8. **Single bright pill CTA on a dark field** (motionin.design): one primary
   amber action per view; everything else is secondary.

Deliberately avoided:
1. Consent banners and tracking (awwwards, 60fps show cookie modals over
   content). This site sets no cookies and loads no third-party scripts.
2. Empty skeleton grids while JS loads (iconly, landdding, wonderlist showed blank
   tiles). All content is prerendered HTML; animation only enhances it.
3. Gated or noisy chrome (on.design login wall, sponsor slots) and the generic
   "AI site" look: purple-cyan gradients, glowing neon, emoji icons.

## 4. Visual system

### Palette (tokens; contrast verified in code by a unit test)

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#07090E` | page base |
| `--bg-1` | `#0C1018` | gradient stop, footer |
| `--surface` | `#11161F` | opaque reading cards |
| `--surface-2` | `#171D29` | raised / hover |
| `--line` | `#252D3B` | hairlines (decorative only) |
| `--line-strong` | `#3A4456` | input borders (≥3:1 vs surface) |
| `--text` | `#ECEFF4` | primary text |
| `--text-muted` | `#A3ACBB` | secondary text (target ≥ 7:1 on bg, ≥ 4.5:1 on surface-2) |
| `--accent` | `#FFB547` | signal amber: primary CTA, active stage, scores, focus ring |
| `--accent-ink` | `#1A1204` | text on amber |
| `--accent-soft` | `rgb(255 181 71 / 0.12)` | chip/score backgrounds |
| `--ok` | `#7FD1A8` | "200 OK" status only |

Rules: amber is the only saturated color; it marks "signal" (where attention or
action is). No gradient text. No purple.

### Type
- Display: **Newsreader Variable** (OFL-1.1, Production Type), optical-size axis
  pushed to 72 at hero sizes, light 300-400, italic for the emphasized word. A
  sharp editorial serif that is not the 2024-26 Framer default.
- Sans: **Geist Variable** (OFL-1.1, Vercel). UI and body.
- Mono: **Geist Mono Variable** (OFL-1.1). Tool-call details, metadata, labels.
- All via Fontsource, self-hosted, `latin` + `latin-ext` subsets only (Spanish
  accents are in `latin`), `font-display: swap`, display + sans preloaded.
- Fluid scale (clamp, 390→1440px): 12 / 14 / 16 / 18 / 22 / 28 / 40 / 64 / 104 /
  152 px at max. Body 17-18px, line-height 1.55, measure ≤ 68ch.

### Space, radius, depth
- 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 144.
- Radius: 6 (chips), 12 (cards), 20 (panels), 999 (pills).
- Depth: fixed background layer of 2-3 soft radial "light orbs" (CSS gradients,
  slow transform drift) + a tiled SVG noise grain at ~4% opacity. No WebGL.

### Icons
**Lucide** (ISC), stroke 1.5, 20/24px, imported per icon (tree-shaken). Repo
language/stack labels are text, not brand logos.

## 5. Glass rules

Glass is allowed only on: (1) top navigation, (2) pipeline indicator, (3) agent
panel. Never on reading content.
- Recipe: `background: rgb(17 22 31 / 0.55)`, `backdrop-filter: blur(18px)
  saturate(140%)`, 1px inner highlight `rgb(255 255 255 / 0.08)`, soft shadow.
- Something to refract: the orbs sit behind the nav and indicator areas and drift
  slowly; the agent panel opens over page content.
- Solid fallback (`--surface` at 0.96 opacity, no blur) when any of:
  `prefers-reduced-transparency: reduce`; `@supports not (backdrop-filter: blur(1px))`;
  a `data-lite` flag set at boot when `navigator.hardwareConcurrency <= 4` or
  `navigator.deviceMemory <= 4`. The lite heuristic is provisional: in Phase 4 I
  measure frame times with the browser's performance trace at 4x CPU throttle and
  keep, tighten or drop it based on the numbers.

## 6. Motion principles

- Tokens: `--dur-1 120ms`, `--dur-2 200ms`, `--dur-3 320ms`, `--dur-4 560ms`,
  `--dur-5 900ms`; `--ease-out cubic-bezier(.16,1,.3,1)`,
  `--ease-std cubic-bezier(.2,0,0,1)`, `--ease-in cubic-bezier(.4,0,1,1)` (exits).
- Every motion maps to the pipeline: typing = input arriving, score bars = scoring,
  reorder = rerank, token stream = generation. Nothing moves "for decoration"
  except the slow orbs.
- Load sequence (≤ 1.4s total, never blocks LCP): orbs fade in → query types →
  answer lines rise 12px with 60ms stagger → CTAs. The H1 is in the prerendered
  HTML and visible at first paint; only `transform` is animated on it.
- Scroll: Lenis on fine-pointer devices only; native scrolling on touch (no
  hijack). Reveals: opacity + 16px translate, once, triggered at 15% visibility.
- Magnetic hover: only the two hero CTAs and the agent button, max 6px, disabled
  on coarse pointers.
- `prefers-reduced-motion: reduce`: no Lenis, no typing, no stream (full answer
  appears), rerank is instant, reveals are 120ms opacity only, orbs static.

## 7. The agent (simulated)

- Opens with Ctrl/Cmd+K or the visible button. Lazy-loaded chunk.
- `role="dialog"`, `aria-modal`, focus trap, Escape closes and returns focus,
  answer region `aria-live="polite"` (announced once complete, not per token).
- Knowledge base `src/content/agent/kb.json`: intents with bilingual triggers,
  answers, tool plan and UI actions. Example entry:
  ```json
  { "id": "project.ring", "triggers": { "en": ["ring", "doorbell", "telemetry", "bedrock", "hackathon"], "es": ["ring", "timbre", "telemetría", "bedrock", "hackathon"] },
    "tools": [{ "name": "search_projects", "args": { "q": "$query" } }, { "name": "read_repo", "args": { "repo": "ring-telemetryops" } }],
    "answer": { "en": "...", "es": "..." },
    "actions": [{ "type": "scrollTo", "target": "#ring-telemetryops" }] }
  ```
- Matcher: custom scorer (~150 lines, zero dependencies), TDD with Vitest.
  Normalize (lowercase, strip accents, punctuation) → tokenize → drop EN/ES
  stopwords → per token: exact match, prefix match, or Damerau-Levenshtein ≤ 1
  (≤ 2 for tokens ≥ 7 chars) → BM25-style weighting with IDF across intents →
  best intent above a threshold, else fallback with suggested questions.
  Why not Fuse.js: Fuse ranks whole-string fuzzy similarity; it has no notion of
  multi-keyword intent weighting or IDF, and adds a dependency. A small scorer is
  easier to test against the exact EN/ES queries we care about.
- Tool calls are generated from what the matcher actually does: `search_projects`
  shows the real top hits and scores from the same scorer, `read_repo` shows the
  JSON fields read from the build-time repo file, `get_contact` reads the contact
  config. Durations: 250-700ms, scaled by result size, skipped under reduced motion.
- Language: answers follow the active locale; "habla español" / "in English"
  triggers a `switchLocale` action.
- Intents: who, each featured project, other projects, stack/skills, experience,
  education, availability/roles, location/relocation, contact, CV, how the agent
  works, how the site was built, small talk (hi, thanks), fallback.
- "How this works" note in the panel footer: scripted, runs in your browser,
  sends nothing, no LLM; links to the source on GitHub.

## 8. Data model

- `scripts/fetch-repos.mjs` (runs before `vite build`): GitHub REST
  `GET /users/ernesto2604/repos` + `/languages` per included repo, using
  `GITHUB_TOKEN` when present. Writes `src/data/repos.generated.json` (gitignored).
  On any failure (rate limit, offline) it copies `src/data/repos.fallback.json`
  (committed, refreshed manually by `npm run data:refresh`) and logs a warning.
  Build never fails on data.
- `src/content/projects.json`: locale-independent facts per project: `repo`,
  `slug`, `rank`, `featured`, `stack[]`, `links`, `media[]`, `diagram` id.
- `src/content/{en,es}.json`: all UI copy and all case-study prose, same keys.
  A Vitest test fails if the key sets differ or any value is empty.
- `src/content/profile.json`: name, contact, socials, CV paths (locale-keyed).

## 9. Routing, i18n, SEO

- Two prerendered documents: `/` (en) and `/es/` (es). Build renders the React
  tree to static HTML per locale (Vite SSR build + a small prerender script), then
  the client hydrates. Why: real HTML for crawlers and a fast LCP, without a
  framework switch.
- Each document: correct `lang`, title, description, canonical, `hreflang` en / es
  / x-default, Open Graph and Twitter tags, JSON-LD `Person` (name, jobTitle,
  address locality Madrid, sameAs GitHub/LinkedIn, email).
- Language toggle: a real link to the other document, preserving the hash; choice
  stored in `localStorage`. A tiny inline script on `/` redirects to `/es/` only if
  the stored choice is `es` (no IP or browser-language redirects, which harm SEO
  and surprise users).
- `404.html`: a static bilingual page in the site's style, `noindex`, links to
  both languages. GitHub Pages serves it for unknown paths.
- `sitemap.xml` (two URLs with alternates), `robots.txt`, favicon set (SVG +
  PNG 32/180/512 + manifest), OG images 1200×630 per locale, generated at build
  from an SVG template.
- No analytics, no cookies.

## 10. Stack (with changes to the recommendation)

Vite 8, React 19, TypeScript, Tailwind CSS 4, Motion, Lenis, Vitest,
Playwright (+ axe-core), Lighthouse CI run locally. Lucide icons.

Proposed changes (need your OK):
1. **Drop GSAP + ScrollTrigger.** Motion already covers scroll-triggered reveals
   (`whileInView`, `useScroll`) and the rerank is a native Motion `layout`
   animation (FLIP), which GSAP would need the Flip plugin for. GSAP's license is
   free but not open source ("Standard no-charge license"), and dropping it saves
   roughly 40-50 KB gzipped. Nothing in the concept needs pinning/scrubbing.
2. **No i18n library.** Two JSON files + a typed `t()` hook (~30 lines) and a
   key-parity test. i18next + react-i18next would add ~15 KB gz for features the
   site does not use (plurals, namespaces, backends).
3. **TypeScript 6.0.x, not 7.0.** TS 7 (native compiler) is days-old latest; I pin
   the mature line to avoid editor/tooling friction. Revisit later.

## 11. Performance budget (mobile, Lighthouse simulated throttling)

- Initial JS ≤ 90 KB gz; agent chunk ≤ 25 KB gz, loaded on intent (hover/focus of
  the button, Ctrl K, or idle after load).
- Fonts ≤ 130 KB woff2 total; 2 preloaded.
- Images: AVIF/WebP with explicit dimensions; photo ≤ 60 KB.
- LCP ≤ 2.0 s, CLS ≤ 0.05, TBT ≤ 150 ms. Lighthouse 90+ in all four categories.

## 12. Accessibility

Semantic landmarks, one H1, skip link, visible 2px amber focus ring with offset
on everything focusable, 44px targets, WCAG AA contrast (tested), diagrams with
text alternatives, no information by color alone, reduced motion and reduced
transparency honored, full keyboard flow including the agent.

## 13. Pending inputs from Ernesto

Status: APPROVED 2026-10-23 (including the three stack changes).

Follow-up answers (2026-10-23):
- Positioning: full-time roles only. No mention of internships.
- Inputs only from inside this repo. Ernesto will place CV PDF(s) and photo in
  `assets-src/`. Until then: no CV link, monogram instead of photo, and
  experience/education only from the public profile README, marked for review.
- Ring media: a YouTube link from Ernesto, embedded click-to-load (no request to
  YouTube until the visitor clicks; `youtube-nocookie.com`).
- hybrid-rag-api: the repo has no `.github/workflows`, so the site does not claim CI.
