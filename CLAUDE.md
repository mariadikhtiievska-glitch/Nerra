# Deployment workflow — read before touching any Shopify theme file

This repo is connected to Shopify via the **GitHub integration**, which
auto-syncs on every push:

- `main` branch → live theme **"10-08 of BKP Neera Living - Vikrant Dev"**
  (`#150169321659`) on `neera-living.myshopify.com`.
- `dev` branch → unpublished theme **"Nerra/dev"** (`#151435509947`) on the
  same store, used for testing before anything reaches customers.
- There is also an unpublished **"Nerra/main"** theme (`#151433609403`),
  the GitHub integration's own preview mirror of `main` — separate from the
  live theme itself.

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
   **live theme** automatically.

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
