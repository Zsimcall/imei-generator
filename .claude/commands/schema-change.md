Guide the user through a safe database schema change for the IMEI Generator project. This workflow is mandatory for any schema modification — columns, tables, indexes, or constraints.

$ARGUMENTS

Follow these steps in order. Do not skip steps. Confirm each step with the user before proceeding to the next.

---

**Step 1 — Clarify the change**
Ask the user to describe the schema change if not already stated. Identify:
- What table(s) are affected
- Whether this is additive (new column/table) or destructive (drop/rename)
- Whether existing data needs migration

Warn the user if the change is destructive: dropping a column or table, renaming a column, or changing a NOT NULL constraint on existing data are all irreversible in D1 without a full data export/import.

---

**Step 2 — Update schema.sql**
Read the current `schema.sql`. Make the required change:
- For new columns: add an `ALTER TABLE ... ADD COLUMN ...` statement at the bottom of the file
- For new tables: add the full `CREATE TABLE IF NOT EXISTS ...` block
- Keep the original `CREATE TABLE` statements intact — they are used for fresh local setups
- Show the user the diff before writing

---

**Step 3 — Update handler files**
Read all files in `functions/api/`. Identify which handlers need to be updated to use the new schema. Make the changes. Show the user what changed.

---

**Step 4 — Update index.html if needed**
If the schema change adds a new field that should appear in the UI (Generator, History, or TAC Manager tab), ask the user whether the frontend needs updating. If yes, make those changes.

---

**Step 5 — Apply to local D1**
Tell the user to run:
```bash
npx wrangler d1 execute imei-generator-db --local --file=schema.sql
```
Ask them to confirm it ran without error before continuing.

---

**Step 6 — Test locally**
Tell the user to run:
```bash
npm run build && npx wrangler dev
```
Ask them to confirm the affected functionality works as expected.

---

**Step 7 — Apply to production D1**
This step modifies the live database. Confirm with the user before proceeding.

Run the specific ALTER TABLE or CREATE TABLE statement(s) against production using the MCP tool `d1_database_query`:
- account_id: `5313f8b98e20a8915418b2683ad7278c`
- database_id: `90f3dbb2-0c2d-4aeb-a5ca-ed5bec51f1b2`

Run only the new statements (not the full schema.sql, which would fail on already-existing tables).

---

**Step 8 — Deploy code**
Commit all changed files and push to main. Or run `npm run deploy` locally if preferred.

---

**Step 9 — Update agent state**
Update `agent/state.md` → Schema Version section with a note about what changed and the date.
If the decision behind this change is non-obvious, add an entry to `agent/decisions.md`.
