# Diagram style guide (portfolio)

Source: `src/styles/tokens.css`, `src/styles/global.css`. Diagrams use the CSS variables directly, so they follow the site's light/dark flip (`html[data-dark]`) without extra code.

| Skill role | Site token | Light | Dark |
|---|---|---|---|
| paper (label mask) | `--bg-0` | `#F6F4EF` | `#14120F` |
| node fill | `--surface` | `#FCFBF8` | `#1F1C18` |
| ink (text, focal stroke) | `--text` | `#14120F` | `#F6F4EF` |
| muted (arrows, edge labels) | `--text-muted` | `#55504A` | `#A8A196` |
| rule-solid (node border) | `--line-strong` | `#7C766A` | `#8A8478` |
| accent (focal fill, 1 node) | `--accent-fill` / `--accent-ink` | `#FFB547` / `#1A1204` | same |

Typography: node names Inter 600 15px (`--font-sans`); edge labels Geist Mono 11.5px uppercase (`--font-mono`). No serif title: the case page already has its own heading.

Rules applied: orthogonal connectors with r=8 corners, geometry on a 4px grid, one focal accent node per diagram (the model), `key` nodes get a 1.6px ink border, dashed = optional/fallback/side input, arrows drawn before boxes, edge labels beside their segment on a paper halo.
