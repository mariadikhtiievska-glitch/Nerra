# Deployment workflow — read before touching any Shopify theme file

This repo is connected to Shopify via the **GitHub integration**, which
auto-syncs on every push — but **only to two unpublished mirror themes**,
never directly to the actual live/published theme:

- `dev` branch → unpublished theme **"Nerra/dev"** (`#151435509947`), used
  for testing before anything reaches customers.
- `main` branch → unpublished theme **"Nerra/main"** (`#151433609403`).
- The actual **live theme** — **"10-08 of BKP Neera Living - Vikrant Dev"**
  (`#150169321659`) — is a *separate* theme on `neera-living.myshopify.com`
  and is **not** kept in sync automatically by pushing to `main`.
  **Confirmed 2026-09-21** by pulling both themes' files directly after a
  `main` push: "Nerra/main" had the new content immediately, the actual
  live theme did not, even after ~40s. Making a merge-to-`main` actually
  reach customers requires a **manual publish** in Shopify Admin (Online
  Store → Themes → publish "Nerra/main"), or someone explicitly asking for
  that theme to be published — never assume a `main` push alone means the
  storefront changed.

## Standing rule: never `shopify theme push` directly

**Do not use `shopify theme push` (with or without `--live`) to deploy code
changes.** All code changes must go through git:

1. Make the change locally.
2. Commit it with a descriptive message.
3. Push to `dev` (or a feature branch merged into `dev`). The GitHub
   integration syncs this to the **Nerra/dev** theme automatically —
   no manual push needed, and none should be run.
4. Test the change on the Nerra/dev theme/preview.
5. Once confirmed working, merge `dev` into `main` (a real `git merge`, or
   a pull request) and push. The GitHub integration syncs this to the
   **Nerra/main** theme automatically — **this is still a staging/mirror
   theme, not the live site.** Getting it in front of customers is a
   separate, explicit step: publishing "Nerra/main" in Shopify Admin. Ask
   the user before doing that (or tell them it's ready for them to
   publish) — don't treat a `main` push as equivalent to going live.

`shopify theme pull`/`push` at the CLI is still fine for **read-only
diagnostics** (e.g. `theme pull --only <file>` into a scratch dir to check
what's actually live) or for the occasional full `theme pull` to
re-sync `main` with genuine live-theme drift (other staff edits, app
installs, etc.) — but that pulled result must still be committed and
pushed through git like any other change, never left as an uncommitted
local-only sync.

## Why

Established 2026-09-21 after a session that had been using `shopify theme
push --live` directly from the CLI to deploy — which works, but bypasses
git entirely as the source of truth and risks the local repo and the live
theme silently drifting apart (a real risk already documented in this
project's `MEMORY.md`: a `theme push` has previously reported success while
failing to actually persist settings-level changes server-side). Routing
everything through git + the GitHub integration's dev-theme-first flow
means every live change has a corresponding tested, reviewable commit.
