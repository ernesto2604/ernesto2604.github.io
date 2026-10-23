# PROGRESS

Resume point for long sessions. Updated at the end of each phase.
Execution ledger (task-level, git-ignored): `.superpowers/sdd/2026-10-23-portfolio/progress.md`.

## Status
- Phase 0-2: done. Brief approved: `docs/superpowers/specs/2026-10-23-portfolio-design.md`.
  Plan: `docs/superpowers/plans/2026-10-23-portfolio.md`. Branch: `feat/portfolio`.
- Phase 3 (foundation): done. Tasks 1-4, 6, 7 complete (scaffold + tokens, i18n, repo data,
  prerender/SEO/404, deploy workflow, search scorer).
- Phase 4 (vertical slice): built (hero, nav, pipeline indicator, retrieval list, featured cards).
  Awaiting impeccable critique and user feedback (GATE).

## Environment (checked 2026-10-23)
node 22.21.0, npm 10.9.4, git 2.51.1, gh 2.81.0. Playwright Chromium in the user cache.
`gh` is logged in as **ernestoContreras04**, not ernesto2604: pushing to
`ernesto2604/ernesto2604.github.io` needs that account (or a collaborator grant).

## Decisions (see ledger for rulings)
- Hosting `ernesto2604.github.io`, base `/`. Locales: `/` (en), `/es/` (es), prerendered.
- Featured: ring-telemetryops, hybrid-rag-api, WakeMap (code source: lastVersionWakeMap).
- Full-time roles only. Name shown: "Ernesto Contreras".
- Stack: no GSAP, no i18n lib, TypeScript 6.0.3. Fonts: Newsreader (wght only), Geist, Geist Mono,
  latin subset, 110 KB total.
- Retrieval = compact scored list (real BM25 over curated tags + GitHub data); Rerank = cards.
- GitHub stars shown only when > 0.

## Pending inputs (must be inside the repo, e.g. `assets-src/`)
- Photo, CV PDF(s) (EN and/or ES), Ring demo YouTube URL, any WakeMap screenshots.

## Open questions
- None blocking.

## Notes on the user's other repos
- wakeMap_submission / lastVersionWakeMap commit Apple SF Pro font files (license issue).
- lastVersionWakeMap has stray files: `taskkill`, `Microsoft/Windows/PowerShell/ModuleAnalysisCache`.
- hybrid-rag-api has no CI workflow although the CV mentions GitHub Actions.
