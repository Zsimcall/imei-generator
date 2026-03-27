# Current State

**Last updated:** 2026-03-27

---

## Deploy Status

| Item | Status |
|---|---|
| GitHub Actions deploy | Working (as of 2026-03-27) |
| Cloudflare auto-build | **Potentially active** — may be running in parallel with GitHub Actions and failing (see Open Issues) |
| Worker name | `imei-generator` |
| D1 database | `imei-generator-db` (ID: `90f3dbb2-0c2d-4aeb-a5ca-ed5bec51f1b2`) |

---

## Recently Completed

- **2026-03-27** — Fixed broken deploy. Added `src/worker.js` as proper Workers entry point. Fixed `wrangler pages functions build` misuse. Added `npm run build/deploy` scripts. See `agent/decisions.md` → Decision #3.

---

## In Progress

_Nothing actively in progress._

---

## Open Issues

### HIGH — Duplicate deploy pipeline
The Cloudflare dashboard has an auto-build configured (build command: `npx wrangler deploy`) that runs independently of GitHub Actions. It was failing because it skips the `npm run build` step that creates `dist/`. The latest fix added `npm run deploy` which includes the build step — but the Cloudflare Pages auto-build needs to be updated in the Cloudflare dashboard to run `npm run deploy` instead of `npx wrangler deploy`.

**Action needed:** In Cloudflare dashboard → Workers & Pages → `imei-generator` → Settings → Build → change deploy command from `npx wrangler deploy` to `npm run deploy`.

Alternatively, disable the Cloudflare auto-build entirely since GitHub Actions handles it.

### LOW — No .gitignore
`node_modules/`, `dist/`, and other build artifacts are not explicitly ignored. A `.gitignore` exists in the repo now (added 2026-03-27) but verify it's doing the right thing.

### LOW — Potential XSS in TAC Manager tab
The TAC table renders user-provided `brand` and `model` values via string interpolation into innerHTML. If a user enters HTML in these fields, it renders. Low risk (internal tool, no multi-user), but worth noting.

### LOW — Sequential IMEI increment of 350
The magic number 350 in `generateSequential()` is undocumented. Do not change without understanding the intent (likely spread across the IMEI space to avoid clustering).

---

## Schema Version

No explicit versioning. Current schema defined in `schema.sql`. Last structural change: added `is5g` and `has_physical_sim` columns to `imei_history`.

To apply schema to local D1:
```bash
npx wrangler d1 execute imei-generator-db --local --file=schema.sql
```

To apply to production D1, use the MCP tool `d1_database_query` or run:
```bash
npx wrangler d1 execute imei-generator-db --file=schema.sql
```

---

## How to Update This File

- At the start of a session: check that the state still reflects reality.
- At the end of a session: move completed items to "Recently Completed", update "In Progress", add any new open issues.
- After a deploy: update "Deploy Status".
- After a schema change: update "Schema Version".
