Run a pre-deploy verification of the IMEI Generator project. Check all of the following and report findings:

1. **Route sync** — Read `src/worker.js` and each file in `functions/api/`. For every `onRequest*` export in the api files, verify there is a corresponding route handler in `src/worker.js`. Report any missing routes.

2. **Schema vs handler sync** — Read `schema.sql` and all `functions/api/*.js` files. For every column name referenced in SQL strings inside the handler files, verify it exists in `schema.sql`. Report any column name mismatches or references to nonexistent columns.

3. **DB binding sync** — Verify that every `env.DB` reference in handler files matches the binding name `DB` in `wrangler.jsonc`. Verify the D1 database ID in `wrangler.jsonc` matches the one in `CLAUDE.md`.

4. **Assets config** — Verify `wrangler.jsonc` `assets.directory` is `./dist` and `main` points to `./src/worker.js`.

5. **Build script** — Verify `package.json` `deploy` script runs `npm run build` before `wrangler deploy`. Verify `build` script copies both `index.html` and `tac-database.json` to `dist/`.

6. **CORS headers** — Verify every handler file has a `CORS` constant and includes it in all responses (not just OPTIONS).

7. **Uncommitted changes** — Run `git status` and report any uncommitted changes that would not be included in a deploy.

Output a clear PASS / WARN / FAIL for each check. If all pass, confirm it is safe to deploy. If anything fails, explain what needs to be fixed before deploying.
