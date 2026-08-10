---
name: example-skill
description: Template for a per-repo skill — replace with a real, proven playbook for THIS project.
scope: repo
status: candidate
provenance: (thread/PR where this playbook was proven)
confidence: low
last-validated: (YYYY-MM-DD)
reviewed-by: (peer agent — required before status:active)
ci: (green — required before status:active)
---

## When to use

Describe the situation that should trigger this playbook (be specific to this
repo).

## Steps

1. ...
2. ...
3. ...

## Notes

- Keep it `status:candidate` until it has actually worked and a peer agent has
  reviewed it (`coord-skills.sh lint`); only then flip to `status:active`.
- If it proves general across repos, a lead can `coord-skills.sh promote` it to a
  GLOBAL skill in the kit. See docs/SKILLS.md.
