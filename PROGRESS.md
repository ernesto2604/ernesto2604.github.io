# PROGRESS

Resume point for long sessions. Updated at the end of each phase.
Rulings and deferred minors are listed in the final delivery report (the execution ledger was removed after the final review).

## Status (2026-10-24)
- Phases 0-6: done. Spec (approved + §12b gate revision): `docs/superpowers/specs/2026-10-23-portfolio-design.md`.
  Plan: `docs/superpowers/plans/2026-10-23-portfolio.md`. Branch: `feat/portfolio` (not pushed).
- Phase 7: Lighthouse, axe, keyboard sweep, reduced motion and transparency, link check, bilingual copy
  review, impeccable detector and design-taste-frontend inspector all done; whole-branch code review done (0 critical; 2 important fixed with tests).
- Phase 8: done. Build OK, 109 unit + 43 e2e passing, Lighthouse mobile EN 96/100/100/100, ES 97/100/100/100.

## Light redesign (2026-10-24, branch `feat/light-redesign`, not pushed)
- Spec §14. Light palette A (paper + amber fill, deep amber text), Inter (wght + opsz) + Geist Mono,
  side menu instead of the top bar, hero "AI Engineer" + intro + photo, query moved to the start of
  Retrieval, welcome loader once per session, OG images and favicons regenerated.
- Hero: no location/availability line (not confirmed by Ernesto). Meta description and About still say
  "Madrid, available now"; review those.
- Checks: build, typecheck, 122 unit and 78 e2e (6 skipped by design) passing; axe 0 critical/serious in
  EN/ES, stacked, menu open and agent open. Lighthouse mobile (3 runs each, final build) EN 95-96/100/100/100,
  ES 94-95/100/100/100 (dark baseline: EN 93-96, ES 90-94). Fonts 110.6 KB -> 96.0 KB.
- Photo pipeline: `python scripts/photo.py` (Pillow with AVIF). Original in `assets-src/foto.png`.

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
- Ring demo YouTube URL, WakeMap screenshots. (Photo and CV PDFs are in since 2026-10-24.)
- Permission to use `docs/images/dashboard.png` from the public hybrid-rag-api repo as a real visual.
- Confirmation of the CEU claim "data retrieval from days to near-instant" (source: profile README only).

## Notes on the user's other repos
- wakeMap_submission / lastVersionWakeMap commit Apple SF Pro font files (license issue).
- lastVersionWakeMap has stray files: `taskkill`, `Microsoft/Windows/PowerShell/ModuleAnalysisCache`.
- hybrid-rag-api has no CI workflow although the CV mentions GitHub Actions.
- GitHub profile README still says Claude 3 Haiku for Ring and FastAPI/PostgreSQL/JWT for WakeMap.
