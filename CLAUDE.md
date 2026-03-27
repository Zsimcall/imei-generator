# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Agent sessions:** Read `agent/BOOTSTRAP.md` first for orientation, then `agent/state.md` for current work. This file covers architecture detail.

## Deployment

**Production:** Cloudflare Workers — deployed automatically via GitHub Actions on every push to `main`.
- Workflow: `.github/workflows/deploy.yml`
- Requires GitHub secret: `CLOUDFLARE_API_TOKEN`
- Cloudflare account ID: `5313f8b98e20a8915418b2683ad7278c`
- Worker name: `imei-generator`

**Database:** Cloudflare D1 (SQLite)
- Database name: `imei-generator-db`
- Database ID: `90f3dbb2-0c2d-4aeb-a5ca-ed5bec51f1b2`
- Binding: `DB` (configured in `wrangler.jsonc`)
- Schema: `schema.sql`

**Build process** (runs in GitHub Actions):
```bash
mkdir -p dist
cp index.html tac-database.json dist/
npx wrangler pages functions build --outdir=./dist/_worker.js/
npx wrangler deploy
```

## Local Development

```bash
npm install
npx wrangler dev
```

D1 is available locally via wrangler's local SQLite emulation. To seed the local DB:
```bash
npx wrangler d1 execute imei-generator-db --local --file=schema.sql
```

## Architecture

```
index.html          — entire frontend (HTML + inline CSS + inline JS)
tac-database.json   — 7,563 TAC entries: { "12345678": { brand, model } }
functions/api/
  history.js        — GET/POST/DELETE /api/history
  clients.js        — GET/POST /api/clients
  tac.js            — GET/POST /api/tac (add/remove TAC entries)
schema.sql          — D1 table definitions
wrangler.jsonc      — Workers config: assets, D1 binding, functions entry point
```

## Database Tables

| Table | Purpose |
|---|---|
| `imei_history` | All generated IMEIs: imei, tac, serial, brand, model, client, timestamp, is5g, has_physical_sim |
| `clients` | Saved client names (unique, alpha-sorted) |
| `tac_additions` | User-added TAC entries with is5g / has_physical_sim flags |
| `tac_removals` | TAC codes removed from the base JSON |

`is5g` and `has_physical_sim` store `1`/`0`/`NULL` (NULL = unknown, base JSON entries default to NULL).

## Frontend Architecture

Three-tab UI: **Generator**, **TAC Manager**, **History**.

All data is fetched from `/api/*` on page load. Key global state:
- `tacDatabase` — merged TAC map (base JSON + additions − removals), with `is5g`/`hasPhysicalSim` fields
- `historySet` — `Set<string>` of all previously generated IMEIs (for duplicate prevention)
- `savedClients` — array of client name strings
- `generatedImeis` — current batch, committed to DB via the assignment bar

### IMEI Generation

An IMEI is 15 digits: `[TAC (8)] + [Serial (6)] + [Check digit (1)]`.

Two modes (mutually exclusive based on whether a starting IMEI is entered):
1. **Sequential** — increments the starting IMEI by 350 per step, recomputes Luhn check digit
2. **Random TAC** — picks a random TAC from the filtered set, random 6-digit serial, appends Luhn check digit

Luhn: `calculateCheckDigit(imei14)` / `isValidIMEI(imei15)`.

After generation, an assignment bar prompts for a client name. Both "Assign" and "Skip" commit the batch to `imei_history` via `POST /api/history` — no IMEI escapes tracking. `historySet` is updated in memory so duplicates are skipped in future generations without a DB round-trip.

### TAC Delta System

Base `tac-database.json` is static. User changes are stored in D1:
- `tac_additions` → merged over base on init
- `tac_removals` → deleted from base on init

`applyTacDeltas(baseData, additions, removals)` performs the merge in memory at startup.
