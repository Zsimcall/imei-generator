# Workflows

Step-by-step procedures for common tasks. Follow these to avoid making mistakes on known tricky operations.

---

## Deploy

```bash
# Full deploy (build + deploy):
npm run deploy

# What it does:
#   1. mkdir -p dist && cp index.html tac-database.json dist/
#   2. npx wrangler deploy
```

**Deployed automatically** on every push to `main` via GitHub Actions (`.github/workflows/deploy.yml`).

**Manual deploy** (from local machine):
```bash
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=5313f8b98e20a8915418b2683ad7278c npm run deploy
```

**If deploy fails:**
1. Check that `dist/` was created (run `npm run build` manually and verify files exist)
2. Check that `CLOUDFLARE_API_TOKEN` secret is set in GitHub repo settings
3. Check Cloudflare dashboard for duplicate auto-build competing with GitHub Actions (see `agent/state.md` → Open Issues)

---

## Local Development

```bash
npm install
npm run build          # creates dist/ with index.html + tac-database.json
npx wrangler dev       # runs worker + D1 locally at http://localhost:8787
```

**Seed local D1 on first run:**
```bash
npx wrangler d1 execute imei-generator-db --local --file=schema.sql
```

**Note:** Local wrangler dev uses a local SQLite file for D1 — it is not the production database.

---

## Schema Change

When adding a column, table, or index to the database:

1. **Update `schema.sql`** — add the change at the bottom using `ALTER TABLE` or as a new `CREATE TABLE`. Keep the base table definitions intact.
2. **Update the relevant API handler** in `functions/api/` to use the new column.
3. **Apply to local D1** for testing:
   ```bash
   npx wrangler d1 execute imei-generator-db --local --file=schema.sql
   ```
4. **Test locally** with `npx wrangler dev`.
5. **Apply to production D1**:
   ```bash
   npx wrangler d1 execute imei-generator-db --file=schema.sql
   ```
   Or use the MCP tool `d1_database_query` with the SQL statement directly.
6. **Deploy** the code change: push to `main` or `npm run deploy`.

**Warning:** D1 does not run `schema.sql` automatically on deploy. Schema changes and code changes must be applied separately and in the right order (schema first, then code).

---

## Adding a New API Endpoint

1. Create (or add to) a handler file in `functions/api/`.
2. Export `onRequestGet`, `onRequestPost`, etc. following the existing pattern.
3. Add the route in `src/worker.js`:
   ```js
   if (path === '/api/newroute') {
     if (method === 'OPTIONS') return newhandler.onRequestOptions(context);
     if (method === 'GET') return newhandler.onRequestGet(context);
   }
   ```
4. Import the handler at the top of `src/worker.js`.
5. If the endpoint needs a new DB table, follow the Schema Change workflow first.

---

## Updating the Base TAC Database

The base TAC list in `tac-database.json` is updated by directly editing the file (or replacing it with a newer dataset). It is not modified via the app's TAC Manager — that only manages user deltas.

1. Replace or edit `tac-database.json` with the new data.
2. Verify the format: `{ "XXXXXXXX": { "brand": "...", "model": "..." }, ... }` — 8-digit TAC keys.
3. Deploy (the file gets copied to `dist/` and served as a static asset).

**Note:** Existing `tac_additions` in D1 override base entries for the same TAC code. Existing `tac_removals` hide base entries. This means updating the base JSON will not override user additions/removals — the delta system takes precedence.

---

## Debugging API Errors

1. **Check the Worker logs** in Cloudflare dashboard → Workers → `imei-generator` → Logs.
2. **Test locally** with `npx wrangler dev` and call the endpoint directly:
   ```bash
   curl http://localhost:8787/api/history
   curl -X POST http://localhost:8787/api/history -H 'Content-Type: application/json' -d '[...]'
   ```
3. **Check D1 data** via MCP tool `d1_database_query` or:
   ```bash
   npx wrangler d1 execute imei-generator-db --local --command="SELECT * FROM imei_history LIMIT 5"
   ```
4. **Verify routing** — if getting 404 or empty response, check `src/worker.js` path matching. Paths are exact string matches (no trailing slash tolerance, no wildcard).

---

## Querying Production D1

Via MCP tool (in Claude Code session):
- Use `mcp__claude_ai_Cloudflare_Developer_Platform__d1_database_query` with:
  - `account_id`: `5313f8b98e20a8915418b2683ad7278c`
  - `database_id`: `90f3dbb2-0c2d-4aeb-a5ca-ed5bec51f1b2`
  - `sql`: your query

Via CLI:
```bash
npx wrangler d1 execute imei-generator-db --command="SELECT COUNT(*) FROM imei_history"
```
