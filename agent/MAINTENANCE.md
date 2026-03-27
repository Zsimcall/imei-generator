# Maintenance Protocol

Rules for keeping the agent system accurate and useful across sessions.

---

## When to Update What

| Trigger | Update |
|---|---|
| Feature added or changed | `agent/state.md` (move to completed) + `CLAUDE.md` if architecture changed |
| Bug discovered | `agent/state.md` → Open Issues |
| Bug fixed | `agent/state.md` → move to Recently Completed, remove from Open Issues |
| Non-obvious decision made | `agent/decisions.md` → add new entry |
| New constraint identified | `agent/constraints.md` → add entry |
| Workflow procedure changes | `agent/workflows.md` → update relevant section |
| Deploy succeeds/fails | `agent/state.md` → Deploy Status |
| Schema changes | `agent/state.md` → Schema Version + `agent/workflows.md` if process changed |
| New reusable procedure | `agent/workflows.md` → add new section |

---

## Session Start Checklist

1. Read `agent/BOOTSTRAP.md`
2. Read `agent/state.md`
3. Check if "In Progress" has anything that needs continuing
4. Check if "Open Issues" affects the current task
5. Proceed with the user's request

---

## Session End Checklist

Run through this before ending a session where code was changed:

- [ ] `agent/state.md` updated: in-progress work captured, completed items moved
- [ ] `agent/decisions.md` updated: if a non-obvious choice was made, log it
- [ ] `agent/state.md` open issues: any new issues discovered? add them
- [ ] CLAUDE.md accurate: if architecture changed, update it
- [ ] All changes committed and pushed if the user requested deploy

---

## How to Record a Decision

In `agent/decisions.md`, add a new section:

```markdown
## [Short title]

**Decision:** One sentence of what was decided.

**Why:** The reasoning. This is the most important part — future sessions need to understand the "why" to know when the decision should be revisited.

**Consequence:** What this means for future work. What would break if reversed.

**Do not change without:** Any special considerations.
```

Keep it factual. Avoid padding. If the reason is obvious from the code, don't log it.

---

## How to Track In-Progress Work

In `agent/state.md` → "In Progress", add:

```markdown
### [Task name]
**Started:** YYYY-MM-DD
**What:** One sentence description.
**Where:** Files being changed.
**Next step:** What to do when resuming.
```

Remove the entry when complete (move to "Recently Completed").

---

## Accuracy Over Completeness

If a section in `agent/state.md` is outdated, **update or delete it** rather than leaving stale information. An inaccurate record is worse than no record — it sends future sessions in the wrong direction.

The `agent/decisions.md` is append-only (old decisions stay for history). All other files should reflect current reality.
