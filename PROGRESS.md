# PROGRESS

Resume point for long sessions. Updated at the end of each phase.
Execution ledger with every ruling (git-ignored): `.superpowers/sdd/2026-10-23-portfolio/progress.md`.

## Status (2026-10-24)
- Phases 0-6: done. Spec (approved + §12b gate revision): `docs/superpowers/specs/2026-10-23-portfolio-design.md`.
  Plan: `docs/superpowers/plans/2026-10-23-portfolio.md`. Branch: `feat/portfolio` (not pushed).
- Phase 7: Lighthouse, axe, keyboard sweep, reduced motion and transparency, link check, bilingual copy
  review, impeccable detector and design-taste-frontend inspector all done; whole-branch code review running.
- Phase 8: final verification and report pending.

## Built
- Pinned scroll story for Input, Retrieval (real BM25 scores) and Rerank (rank deltas), stacked on small
  screens and with reduced motion. Generate: three case studies with accessible SVG diagrams (Ring draws on
  scroll). Output: about, skills, experience, education, contact, footer wordmark.
- Scripted agent (Ctrl/Cmd+K): bilingual KB, BM25 intent matching with typo tolerance, truthful tool calls,
  streaming, actions, native dialog.
- SEO: prerendered /, /es/, 404, sitemap, robots, hreflang, OG images, JSON-LD Person, llms.txt.

## Environment (checked 2026-10-23)
node 22.21.0, npm 10.9.4, git 2.51.1, gh 2.81.0. Playwright Chromium in the user cache.
`gh` is logged in as **ernestoContreras04**, not ernesto2604: pushing to
`ernesto2604/ernesto2604.github.io` needs that account (or a collaborator grant).

## Pending inputs (inside the repo, e.g. `assets-src/`)
- Photo, CV PDF(s) (EN and/or ES), Ring demo YouTube URL, WakeMap screenshots.
- Permission to use `docs/images/dashboard.png` from the public hybrid-rag-api repo as a real visual.
- Confirmation of the CEU claim "data retrieval from days to near-instant" (source: profile README only).

## Notes on the user's other repos
- wakeMap_submission / lastVersionWakeMap commit Apple SF Pro font files (license issue).
- lastVersionWakeMap has stray files: `taskkill`, `Microsoft/Windows/PowerShell/ModuleAnalysisCache`.
- hybrid-rag-api has no CI workflow although the CV mentions GitHub Actions.
- GitHub profile README still says Claude 3 Haiku for Ring and FastAPI/PostgreSQL/JWT for WakeMap.
