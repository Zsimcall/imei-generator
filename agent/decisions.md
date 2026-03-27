# Decision Log

Decisions recorded here are ones that are **non-obvious from the code** and where knowing the "why" prevents future regressions or wasted effort. Trivial choices are not logged.

---

## D1: TAC Delta System

**Decision:** Keep `tac-database.json` as an immutable static file. Store only user-driven changes (additions, removals) in D1 tables (`tac_additions`, `tac_removals`). Merge at frontend startup via `applyTacDeltas()`.

**Why:** The base TAC database is 587 KB and 7,563 entries. Putting it all in D1 would mean bulk importing on every schema change and querying thousands of rows on page load. The JSON is already served as a static asset by Cloudflare's edge. Only the delta (a handful of rows) needs D1.

**Consequence:** `tac-database.json` is the source of truth for the base set. To update the base TAC list (e.g., add new device models from an external source), you update the JSON and redeploy — not D1. D1 only holds user customizations.

**Do not change without:** Understanding that the frontend `init()` function fetches the JSON first, then applies deltas. If the delta system is changed, `applyTacDeltas()` in `index.html` must be updated in sync with the API.

---

## Architecture: Single HTML File Frontend

**Decision:** The entire frontend (HTML, CSS, JavaScript) lives in `index.html`. No build step, no bundler, no framework.

**Why:** This is a single-developer internal tool. Zero frontend toolchain = zero frontend build complexity. Wrangler serves `index.html` as a static asset. Changes to the frontend are one-file edits with immediate effect after deploy.

**Consequence:** The file is ~700 lines. If it grows significantly (>1500 lines), consider splitting CSS/JS into separate static files in `dist/` and adjusting the build step to copy them. For now, keep everything in `index.html`.

---

## Deploy: Pages → Workers Migration

**Decision:** Migrated from Cloudflare Pages to Cloudflare Workers (with static asset serving).

**Why:** The project started on Pages, but Cloudflare Pages auto-build behavior was unpredictable — the platform was running its own deploy in parallel with GitHub Actions, and the build commands didn't properly sequence. Workers gives explicit control: `npm run deploy` always runs `npm run build` first (creates `dist/`) then `wrangler deploy`. No hidden platform behavior.

**What changed:**
1. Added `src/worker.js` — a proper Workers `fetch` handler that routes `/api/*` requests and falls through to `env.ASSETS` for static files.
2. `functions/api/*.js` still use Pages Functions conventions (`onRequestGet`, etc.) but are now **imported as modules** by `src/worker.js`. They are NOT invoked by any Cloudflare platform routing — only by the worker.
3. `wrangler.jsonc` now points `main` at `src/worker.js` (previously tried to point at `dist/_worker.js` which was a build artifact that was never correctly created).
4. Removed `wrangler pages functions build` from the deploy pipeline.

**Do not revert** to Cloudflare Pages without removing `src/worker.js` and switching back to `wrangler pages deploy`.

---

## Database: NULL vs 0 for Unknown Boolean Fields

**Decision:** `is5g` and `has_physical_sim` in `imei_history` use `NULL` for "unknown", `1` for true, `0` for false. Same in `tac_additions` but defaults to `0` instead of `NULL`.

**Why:** Base TAC entries in `tac-database.json` don't have 5G/SIM data. When an IMEI is generated from a base TAC entry, these fields should be `NULL` (unknown), not `false`. User-added TAC entries explicitly set these values.

**Frontend:** `capDisplay(val)` converts: `true` → "Yes", `false` → "No", `null/undefined` → "Unknown".

**API:** POST to `/api/history` normalizes: `true` → `1`, `false` → `0`, anything else → `null`.

---

## IMEI Generation: Sequential Increment of 350

**Decision:** Sequential IMEI generation increments the serial portion by 350 per step (not 1).

**Why:** Avoids generating a dense sequential block of IMEIs that would look suspicious or clustered in carrier systems. 350 provides sufficient spread while remaining deterministic from a starting point. This is a UX/operational choice, not a spec requirement.

**Do not change** without the owner's explicit approval.

---

## Build: dist/ Not Tracked in Git

**Decision:** `dist/` is a build artifact created by `npm run build`. It is not committed to git.

**Why:** `dist/` contains copies of files that already exist at the repo root (`index.html`, `tac-database.json`). Committing copies creates sync drift. The build step is fast (two file copies) and runs automatically before deploy.

**Consequence:** `wrangler dev` locally requires `npm run build` first, or the asset directory won't exist. (`wrangler dev` will error: "assets directory does not exist".)
