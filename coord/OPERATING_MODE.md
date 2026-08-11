# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-11T00:04:49Z
Derived from: coord/STATE.md

## Current Mode

- Mode: iteration
- Active task: T-010 Design consult: display architecture for the concept delivery
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy,fable
- Council session: none
- Active thread: coord/threads/2026-08-11-T-010-design-consult-display-architecture-for-the-concept-delivery.md
- Check cadence: 5m
- Next check due: manual
- Stop condition: four blind proposals, cross-critique, synthesis Kristian signs off
- Edit budget: proposal-only
- Duration limit: none
- Codex resume target: --last
- Wake targets:
  - codex: codex exec -C {project} --skip-git-repo-check --sandbox workspace-write resume --last {prompt}
  - agy: agy --sandbox --dangerously-skip-permissions -p {prompt}
  - claude: claude -p {prompt} --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
  - fable: claude -p --output-format stream-json --verbose --model claude-fable-5 --max-budget-usd 25.00 --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --no-session-persistence {prompt}
- Self-wakeable agents: claude,codex,agy,fable
- Active loop drivers: none

## Edit Ownership

- docs/DISPLAY-DESIGN.md: claude

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
