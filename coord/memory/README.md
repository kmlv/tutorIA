# Shared Coordination Memory

This directory is **optional shared cross-agent memory**. It is not authoritative
project state - `coord/STATE.md` and active threads are.

## When to use this

Use this only for context that multiple agents should be able to read across sessions. Memory is for things agents should remember *next session*, not things the project records (those go in `coord/STATE.md`, threads, or the codebase). Private agent memory belongs in each agent's own memory system, not here.

## Memory types

Use one file per memory; filename prefix indicates type:

- `feedback_<slug>.md` - preferences, lessons learned, corrections from the principal.
- `project_<slug>.md` - facts about the project that inform future work (deadlines, stakeholder notes).
- `reference_<slug>.md` - pointers to external systems (Linear projects, dashboards, repos).
- `user_<slug>.md` - facts about the principal's role/responsibilities.

Each file should have frontmatter:

```yaml
---
name: short title
description: one-line summary used to decide relevance later
type: feedback | project | reference | user
---
```

## What NOT to put here

- Code patterns / file paths / project structure (read the code).
- Git history / who-changed-what (use `git log`).
- Debugging recipes (the fix is in the code; reasons in commits).
- In-progress task state (`STATE.md`, threads).

## Indexing

Optionally maintain a `MEMORY.md` index in this directory listing one line per
memory file. Keep the index under ~150 lines so it stays scannable.

## Write policy

Any agent may read shared memory. Before writing or replacing memory files, claim the specific file path in the active thread. Do not store private chain-of-thought, unrelated user facts, or project-specific artifacts imported from other repositories.
