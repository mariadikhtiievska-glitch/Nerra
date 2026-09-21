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
- **Figma → CSS conversion — CORRECTED 2026-09-10:** the "Advertorial —
  Mobile" frame (`2:2`) is **390px wide, 1:1 real mobile scale** — confirmed
  directly from `get_metadata` (`width="390"`), not 800px/~2× as an earlier
  session wrongly assumed and recorded here. **Do not divide Figma values —
  use them as literal mobile CSS px values.** Desktop values still follow
  the established container/spacing conventions from the sibling projects
  (not a literal Figma desktop frame, since the Figma file only has the
  mobile frame). Re-verify frame width from `get_metadata` at the start of
  any new advertorial project rather than assuming this 800/2× convention
  carries over — it was specific to a different sibling project's Figma
  file, not a universal rule.
- Every class is prefixed `cls-neera-*`.
- Use theme CSS variables (see above) instead of hardcoded values wherever a
  suitable token exists.
- Comments inside `{% liquid %}` blocks use a `#` prefix on each line (Shopify
  Liquid's native single-line comment syntax inside a `liquid` tag), not
  `{% comment %}...{% endcomment %}`.
- **Content fidelity:** all copy (headlines, body text, labels, numbers,
  badge text, FAQ questions/answers, etc.) must match the Figma source
  verbatim — pull it from `get_design_context`/`get_metadata`, never
  paraphrase, shorten, or "improve" it. Any content mismatch vs. Figma is a
  bug, not a stylistic choice.
- **Customizer editability:** every piece of content a merchant could
  plausibly want to change per campaign — headings, body copy, images, CTA
  labels/links, badge text, prices, countdown target, FAQ items, review
  cards, etc. — must be exposed via section `settings`/`blocks` schema, not
  hardcoded in the section's Liquid/HTML. This applies to every section
  built on this project, including the sticky Add-to-Cart bar and any other
  global element.
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

## Section breakdown (from Figma metadata, frame `2:2`, pulled 2026-09-10)

Top-level blocks in the "Advertorial — Mobile" frame, in page order:

1. Top bar — rotating promo message (`19:2`)
2. Block 1 — Hero: headline, subhead, author byline, hero photo (`19:8`)
3. Block 2 — The Problem: intro + 3 paragraphs + photo (`19:17`)
4. Block 3 — Why Copper: oligodynamic-effect copy + 4-item feature list + photo (`19:25`)
5. Block 4 — The Ten Reasons: section opener (`19:47`) + 10 individual "Reason"
   blocks (`19:50`–`22:37`, numbered 10 down to 1 in the layer names — i.e.
   displayed in reverse/countdown order), each with number, heading, body
   copy, photo
6. Block 5 — How to Use: 4 numbered steps + "Important notes" box + photo (`23:2`)
7. Block 6 — Comparison Table: Neera vs Steel vs Plastic, 5 feature rows (`23:27`)
8. Block 7 — What's Included + Trust: included-items list, photo, 6 trust
   badges (`24:2`)
9. Block 10 — Final CTA + Product Card: photo, headline, feature/code copy,
   price, primary CTA, countdown timer (`25:33`) — note this is positioned
   *before* Block 8/9 in the page despite the "10" in its layer name
10. Block 8 — Social Proof: 5 review cards (`24:36`)
11. Block 9 — FAQ accordion: 7 Q&A items, first open by default (`25:2`)
12. Footer — disclaimer: FDA disclaimer + copyright/policy links (`25:45`)

## Global elements (not part of the numbered section list)

- **Sticky mobile Add-to-Cart bar** — Figma node `25:48`
  (https://www.figma.com/design/qK0lgENNfPcdfnJil0H97Q/Neera-Living-Adv--Copy-?node-id=25-48).
  Cream background (`--color/cream` #faf6ef), full-width button, copper-red
  fill `#9c3d21` (does not match either existing `--cleo-copper` #895737 or
  `--cleo-copper-dark` #4d2e20 — check if other CTAs in the design share this
  exact red before deciding whether to add a new CSS variable or hardcode
  it), 46px tall, `Save up to 15% today` label (Instrument Sans SemiBold
  17px/20px, 0.2px tracking), `box-shadow: 0px -3px 12px rgba(0,0,0,0.12)`
  above the bar. Figma's own layer note says "appears after Block 4", but
  **the user's explicit instruction (2026-09-10) is to trigger it after 20%
  scroll depth instead** — follow the user's instruction, not the layer
  note. Mobile-only per the design (desktop treatment not yet specified —
  confirm with user when building this). Belongs in the shared layout/JS
  (`neera-advertorial.js`/`.css`), not as its own numbered content section —
  build it once during layout scaffolding, show its own diff for review like
  any other section.

## Design system (from `get_variable_defs` on frame `2:2`, pulled 2026-09-10)

- Colors: `color/cream` #faf6ef, `color/cream-alt` #f1e9dc, `color/ink` #2a241f,
  `color/ink-muted` #6e655c. These are Figma's own tokens for this design and
  are **distinct from** the existing theme's `--cleo-*` variables (e.g.
  `--cleo-cream` #f3e9dc ≠ this file's cream #faf6ef) — do not conflate them.
  Mirrored locally as `--cls-neera-*` custom properties in
  `assets/neera-advertorial.css` (not by loading `cleo-theme.css`, to keep
  this project's isolation — that file also carries unrelated global
  `body`/`.cleo-section` rules).
- Fonts: **Instrument Sans** (body/UI/buttons/eyebrows), **Newsreader**
  (headings + the big "Reason" numerals), **Lora** (stat numerals, e.g. trust
  badge counts/price). Loaded via Google Fonts in the layout head (no
  self-hosted woff2 for these exist in the theme's assets).
- Full named type scale (eyebrow, heading, subhead, body, body-medium,
  body-italic-lead, body-small, body-micro, button, numeral-reason,
  numeral-stat) is implemented as `.cls-neera-type-*` utility classes in
  `assets/neera-advertorial.css` — reuse these in every section rather than
  redeclaring font-family/size/weight/line-height/letter-spacing inline.

## Build log

- **Layout scaffold + Top bar + Sticky bar — done 2026-09-10.** Created
  `layout/neera-advertorial.liquid`, `templates/page.neera-advertorial.json`,
  `assets/neera-advertorial.css`, `assets/neera-advertorial.js`,
  `sections/cls-neera-top-bar.liquid` (blocks-based rotating messages —
  only the one message actually in the Figma file is populated by default;
  merchant adds more via customizer rather than us inventing copy),
  `sections/cls-neera-sticky-bar.liquid` (rendered directly from the layout
  via `{% section %}`, not part of the template's section order, since it's
  global chrome — see "Global elements" above).
- **Gotcha — template-JSON sections need explicit blocks, presets don't
  apply:** a section written directly into a template JSON file (as opposed
  to added via the theme editor's "Add section" UI) does **not** get its
  schema `presets` blocks automatically. Discovered when the top bar
  rendered as an empty `<div>` — `section.blocks` was empty even though the
  schema preset had one message block. Fix: the template JSON's section
  entry must include its own explicit `"blocks"` + `"block_order"` keys
  mirroring the preset. Apply this on every future section added straight to
  `templates/page.neera-advertorial.json`.
- **Preview workflow — local `theme dev` is blocked, use `theme push` to an
  unpublished theme instead.** `shopify theme dev` refuses to sync *any*
  files if schema validation fails anywhere in the theme, and this theme (as
  pulled) has ~23 pre-existing validation errors in default Horizon files we
  don't touch (`blocks/button.liquid`, `sections/hero.liquid`,
  `sections/footer.liquid`, etc. — invalid color defaults, invalid preset
  block types). This is a pre-existing store/theme issue, not something
  introduced by this project, and out of scope to fix (would mean editing
  many unrelated shared theme files). **Established workflow instead:** run
  `shopify theme push --theme <preview-theme-id> --store
  neera-living.myshopify.com` (first push used `--unpublished --theme "Neera
  Advertorial Preview"` to create it; that preview theme's id is
  `151103340731` — reuse it for subsequent pushes rather than creating a new
  preview theme each time) — `theme push` still uploads successfully despite
  the same pre-existing errors (unlike `theme dev`). Then check rendering
  with the claude-in-chrome MCP:
  1. Navigate first to `https://neera-living.myshopify.com/?preview_theme_id=<id>`
     (bare root, myshopify.com host) to set the preview session.
  2. Then navigate to the actual page, e.g.
     `https://neera-living.myshopify.com/pages/contact?view=neera-advertorial`
     (no repeated `preview_theme_id` needed once the session is set) — using
     an existing page's handle (e.g. `contact`) with `?view=<template
     suffix>` to preview our custom template without needing a dedicated
     Shopify Page record. **Important:** combining `?view=` and
     `?preview_theme_id=` in one URL on a non-root path triggers a redirect
     to the store's custom domain (neera-living.com) that silently drops
     `preview_theme_id`, falling back to the *live* theme's default
     template — always set the preview session on the bare myshopify.com
     root first, as a separate navigation.
  3. Self-check via `read_page`/`javascript_tool` (e.g.
     `document.querySelector('main').outerHTML`, `getComputedStyle`,
     `getBoundingClientRect`) rather than relying only on screenshots —
     `resize_window` does not reliably produce a true narrow viewport in
     this remote Chrome environment (viewport stayed ~1512px wide despite
     resizing to 390/400px), and Shopify's own staff preview-mode toolbar
     overlays the bottom of the viewport, which can hide fixed-bottom
     elements like the sticky bar in screenshots even when they're
     correctly positioned (verified via `getBoundingClientRect` instead).
  4. Present the preview theme's editor/preview links to the user for their
     own visual confirmation as final sign-off, since screenshot-based
     mobile-width verification is unreliable in this environment.

- **Block 1 — Hero built and self-verified 2026-09-10.** Created
  `sections/cls-neera-hero.liquid`. Downloaded the two Figma raw images for
  this node (`get_metadata`/`download_assets` on `19:8`) and committed them
  as static theme assets — `assets/neera-hero-photo.jpg` (full-res hero
  photo, was `rawImages[2]`, 1280×1714) and
  `assets/neera-hero-author-avatar.jpg` (doctor headshot, was
  `rawImages[1]`, 2000×1333) — since Figma's asset URLs expire in ~7 days.
  Both are wired as `image_picker` settings with a text-setting fallback
  asset filename (mirrors the existing `cleo-hero.liquid` convention in this
  theme), so a merchant can swap either photo via the customizer without
  code changes. Added `--cls-neera-espresso: #341e0f` to the shared token
  set (a literal color used both as the top bar's background and the Hero's
  text color, not one of Figma's named variables but reused enough to
  deserve a token) and reused it in the top bar too. Added this project's
  first real `@media (min-width: 768px)` desktop treatment (single
  breakpoint per the rules above) — centered ~640px column, larger
  heading/subhead sizes, taller photo — since the Figma file only has the
  mobile frame and desktop wasn't specified section-by-section; this was
  applied proactively per the "Mobile-first CSS... single breakpoint" rule
  already on record, not additional scope.
- **Content note:** the Hero heading/subhead/byline text are plain `text`/
  `textarea` settings (not hardcoded), matching the customizer-editability
  rule. Byline detail lines use one `textarea` setting rendered through
  `newline_to_br` (the 4 lines incl. a blank line map naturally onto embedded
  newlines — no need for a richtext field or per-line settings here).

## Live vs. preview theme pushes

- Preview theme `151103340731` ("Neera Advertorial Preview") is for
  self-checking work before the user sees it — push here after every
  section, by default.
- The user has also assigned a real Shopify Page (template
  `page.neera-advertorial`) on the **live** theme (`150169321659`) so they
  can view progress directly on the live site. The first live push (top bar
  + sticky bar) was done at the user's explicit request ("push it live, so
  i can assign the page and view it").
- **That authorization does not automatically extend to future pushes** —
  confirmed 2026-09-10 when a second `theme push --live` was blocked by the
  Claude Code auto-mode permission classifier. Going forward: push new work
  to the preview theme and self-verify there by default; only push to the
  live theme again if the user explicitly asks for it (or ask them first
  whether they want each section synced to live as it's built, vs. batched).

## Incident — Hero "missing" on live was a deployment gap, not a code bug

2026-09-10: user reported Hero content completely gone on the live page
after a round of desktop-CSS feedback. Root-caused by pulling the actual
live theme's files (`shopify theme pull --theme 150169321659 --only
templates/page.neera-advertorial.json --only sections/cls-neera-hero.liquid`)
rather than trusting assumptions: the live theme's template JSON only had
`"order": ["top-bar"]` and `sections/cls-neera-hero.liquid` didn't exist on
live at all — because both prior `shopify theme push --live` attempts had
been silently blocked by the Claude Code auto-mode permission classifier
(each blocked attempt returns an error to me, not a partial/broken deploy —
but I'd told the user to run it themselves and it seems that didn't happen
until asked again explicitly). Not a Liquid/schema error, not a hidden
block, not caused by the desktop CSS discussion. **Lesson:** when told
something built and preview-verified isn't showing up live, check what's
*actually deployed* on the specific theme in question (pull the live
theme's copy of the file, or inspect the rendered DOM directly) before
suspecting a code regression — a blocked/incomplete push is a more likely
cause than a fresh bug, especially right after a live-push permission
denial earlier in the session.
- **Standing gotcha:** `shopify theme push --live` reliably gets blocked by
  the Claude Code permission classifier when I run it, even right after the
  user says "push" in response to a direct question — approval doesn't
  carry over per-call. The reliable path is asking the user to run it
  themselves via `! shopify theme push --live --allow-live --store
  neera-living.myshopify.com`.

## Desktop layout rule — propose before implementing (2026-09-10)

**Corrected 2026-09-10:** my first Hero desktop pass just centered the
mobile single-column layout with a max-width — the user rejected this as
"not a real desktop layout." No separate desktop Figma frame exists in this
file, so there's no design reference to build from by default.
**Standing rule for every remaining section:** before writing any desktop
(`≥768px`) CSS, describe the proposed desktop layout in 1-2 sentences —
columns vs. stacked, relative widths, what sits next to what, vertical
alignment — and wait for explicit confirmation before implementing. Only
skip this check-in when the user has already specified the desktop layout
directly (as they did for Hero's two-column spec below) — then just build
it. This check-in replaces the missing design reference; don't default to
"just center it and bump the font size."

Hero's confirmed two-column desktop pattern (reference for the general
shape future sections might take, not a rule to copy verbatim): outer grid
`max-width:1280px`, centered, `grid-template-columns: minmax(0,55fr)
minmax(0,45fr)`, `align-items:center`, text column first/left, media column
second/right. The text-column grouping div uses `display:contents` at
mobile (so it doesn't affect the existing mobile flex flow at all) and
becomes a real `display:flex; flex-direction:column` only inside the
`≥768px` media query — a reusable technique for turning a flat mobile
list of children into a desktop column without duplicating markup per
breakpoint.

- **Block 2 — The Problem built and self-verified on preview 2026-09-10.**
  Created `sections/cls-neera-problem.liquid`. Heading + 3 body paragraphs
  use `richtext` settings (not plain `text`) since the Figma copy has
  inline `<strong>` emphasis mid-sentence — richtext handles bold natively
  without the class/style-stripping problem (that rule only bites on
  colored/custom-styled spans, not plain bold). Downloaded and committed
  `assets/neera-problem-bottles.jpg` — confirmed via `get_metadata` that the
  three per-bottle captions ("Leaches microplastics" etc.) are baked into
  the source photo itself (no separate Figma text layers), so no extra
  content/settings were needed for them.
  **Desktop layout:** user explicitly requested photo-left/text-right
  (mirrored from Hero's text-left/photo-right). Mobile DOM order keeps the
  photo last (matches Figma); desktop uses `order: -1` on
  `.cls-neera-problem__photo` to visually move it first without duplicating
  markup — same `display:contents`-wrapper technique as Hero for the text
  group. Confirmed working via screenshot + `getBoundingClientRect`/
  computed-style checks (image loads asynchronously — don't trust a
  same-instant screenshot after scrolling to it, re-check after a short
  wait or verify via JS instead).

## Full-bleed background pattern

Fixed 2026-09-10 on Block 2 after the user flagged light gaps on the sides
at wide viewports: a section's colored background must live on an
**outer, unconstrained element**, with a **separate inner wrapper**
(`.cls-neera-<section>__inner`) carrying `max-width`/`margin:0
auto`/padding and the actual column layout. Don't put `max-width` +
background on the same element — that leaves the background stopping at
the content width instead of spanning the viewport. Apply this to every
section with a background color from the start, not just Block 2.

## Block 3 — Why Copper + two fixes (2026-09-10)

- **Built:** `sections/cls-neera-why-copper.liquid`. Feature list is
  blocks-based (left accent bar + text), heading/paragraph richtext for
  inline bold. Photo is a single flattened composite
  (`assets/neera-why-copper-photo.jpg`, downloaded at 3x scale via
  `download_assets` for a sharp desktop render) rather than trying to
  reproduce Figma's layered texture-background + absolutely-positioned
  certificate-badge overlay in CSS — the badge asset
  (`hf_20260727_100248_...`) is reused verbatim in Reason 7 later in the
  page too, but flattening per-occurrence (like Block 2's bottle photo) is
  simpler and just as faithful. Desktop: text left (~55%) / photo right
  (~45%), vertically centered, confirmed by the user before implementing
  per the standing rule.
- **Cropping gotcha:** the source photo (1050×1200, portrait) inside a
  wide/short desktop box (`object-fit: cover`, default center position)
  cropped into the top of the certificate badge text. Fixed by increasing
  `min-height` (380→460px) and adding `object-position: center 20%` at
  desktop. **Apply this check to every future photo section that mixes a
  portrait source image with a landscape-ish desktop box** — verify
  important content near a photo's edge doesn't get cover-cropped, don't
  assume default center positioning is safe.
- **`overflow-x: clip` → `overflow-x: hidden` on `.cls-neera-body`:** user
  reported a persistent shadow-like artifact along the left edge on mobile
  (their phone). Investigated thoroughly (DOM scan for box-shadow/gradient
  elements, fixed left-edge elements, horizontal overflow) and found
  nothing in our code or even third-party widgets that explained it — but
  `overflow-x: clip` has known WebKit/Safari rendering quirks, especially
  with a `position: fixed` + `transform` + `box-shadow` descendant (exactly
  what the sticky bar is). The `clip`-over-`hidden` choice was carried over
  from a sibling project's rule about preserving `position: sticky`
  descendants — **this project has no `position: sticky` elements** (the
  sticky bar uses `fixed`), so that rule never actually applied here.
  Switched to `hidden`, which has no known downside for us. Not yet
  re-confirmed by the user on their actual device — ask them to check again
  after this lands.

## Left-edge shadow — round 2 (2026-09-10)

The `overflow-x: hidden` fix did NOT resolve it (user confirmed still
present on Android Chrome). Diagnostic Q&A narrowed it down: shadow stays
**fixed to the screen edge while scrolling** and does **not** appear on
other sites in the same browser — rules out an OS-level gesture-nav
indicator (my first theory) and confirms it's something in our page, not
system UI, and it behaves like a `position: fixed` element rather than
in-flow content.

**Prime suspect: `.cls-neera-sticky-bar`** — the only `box-shadow` in the
whole stylesheet, `position: fixed`, spans full width (`left:0; right:0`).
Even though it's pushed off-screen via `transform: translateY(100%)` when
not shown, some Android Chrome versions have known rendering quirks where a
transformed-off-screen fixed element's shadow can still bleed a sliver at
the viewport edge (a compositing-layer artifact). Fix applied: added
`visibility: hidden` (switching to `visible` only alongside the
`--visible` class, with a transition-delay so the slide-up animation still
works) — this fully removes the element from painting when hidden, instead
of relying on `transform` alone to move it out of view.
**Could not verify this fix myself:** the only way to test it is at mobile
viewport width, but `resize_window` does not actually change the real
rendering width in this remote Chrome environment. Pushed to preview and
asked the user to verify live on their actual phone.

**Confirmed fixed 2026-09-10** — user verified on their Android phone after
the live push. Root cause: Android Chrome rendering the sticky bar's
`box-shadow` as a viewport-edge artifact while the element was transformed
off-screen; `visibility: hidden` (instead of relying on `transform` alone)
resolved it.

## Block 4 — opener + all 10 Reason blocks (2026-09-10)

- **`sections/cls-neera-reasons-opener.liquid`** — simple eyebrow+heading
  intro. Desktop: single centered narrow column (~700px), not stretched
  full-width, since there's no photo to pair with — confirmed by user.
- **`sections/cls-neera-reason.liquid`** — ONE reusable section type for all
  10 reason blocks, instantiated 10× in the template
  (`reason-10` down to `reason-1`, matching display order) with different
  `number`/`heading`/`body`/`photo_image_fallback` settings each. Numeral
  uses `.cls-neera-type-numeral-reason` at 30% opacity per Figma.
- **Delegated the mechanical data-gathering to a forked subagent**
  (reasons 2–10's heading/body/photo, since reason 1/displayed-"10" was
  already pulled directly) — kept 9× raw Figma design-context dumps out of
  main context. **Caught and corrected a real mistake before it caused
  damage:** my first instruction (and the fork's initial attempt) targeted
  `download_assets` on each reason's *outer* card frame instead of its
  inner "PHOTO · REASON N" child node — that would have flattened the
  numeral+heading+body text INTO the photo image. Caught it by checking my
  own first download's dimensions/content, corrected via a follow-up
  SendMessage to the running fork with the correct inner node IDs before it
  wasted the work. Spot-checked 2 of the fork's 9 delivered photos directly
  (reason-4's flattened certificate-badge composite, reason-9's plain
  graphic) before trusting the rest — both correct.
- All 10 photos saved as `assets/neera-reason-1.jpg` through
  `neera-reason-10.jpg`. All confirmed rendering correctly (content,
  images, no console errors beyond the known pre-existing unrelated JSON
  parse exception) on the preview theme.
- **Desktop layout — user overrode my proposal, wanted zigzag/alternating,
  not consistent.** Built via a per-instance `image_position` select
  setting (`left`/`right`, default `right`) on the reusable
  `cls-neera-reason` section — customizer-editable per the project's
  editability rule, not a hardcoded nth-child CSS trick. CSS: default
  (no modifier class) is text-left/photo-right (DOM order needs no
  change); `.cls-neera-reason--image-left` adds `order: -1` to the photo,
  same technique as Block 2. Set explicitly per template instance:
  reason-10/8/6/4/2 → left, reason-9/7/5/3/1 → right (alternates by
  display order, which for this countdown also happens to be photo-left on
  even numbers).
- **Gotcha — a `theme push` can silently fail to include a file's latest
  settings even while reporting success.** After adding `image_position`
  to all 10 template entries and pushing (clean success, no errors), a
  DOM check showed NONE of the reason blocks had picked up the setting.
  Pulling the theme's actual deployed template back down
  (`shopify theme push`/`pull --only templates/page.neera-advertorial.json`
  to a scratch dir) confirmed the setting was genuinely missing server-side
  despite being correct in the local file and the push reporting success.
  A second, immediate re-push of just that file fixed it — cause unclear
  (possibly a CDN/asset caching lag on Shopify's side), but the lesson:
  **when a change doesn't show up after a "successful" push, don't assume
  the local file is wrong — pull the theme's actual deployed copy back down
  to check what's really live before debugging the code.** Also confirmed
  `--only` scoped push/pull operations don't delete unrelated remote files
  (checked hero/top-bar/layout files still existed after a scoped push).

## Block 5 — How to Use (2026-09-10)

`sections/cls-neera-how-to-use.liquid` — blocks-based numbered steps
(reused `.cls-neera-type-body-medium` for the step-badge numeral, matches
Figma's Body/Medium style exactly), settings-based amber "Important notes"
box (new `--cls-neera-amber: #e9bc69` token, first use of this color),
single flattened 2×2 photo collage (`assets/neera-how-to-use.jpg`, Figma
already had it as one composite image, not 4 separate ones — confirmed via
metadata before downloading, same check applied every time now). Desktop:
text-left/photo-right, confirmed by user, matches Hero/Why-Copper. Pushed,
verified via direct template pull-back (per the standing lesson) + browser
screenshot, no console errors. Live push pending.

## Reason blocks — missed background alternation (2026-09-10)

User caught that all 10 Reason blocks had the same (cream) background —
should alternate. Root cause: I only pulled full `get_design_context` for
the first Reason directly myself; the other 9 were delegated to a fork
that only extracted heading/body/photo, not background, and I wrongly
assumed uniform background from the one instance I'd checked. Re-verified
via `get_variable_defs` on a few more Reason nodes directly — confirmed
alternating `color/cream` / `color/cream-alt`, same even/odd-number parity
as `image_position` (10/8/6/4/2 → cream, 9/7/5/3/1 → cream-alt). Fixed with
a `background` select setting on `cls-neera-reason` (same pattern as
`image_position`), set explicitly per template instance.
**Lesson: when delegating Figma data-gathering to a subagent for a
repeated component, explicitly tell it to check EVERY visual property that
could vary per instance (background, spacing, colors), not just the
properties the task description happened to enumerate — I only asked for
heading/body/photo and implicitly assumed everything else was uniform
from a single reference instance.**

**Recurring gotcha, now seen twice with the same signature:** a
`shopify theme push` reporting clean success can still fail to actually
include new/changed settings values server-side (confirmed again here,
identical to the `image_position` incident) — pulling the template back
down showed `background` genuinely missing after the first push, and an
immediate second push of just that file fixed it both times. **Standing
practice going forward: after any push that adds/changes settings values
in `templates/page.neera-advertorial.json` (not just markup/CSS), verify
by pulling the file back down before telling the user it's confirmed —
don't rely on the push command's own success message for settings-level
changes.**

## Block 6 — Comparison Table (2026-09-10)

`sections/cls-neera-comparison.liquid` — blocks-based rows (feature label +
steel/plastic checkboxes; NEERA column is always a checkmark, not
per-row-editable, since copper wins every row by design intent). Column
header font simplified to Instrument Sans instead of Figma's literal Work
Sans (used nowhere else on the page, only for 3 six-letter labels — not
worth a 4th font-family load). Desktop: no photo to pair with, so single
centered column, `max-width: 800px`, confirmed by user (screenshot showed
it still full-bleed before this landed). Pushed, verified via template
pull-back + browser check, no console errors. Live push pending.

## Sticky-bar shadow — round 3 (2026-09-10)

Reported again after being confirmed fixed once already. The `visibility:
hidden` fix from round 2 was still intact and unchanged in the CSS — so
either it was incomplete, or a different element is now responsible after
all the new sections added since. Went further: removed `box-shadow` from
the base rule entirely, now only present inside `.cls-neera-sticky-bar
--visible` — so the property doesn't exist at all while hidden, not just
suppressed via visibility. Pushed to both preview and live, verified
deployed via pull-back. **Still unverified by an actual device test** —
this tooling environment cannot render a true narrow/mobile viewport, so
every fix here is diagnosis-by-elimination from what's in the CSS, not a
confirmed repro. If round 3 doesn't resolve it, next step should be a real
device remote-debugging session or screen recording rather than another
blind CSS guess — three unconfirmed attempts at the same bug is the signal
to change approach, not keep iterating the same way.

## Block 6 comparison table — wider columns (2026-09-11)

Bumped `.cls-neera-comparison__cell--header-col`/`--mark` from `flex: 0 0
56px` to `90px` at desktop only (mobile stays at the literal 56px Figma
spec, which fits fine on a 350px-wide mobile column). Confirmed via
screenshot. Pushed live and verified via pull-back — this round's push had
no flakiness (all settings, including the Reason blocks'
background/image_position, landed correctly on the first live push).

## Block 7 — What's Included + Trust (2026-09-11)

`sections/cls-neera-included.liquid` — blocks-based included-items list
(same accent-bar pattern as Why-Copper's features), single photo
(`assets/neera-complete-set.jpg` — same "complete set" shot also used in
Block 10 per earlier metadata, downloaded/flattened separately per
occurrence like other reused assets), 6 fixed trust-badge text settings
(not blocks, since it's a fixed 2×3 grid — block-based repeatable count
would risk breaking the pairing/geometry). Desktop: text-left/photo-right
(confirmed), but the trust-badge grid doesn't pair with either column, so
it needed a **CSS Grid** (not flex) desktop layout —
`grid-template-areas: "content photo" / "badges badges"` — to let the
badges span full-width beneath both columns while content/photo stay
side-by-side above. First section needing grid instead of the flex
two-column pattern used everywhere else so far. Confirmed via screenshot,
no console errors.

**Revised 2026-09-11** — user wanted the badges grid in the left column
below the text instead, with the photo spanning both rows tall on the
right. Changed `grid-template-areas` to `"content photo" / "badges
photo"` (photo now spans 2 rows via its own grid-area, `align-self:
stretch` fills the combined height). Confirmed via screenshot, pushed
live, verified via pull-back.

## Block 10 — Final CTA + Product Card (2026-09-11)

`sections/cls-neera-final-cta.liquid` — the page's main purchase CTA. Two
functional decisions needed the user's input before building (asked via
AskUserQuestion rather than guessing):
- **CTA link:** real product page, not a placeholder. Found the matching
  product via the storefront's public `/products.json` — handle
  `neera-copper-water-bottle-handcrafted-from-pure-copper`, $59, exact
  price match to the Figma design. Wired both this button's `cta_link` and
  the sticky bar's `button_link` (added earlier, unwired until now) to it.
- **Countdown:** rolling duration per visitor (not a fixed real deadline,
  not static display). Implemented in `assets/neera-advertorial.js`:
  first page load starts a 20-hour (customizer-configurable) countdown
  saved to `localStorage`; a refresh continues the same countdown instead
  of resetting; if a visitor's countdown has already expired, a fresh one
  starts automatically so the timer never freezes at zero for returning
  visitors — confirmed both behaviors (running + persisting across
  reload) via live testing.
- **New color token:** `--cls-neera-urgent-red: #e23300` — used for the
  card headline and countdown numerals specifically; distinct from
  `--cls-neera-accent-red` (#9c3d21, used for the price and CTA button) —
  this is intentional per Figma, two different reds serving different
  roles in the same card, not a mistake to unify.
- **Gotcha:** `url`-type schema settings do **not** support a `"default"`
  key at all — pushing one throws `"default must be a string or
  datasource access path"` and (worse) makes the whole section file
  invalid, cascading into "section type does not refer to an existing
  section file" wherever it's used. For a template-driven section, set the
  real value in the template instance's `"settings"` instead; for a static
  section rendered via `{% section %}` (no template entry to set
  settings on), fall back to a real default in the Liquid `| default:`
  filter itself, not the schema.
- Reused `assets/neera-complete-set.jpg` from Block 7 (same photo, no new
  download needed) with `object-fit: cover` rather than reproducing
  Figma's odd zoomed-crop transform values.
Pushed, verified via template pull-back, full live browser test including
countdown persistence, no console errors.

**Desktop:** user overrode my single-column-centered proposal, wanted
two-column instead — photo left (~50%), card right (~50%, capped at
440px), vertically centered. Confirmed via screenshot. Live push pending.

## Block 8 — Social Proof (2026-09-11)

`sections/cls-neera-reviews.liquid` — blocks-based review cards (rating,
quote, attribution). Desktop: user overrode my 3-column-grid proposal,
wanted all 5 cards in a single centered row instead — implemented via
`flex-direction: row; flex-wrap: nowrap; justify-content: center;` with
each card `flex: 1 1 0` for equal widths, heading centered too. Confirmed
via screenshot, no console errors. Live push pending.

## Block 9 — FAQ accordion (2026-09-11)

`sections/cls-neera-faq.liquid` — native `<details>`/`<summary>` accordion
(matches the established sibling convention from `cleo-faq.liquid`), pure
CSS `+`/`−` icon via `details[open]` selector (no JS needed for that part),
single-open behavior via a small `toggle`-event JS handler.
**Content gap:** only the first FAQ (open by default) has real answer copy
anywhere in the Figma file — the other 6 are questions with no answer text
at all (confirmed via `get_metadata`, not just visually collapsed). Asked
the user rather than inventing safety/authenticity/shipping-policy answers
myself; they chose to leave the other 6 answers empty and
customizer-editable for now. Confirmed via screenshot + manual toggle test
(single-open behavior verified working), no console errors.

**Desktop:** confirmed by user — single centered column, `max-width:
800px` (matches the Comparison Table treatment). Confirmed via screenshot.
Live push pending.

## Footer disclaimer (2026-09-11) — last section, page content complete

`sections/cls-neera-footer.liquid`. Policy links use Shopify's native
`shop.privacy_policy` / `shop.refund_policy` / `shop.shipping_policy` /
`shop.terms_of_service` objects (only rendered `if .url != blank`) rather
than guessing URLs — this store already has all 4 configured, confirmed
real working links on the live page
(`/policies/privacy-policy` etc.). Copyright year uses
`{{ 'now' | date: '%Y' }}` instead of hardcoding "2026" like the literal
Figma text, so it won't go stale — a deliberate small deviation from
literal content fidelity for a maintenance reason, not a content
invention (renders identically to Figma today). Confirmed via screenshot +
link-href check, no console errors. Live push pending.

**All 12 page sections are now built** (top bar, sticky bar, Hero, Problem,
Why Copper, Ten Reasons opener + 10 Reason blocks, How to Use, Comparison
Table, Included + Trust, Final CTA, Social Proof, FAQ, Footer). Remaining
work going forward is fixes/adjustments the user asks for, not new
sections.

## Left-edge shadow — actual root cause found, round 4 (2026-09-11)

Reported a 4th time after round 3's sticky-bar fix. Per my own round-3
note ("three unconfirmed attempts... is the signal to change approach"),
stopped guessing at the sticky bar and re-investigated from scratch by
querying the live DOM directly for any `position: fixed` element with a
non-none `box-shadow`, regardless of source. Found the actual cause
immediately: **`#aa-cc-left-drawer-menu`**, a drawer panel belonging to a
third-party "Accessibility Assistant" app installed on this store (same
app whose icon/color-picker shadows were noticed and correctly dismissed
much earlier). When closed, the drawer sits parked at `left: -353px`
(exactly its own width, `aria-hidden="true"`) — but its own `box-shadow:
0 0 15px rgba(0,0,0,0.4)` isn't clipped by anything, so the shadow's blur
radius bleeds ~15px past the drawer's right edge, landing exactly at the
visible viewport's left edge. This is completely unrelated to the sticky
bar, or to any of our own sections — the earlier misdiagnosis wasted two
fix attempts (rounds 2 and 3) because I never actually queried the DOM for
*all* fixed+shadowed elements, only checked the ones already in our own
CSS. **Fixed** by neutralizing the shadow in `neera-advertorial.css`
scoped to the drawer's specific id + closed state only (`#aa-cc-left
-drawer-menu[aria-hidden='true'] { box-shadow: none; }`), so it still
looks correct if a visitor actually opens the accessibility menu. This
only affects pages using our isolated layout (the override lives in our
own stylesheet, which doesn't load on the rest of the site). Verified via
live DOM inspection (computed `box-shadow` now `none` while closed, and a
full re-scan for any other fixed+shadowed element on the page came back
empty) — the strongest confirmation this specific bug has had across all
4 rounds, even though still not a physical-device test.
**Lesson for next time a "some fixed shadow somewhere" bug is reported:
query the DOM directly for every `position:fixed` element with a
box-shadow FIRST, before touching any of our own CSS** — this finds the
real culprit in one query instead of iterating blindly on the one
plausible-looking candidate already in view.

## Accessibility Assistant footer link (2026-09-11)

Added to `sections/cls-neera-footer.liquid`, next to the policy links, per
user request. Found the exact trigger mechanism by inspecting the main
site's own footer rather than guessing: `<a href="#add-aacc-link"
class="link-faded">Accessibility Assistant</a>` — the third-party
accessibility app's script listens for that specific hash and intercepts
it to open its panel (not a real page navigation). Replicated the same
`href="#add-aacc-link"` in our footer, styled with our own existing
`.cls-neera-footer__meta a` link style. Confirmed by actually clicking it
— the Accessibility Assistant panel opened correctly. Customizer-editable
(show/hide checkbox + label text). No console errors. Pushed live and
verified via pull-back.

## Fallback images made responsive (2026-09-11)

User asked why the fallback (my Figma-downloaded) images weren't
responsively sized like customizer-uploaded images are — real gap: the
fallback `<img>` tags used a bare `asset_url` (always serves the full
static file, no resizing) while the customizer-image path already used
`image_url` + `srcset` (Shopify CDN resizing). Fixed by pre-generating
`-450`/`-900` width variants of every fallback photo (`sips -Z`, same
~82% JPEG quality as the originals) and adding matching `srcset`/`sizes`
to the fallback `<img>` in every section that has one (Hero photo + Hero
avatar, Problem, Why-Copper, the reusable Reason section, How-to-Use,
Included, Final CTA — 7 files, 8 `<img>` tags). Avatar is a fixed 75px
circle regardless of viewport, so it just got one `-150` variant as its
sole `src` rather than a full `srcset`.
**Naming convention for anyone adding a new fallback image going
forward:** generate `<name>-450.jpg` and `<name>-900.jpg` alongside the
full-size `<name>.jpg`, and build the `srcset` via
`{{ section.settings.X_fallback | replace: '.jpg', '-450.jpg' | asset_url }}`
(string substitution on the raw filename *before* calling `asset_url`, not
on its already-versioned CDN output) — mirrors the pattern now used
everywhere in this project.
**Result:** full-page mobile image weight dropped from ~4.5MB to ~712KB
(~84% smaller) since phones now download the 450w tier instead of the
full 1050–1280px originals. Verified via live testing: correct `srcset`
resolution confirmed via `currentSrc`, all 19 images on the page load
successfully with zero broken images (forced every lazy image to load via
JS rather than relying on scroll simulation), no new console errors. Live
push pending.

## Status

**Everything is live on theme `150169321659` and verified via direct
pull-back as of 2026-09-11 — the full page is complete:** Top bar, sticky
bar, Hero, Block 2 (The Problem), Block 3 (Why Copper), Block 4 opener,
all 10 Reason blocks (zigzag layout + alternating backgrounds), Block 5
(How to Use), Block 6 (Comparison Table), Block 7 (What's Included +
Trust), Block 10 (Final CTA + Product Card, with working countdown + CTA
links), Block 8 (Social Proof), Block 9 (FAQ accordion), Footer
disclaimer (incl. the Accessibility Assistant link), and the left-edge
shadow fix (actual root cause found and fixed — the third-party
accessibility app's own drawer, see above; still not confirmed on a
physical device, but strongly evidenced this time via live DOM
inspection). Preview theme `151103340731` stays in sync too.

Note: `theme push --live` is blocked by the Claude Code permission
classifier *inconsistently* — try it directly first, and only fall back to
asking the user to run it themselves (`! shopify theme push --live
--allow-live --store neera-living.myshopify.com`) if actually denied.
After any push that changes `templates/page.neera-advertorial.json`
settings values specifically, verify by pulling the file back down rather
than trusting the push success message (has been flaky twice).

**Remaining sections not yet built:** Footer disclaimer.

---

# Copper Bottles Cut Open advertorial — build conventions

A second, fully isolated advertorial landing page on the same store
(**neera-living.myshopify.com**), separate from the `neera-advertorial`
project documented above — own layout, own template, own prefix, own
CSS/JS. Nothing here touches or reuses `neera-advertorial`'s files beyond
two genuinely shared theme snippets (see below). Same working style as the
rest of this line of advertorial projects: phased, section-by-section,
stop and wait for confirmation after each section, no unsolicited
additions.

Design source: Figma — a different file from `neera-advertorial`'s —
fileKey `OUgtWs66J8luxTHB3XXkYS`
(https://www.figma.com/design/OUgtWs66J8luxTHB3XXkYS/Neera-Living-Adv--Copy-),
frame `80:4` "Advertorial — Teardown · Mobile 390" (390px wide, 1:1 real
mobile scale, confirmed via `get_metadata` — same convention as the sibling
project: use Figma values directly as mobile CSS px, no division). Content
follows an investigative "I cut open 10 copper bottles" teardown format.
Figma access for this project required authorizing the remote
`plugin:figma:figma` MCP server via OAuth (the local Dev Mode MCP server
used on the sibling project wasn't connected this session).

## Class prefix

**`cls-coppercutopen-`** — every class in every section/CSS/JS file on this
page is scoped under this prefix, per the user's explicit instruction.

## Files

- `layout/copper-bottles-cut-open.liquid` — standalone layout, no
  dependency on `theme.liquid`. Own `<head>`, loads Google Fonts (only the
  weights actually used by built sections so far — extend as new sections
  need more), `copper-bottles-cut-open.css`, `copper-bottles-cut-open.js`.
  Shares only `snippets/theme-favicon.liquid` (favicon_set `'neera-living'`,
  already existed, reused as-is) and `snippets/theme-styles-variables.liquid`
  (generic Horizon CSS custom properties) from the shared theme — not
  `assets/cleo-theme.css`, which is `neera-advertorial`'s own token set, to
  keep this project's isolation clean.
- `templates/page.copper-bottles-cut-open.json` — dedicated page template.
  **Gotcha confirmed here:** Shopify rejects a template whose `"order"`
  array is empty (`"order: can't be blank"`, confirmed via an actual failed
  `theme push`) — a template can't be pushed/previewed until it has at
  least one real section in `order`. The sticky bar doesn't count (it's
  global chrome rendered directly from the layout via `{% section %}`, not
  a template entry), so the results table had to be built and added to
  `order` before either section could be previewed live.
- `sections/copper-bottles-cut-open-{section-name}.liquid` — one file per
  section. Content is schema-driven via `settings`/`blocks`, editable in
  the customizer, per the brief. CTA buttons use `url`-type settings (no
  `"default"` key in the schema — confirmed via the sibling project's own
  gotcha that a `url` setting's schema `"default"` is invalid and breaks
  the whole section file; use Liquid's `| default:` filter in the markup
  instead).
- `assets/copper-bottles-cut-open.css` / `assets/copper-bottles-cut-open.js`
  — single shared stylesheet/script for the whole page, loaded once from
  the layout.

## Rules

- **Mobile-first CSS**, single breakpoint `@media (min-width: 768px)` —
  same convention as `neera-advertorial`.
- Every class prefixed `cls-coppercutopen-*`.
- Content fidelity: copy pulled verbatim from Figma via `get_design_context`
  (including quote-mark styling, e.g. curly quotes on 9 of the 10 results-
  table rows but not row 10, which is a fact statement, not a claim — matches
  Figma exactly, not a typo).
- Read a file before editing it. Template JSON edits preserve `block_order`
  and existing settings byte-for-byte.
- No unsolicited additions — build exactly the section handed over, stop
  and show the diff before starting the next one.
- Self-verify each section on the preview theme (Chrome MCP) before
  presenting it.

## Mobile responsiveness checklist (carried over from sibling projects)

Same recurring-fixes list as `neera-advertorial`'s (see above) applies here
too — apply proactively rather than rediscovering via feedback. Notably
used so far:
- Fixed/sticky bottom bars: `visibility: hidden` + `transform` (not
  transform alone) while hidden, plus
  `padding-bottom: calc(<val> + env(safe-area-inset-bottom))`.
- Horizontally-scrollable tables: `overflow-x: auto` +
  `-webkit-overflow-scrolling: touch` on a wrapper, `table-layout: fixed` +
  an explicit `min-width` on the table itself so columns never shrink below
  their natural Figma widths.

## Build log

- **Layout scaffold + Sticky bar — done 2026-09-21.** Created
  `layout/copper-bottles-cut-open.liquid`,
  `templates/page.copper-bottles-cut-open.json` (initially empty `order`,
  see gotcha above),
  `sections/copper-bottles-cut-open-sticky-bar.liquid`,
  `assets/copper-bottles-cut-open.css`, `assets/copper-bottles-cut-open.js`.
  Sticky bar (Figma node `85:27`) is global chrome rendered directly from
  the layout, not a template entry — mirrors `neera-advertorial`'s sticky
  bar pattern exactly.
  - **Trigger block resolved by inference, not a literal Figma match:** the
    node's own layer name is "Sticky bar — appears from Block 12 onward
    only", but no frame in the file is literally named "BLOCK 12". The
    page's real block sequence runs ...BLOCK 11 ("What the $30 Actually
    Buys", node `84:73`) → a nested frame `120:2` labeled "BLOCK 10 — Final
    CTA + Product Card" (reused/leftover numbering from the sibling
    project's own "Block 10" Final CTA node, same class of mislabeling
    documented there) → BLOCK 13 (FAQ). The sequential gap between 11 and
    13 is exactly one block, so "Block 12" is almost certainly this Final
    CTA + Product Card node. **Not yet built or confirmed** — the sticky
    bar's JS (`assets/copper-bottles-cut-open.js`) watches
    `[data-cls-coppercutopen-sticky-trigger]` via `IntersectionObserver`
    and no-ops (guard clause) until that attribute exists in the DOM.
    **When the Final CTA + Product Card section is eventually built, add
    `data-cls-coppercutopen-sticky-trigger` to its outer wrapper** — this
    is the one remaining piece needed to make the sticky bar actually
    appear on scroll.
  - Button label/URL are section settings (`button_label` default
    "CHECK AVAILABILITY 👉" — emoji is literal Figma content, not a CSS
    icon; `button_url`, no schema default per the `url`-type gotcha above).
    Colors pulled via `get_variable_defs` on node `85:27`: bar background
    `color/cream` = `#ffffff` (distinct from `neera-advertorial`'s own
    `--cls-neera-cream` `#faf6ef` — different design system, don't conflate).
    Button `#ffd000`, 44px tall, 296px wide (`max-width: 100%` fallback per
    the mobile-responsiveness checklist), 8px radius, Instrument Sans
    SemiBold 17px/20px/0.2px tracking, `text-transform: uppercase`.
  - Self-verified on preview theme `151103340731`: bar exists in DOM,
    correctly hidden (`visibility: hidden`, `translateY` off-screen) since
    its trigger doesn't exist yet; button text/href/background all correct;
    no console errors attributable to this project's files (one
    pre-existing unrelated JSON-parse exception on the page, same signature
    already documented as pre-existing noise in the sibling project).

- **Results table ("All Ten Results") — done 2026-09-21.** Created
  `sections/copper-bottles-cut-open-results-table.liquid` from Figma node
  `104:32` (the 641px-wide reference version the user linked directly;
  confirmed the in-page mobile node `82:2`/`83:x` uses the *same* literal
  column widths, i.e. the design is already built to overflow past 390px
  and require horizontal scroll on mobile by design, not a mistake to
  scale down). Real `<table>` markup (not a div-grid), `table-layout:
  fixed` with explicit per-column widths matching Figma exactly (30 / 56 /
  190 / 96 / 74 / 170px) wrapped in an `overflow-x: auto` scroll container,
  `min-width: 720px` on the table so columns never shrink. All 10 rows are
  a repeating `row` block (number, paid, listing_claimed, magnet, interior,
  lab_result, highlight checkbox) — added as explicit template-JSON block
  entries (not relying on presets, per the sibling project's own gotcha
  about template-JSON sections not inheriting preset blocks). Row 10 is
  the only row with `highlight: true` (2px top/bottom rule + `rgba(0, 0,
  0, 0.08)` background, exact Figma value). Mobile-only "Swipe to see more
  →" hint text (`display: none` at `≥768px`) — the text-hint option from
  the two offered, not a gradient fade. Block label setting added per the
  user's explicit ask even though it doesn't render by default (Figma's
  "BLOCK 4 —" text is a dev-mode frame-name annotation, not a real content
  node in `104:32` — confirmed via `get_design_context`, so it stays
  blank/hidden unless a merchant fills it in). Footer note paragraph
  ("Bottle 10 is the expensive one...") included even though not itemized
  in the user's numbered spec, since it's real visible content inside the
  linked Figma node itself — pulled verbatim as a `footer_note` setting.
  This section is the template's first (and currently only) `order` entry,
  which is what made the template pushable at all (see the empty-`order`
  gotcha above).
  - Self-verified on preview theme `151103340731` at desktop width: all 6
    columns render correctly with real Figma copy (including the curly-
    quote vs. no-quote distinction on row 10), row 10 highlight background
    confirmed via computed style (`rgba(0, 0, 0, 0.08)`), scroll container
    `overflow-x: auto` + table `min-width: 720px` confirmed via computed
    style, swipe hint correctly hidden at desktop width. Narrow/mobile-
    width scroll behavior itself not physically verified — same
    `resize_window` limitation documented in the sibling project's own
    MEMORY.md (doesn't produce a true narrow viewport in this environment)
    applies here too.

## Status

Two sections built and self-verified on preview theme `151103340731`:
Sticky bar (visible-on-trigger logic in place but inert until the Final
CTA + Product Card section adds its trigger marker) and the Results table.
Live push not yet done — preview only so far. Remaining sections: everything
else in the teardown format (magnet test, cut-open comparison, lab results,
cost breakdown, self-check checklist, FAQ, sponsored-content disclosure,
countdown-timer CTA banner) — to be handed over section by section per the
user's stated workflow.
