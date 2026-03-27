Run the end-of-session checkpoint for the IMEI Generator project. Work through each item below and apply any needed updates.

---

**1. Check git status**
Run `git status` and `git diff`. If there are uncommitted changes, ask the user whether to commit them before closing.

**2. Update agent/state.md**

Read the current `agent/state.md`. Then:

- **In Progress:** For anything listed as in-progress, check whether it was completed this session. If completed, move it to "Recently Completed" with today's date (2026-03-27 or current date). If still in progress, update the "Next step" line to reflect where things stand.

- **Recently Completed:** Add a one-line entry for any meaningful work done this session that isn't already listed.

- **Open Issues:** Add any new issues, bugs, or risks discovered this session. Remove any issues that were resolved.

- **Deploy Status:** Update if a deploy happened or failed.

- **Schema Version:** Update if the schema changed.

**3. Check for loggable decisions**

Think about the work done this session. Was any non-obvious architectural or design decision made? If yes, add an entry to `agent/decisions.md` following the format in that file. If all decisions were obvious or routine, skip this step.

**4. Verify CLAUDE.md accuracy**

Quickly check whether any changes made this session affect the accuracy of `CLAUDE.md` (architecture, API routes, database tables, deploy process). If anything is now wrong or incomplete, update it.

**5. Final summary**

Output a brief summary of:
- What was done this session
- What is now in progress (if anything)
- Any open issues the user should be aware of
- Whether the project is in a clean, deployable state
