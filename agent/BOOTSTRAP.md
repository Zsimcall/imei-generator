# Agent Bootstrap — IMEI Generator

**Read this first in every new session.**
After reading this, read `CLAUDE.md` for architecture detail, then `agent/state.md` for current work.

---

## What This Project Is

A web tool for generating valid IMEIs in bulk, tracking them in a database, and managing device TAC codes. Single owner/developer. No users in the traditional sense — this is an internal tool.

**Live URL:** Deployed to Cloudflare Workers (worker name: `imei-generator`)
**Repo:** `Zsimcall/imei-generator` on GitHub

---

## Stack (30-second summary)

| Layer | Tech |
|---|---|
| Frontend | `index.html` — single file, inline JS + CSS, no build step |
| Backend | Cloudflare Workers (`src/worker.js` routes to `functions/api/*.js`) |
| Database | Cloudflare D1 (SQLite), binding name `DB` |
| Static data | `tac-database.json` — 7,563 TAC entries, never modified at runtime |
| Deploy | GitHub Actions → `npm run deploy` → `wrangler deploy` |

---

## Most Important Things to Know

1. **`functions/api/*.js` use Pages Functions conventions** (`onRequestGet`, etc.) but are imported and called by `src/worker.js`, which is the actual Workers entry point. Do not confuse the two systems.

2. **The TAC delta system is the core data design.** `tac-database.json` is immutable. Runtime changes (add/remove TACs) live in D1 (`tac_additions`, `tac_removals`). The frontend merges them on load. Do not alter this pattern without reading `agent/decisions.md` first.

3. **`dist/` is a build artifact, not tracked in git.** `npm run build` creates it by copying `index.html` + `tac-database.json`. Wrangler serves assets from it.

4. **There is no test suite.** Validation is manual. Be extra careful when changing IMEI generation logic or schema.

5. **IMEI uniqueness is enforced at the DB level** (`UNIQUE` constraint on `imei_history.imei`). Duplicates are silently skipped via `INSERT OR IGNORE`. This is intentional.

6. **The project recently migrated from Cloudflare Pages to Workers.** See `agent/decisions.md` for why. The `functions/api/` directory structure is a Pages holdover kept for code organization.

---

## Orient in < 2 Minutes

```
CLAUDE.md          → architecture, DB schema, API routes, frontend logic
agent/state.md     → what's in progress, open issues, current deploy status
agent/decisions.md → why things are built the way they are
agent/constraints.md → what not to touch without caution
agent/workflows.md → step-by-step procedures for common tasks
```

---

## Session Maintenance Protocol

See `agent/state.md` for what to update each session.
See `agent/MAINTENANCE.md` for when to update which file.
