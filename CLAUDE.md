# Deployment workflow — read before touching any Shopify theme file

This repo is connected to Shopify via the **GitHub integration**, which
auto-syncs on every push:

- `dev` branch → unpublished theme **"Nerra/dev"** (`#151435509947`), used
  for testing before anything reaches customers.
- `main` branch → **"Nerra/main"** (`#151433609403`) — **this is the live,
  published theme.** A push to `main` reaches the storefront within about a
  minute, with no further publish step. Confirmed 2026-09-24 via
  `shopify theme list` (Nerra/main `[live]`) and by pulling files back from
  it after a `main` push.
- **"10-08 of BKP Neera Living - Vikrant Dev"** (`#150169321659`) — the
  previous live theme — is now **unpublished**. Nothing syncs to it; don't
  deploy to it.

Treat every push to `main` as a live deploy: only merge `dev` into `main`
when the user asks for it.

## Standing rule: never `shopify theme push` directly

**Do not use `shopify theme push` (with or without `--live`) to deploy code
changes.** All code changes must go through git:

1. Make the change locally.
2. Commit it with a descriptive message.
3. Push to `dev` (or a feature branch merged into `dev`). The GitHub
   integration syncs this to the **Nerra/dev** theme automatically —
   no manual push needed, and none should be run.
4. Test the change on the Nerra/dev theme/preview.
5. Once confirmed working **and the user asks to go live**, merge `dev`
   into `main` (a real `git merge`, or a pull request) and push. The
   GitHub integration syncs this to **Nerra/main — the live theme** —
   automatically. Afterwards, verify the deploy by pulling the changed
   files back from theme `#151433609403` into a scratch dir and comparing
   them with the repo (a successful push is not proof of a successful
   sync).

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
