# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-10T23:38:41Z
Derived from: coord/STATE.md

## Current Mode

- Mode: implementation
- Active task: T-005 M2 parallel: graph manipulation (agy) + grader review (codex) + question flow (claude)
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy,fable
- Council session: none
- Active thread: coord/threads/2026-08-10-T-005-m2-parallel-graph-manipulation-agy-grader-review-codex-quest.md
- Check cadence: 5m
- Next check due: manual
- Stop condition: manip.ts merged, grader review answered, and the four question types run end to end
- Edit budget: implementation
- Duration limit: none
- Codex resume target: --last
- Wake targets:
  - codex: codex exec -C {project} --skip-git-repo-check --sandbox workspace-write resume --last {prompt}
  - agy: agy --sandbox --dangerously-skip-permissions -p {prompt}
  - claude: claude -p {prompt} --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
- Self-wakeable agents: claude,codex,agy,fable
- Active loop drivers: none

## Edit Ownership

STRICT: each agent owns disjoint paths. Do NOT edit outside your own set; if you need a
change elsewhere, post it in the thread and the owner applies it.

- app/web/src/graph/**            : agy    (implement drag manipulation)
- app/server/core/judge/**        : codex  (READ-ONLY review, do not edit)
- app/server/core/content/schema.py: codex (READ-ONLY review, do not edit)
- app/web/src/questions/**        : claude
- app/web/src/main.ts             : claude
- app/web/src/chat/**             : claude
- content/**                      : claude

- app/web/src/questions/**: claude
- app/web/src/main.ts: claude
- app/web/src/chat/**: claude

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
