# neera-living advertorial — build conventions

Isolated advertorial landing page for **neera-living.myshopify.com**, sister
project to the swelling-legs/graduated-compression advertorials on
wheremysocks.com and thecloudslides.com, and the Lorax Pro advertorial on
alpine-footwear.com (cbf-advertorial). Same isolation pattern: dedicated
layout + own CSS/JS, scoped class prefix, no shared theme styles beyond
theme CSS variables/fonts.

Design source: Figma — "Neera Living Adv (Copy)"
(https://www.figma.com/design/qK0lgENNfPcdfnJil0H97Q/Neera-Living-Adv--Copy-?node-id=2-2).
User hands sections over as numbered prose (no code, no pre-supplied class/file
names) — discover specifics from Figma + this codebase, same prompt style as
the sibling projects.

## Store / theme

- Live theme: **"10-08 of BKP Neera Living - Vikrant Dev"** (`#150169321659`),
  pulled via `shopify theme pull --store neera-living.myshopify.com --live`
  on 2026-09-10.
- This is a **Shopify Horizon-based theme** wearing a custom "Cleo Lifestyle"
  skin (rebranded to Neera Living via string-replace in `layout/theme.liquid`,
  history predates this project — not something we touch). Has the standard
  Horizon asset set (`component.js`, `scrolling.js`, `morph.js`, etc.) plus a
  `blocks/` directory (theme-blocks architecture).
- Theme CSS variables come from two layers — use both, don't hardcode:
  - `snippets/theme-styles-variables.liquid` → generic Horizon tokens
    (`--font-body--family`, `--padding-*`, `--margin-*`, `--gap-*`,
    `--style-border-radius-*`, `--animation-*`, etc.)
  - `assets/cleo-theme.css` → actual brand tokens: `--cleo-cream` (#f3e9dc),
    `--cleo-soft` (#f8eadc), `--cleo-copper` (#895737), `--cleo-copper-dark`
    (#4d2e20), `--cleo-ink` (#201814), `--cleo-white`, `--cleo-muted`
    (#7b675a), `--cleo-border`, `--cleo-shadow`.
- No git remote / GitHub theme integration is connected (unlike
  wheremysocks-theme). Local git repo only, initialized 2026-09-10 as a
  safety net for reviewing diffs section-by-section. Deployment method
  (manual `shopify theme push` vs. GitHub integration) not yet decided —
  confirm with user before first push to the live theme.

## Class prefix

**`cls-neera-`** — chosen 2026-09-10 following the `cls-<nickname>-` pattern
used on the sibling projects (e.g. `cls-graduated-` on wheremysocks,
`cls-cloudslidesdr-` on Cloud Slides). Every section/CSS/JS selector on this
page is scoped under this prefix. If section filenames risk the Shopify
50-character `type` limit (learned the hard way on wheremysocks — sync
silently drops section files over that length with no local error), keep
section file basenames short and distinct from any long descriptive page
slug used for the layout/template files.

## Files (planned — created as sections are approved)

- `layout/neera-advertorial.liquid` — dedicated layout. Own `<head>`, loads
  brand fonts, `neera-advertorial.css`, `neera-advertorial.js`. Does not
  include `theme.liquid`'s Cleo static-body-router or any global
  snippets/sections beyond `theme-styles-variables` (for the CSS variables)
  and favicon.
- `templates/page.neera-advertorial.json` — dedicated page template
  referencing the layout above. One JSON section entry per page section.
- `sections/cls-neera-*.liquid` — one section file per Figma block/section.
  Content (headings, copy, images, links) is schema-driven via `settings`/
  `blocks` so it's editable in the theme customizer per the brief.
- `assets/neera-advertorial.css` / `assets/neera-advertorial.js` — single
  shared stylesheet/script for the whole page, loaded once from the layout.
  New sections append here rather than inline `<style>`/per-section assets.

## Rules

- **Mobile-first CSS**, base styles first, `@media (min-width: 768px)` layers
  on desktop — a **single breakpoint**, not the fluid `clamp()` approach used
  on cbf-advertorial. No `!important` anywhere.
- **Figma → CSS conversion:** the Figma frame is built at 800px representing
  mobile at ~2× scale. Divide every value pulled from Figma by **~2.05** to
  get the real mobile CSS value. Desktop values follow the established
  container/spacing conventions from the sibling projects (not a literal
  Figma desktop frame, since the Figma file only has the mobile-at-2× frame).
- Every class is prefixed `cls-neera-*`.
- Use theme CSS variables (see above) instead of hardcoded values wherever a
  suitable token exists.
- Comments inside `{% liquid %}` blocks use a `#` prefix on each line (Shopify
  Liquid's native single-line comment syntax inside a `liquid` tag), not
  `{% comment %}...{% endcomment %}`.
- Section titles/images/copy exposed via customizer settings (`settings`/
  `blocks`) wherever the content is something a merchant would plausibly want
  to edit per campaign.
- Read a file before editing it. Never invent/assume class or file names —
  discover them from the actual codebase. Template JSON edits are targeted
  (preserve `block_order` and existing settings byte-for-byte), never a full
  rewrite.
- **No unsolicited additions** — build exactly the section handed over, one
  at a time. Show the diff and wait for confirmation before starting the next
  section.
- After each section is built, open it in the browser (Chrome MCP) and check
  mobile + desktop rendering before presenting it for review.

## Mobile responsiveness checklist (carried over from sibling projects)

Recurring fixes discovered across the wheremysocks and cbf-advertorial
builds — apply proactively on the first pass instead of rediscovering via
feedback:

- Wrapper owns `aspect-ratio`/`overflow:hidden`; `<img>` is
  `position:absolute; inset:0; object-fit:cover` — never `aspect-ratio` +
  `object-fit` directly on the `<img>`.
- Two-column desktop rows that need a *different* mobile order (not a simple
  reverse) → split into sibling elements, use grid `grid-template-areas` or
  flex `order`, don't nest pieces that must reorder independently inside one
  wrapper.
- Star/icon SVGs: crop the `viewBox` to the path's actual bounding box, not a
  generic `0 0 24 24` — avoids visible gaps between adjacent icons even at
  `gap: 0`.
- Buttons: `width: fit-content; max-width: 100%` by default rather than a
  fixed width; full-width-on-mobile CTAs use `width:100%` on mobile,
  `width:fit-content` at `≥768px`.
- Fixed/sticky bottom bars: `padding-bottom: calc(<val> + env(safe-area-inset-bottom))`
  for the iOS home-indicator; neutralize with a real `@media (min-width:768px)`
  override (not just JS class removal) so nothing sticks on desktop.
- Scroll listeners: `{ passive: true }` + `requestAnimationFrame` + a
  `ticking` guard together, never just one of the two.
- Touch carousels: native `overflow-x` + `scroll-snap`, JS drag only for
  `pointerType === 'mouse'` — don't fight native momentum scrolling with
  custom touch handlers.
- `overflow-x: clip` (not `hidden`) on any scoped root that also contains
  `position: sticky` children — `hidden` creates a new scroll container that
  breaks sticky in iOS Safari.
- Each independent JS behavior is its own IIFE with an early guard-clause
  return — never append new behavior after an existing guard `return`.
- Richtext schema fields strip `class`/`style` from inline `<span>`s — any
  title mixing per-word colors/styles needs separate plain `text` settings
  (prefix/accent/suffix), never a styled span baked into a richtext default.

## Status

**Phase 1 complete:** live theme pulled, structure read, this file created.
No section files exist yet. Figma Dev Mode MCP server connection pending
(user enabling it in the Figma desktop app). Waiting for section 1 handoff.
