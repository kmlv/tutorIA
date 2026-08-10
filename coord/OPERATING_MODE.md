# Operating Mode

Principal: Kristian

## Current Mode

- Mode: idle
- Active task: none
- Lead: none
- Reviewer: none
- Review route: none
- Importance: none
- Reviewers: none
- Council session: none
- Active thread: none
- Check cadence: none
- Next check due: manual
- Stop condition: none
- Edit budget: none
- Duration limit: none
- Codex resume target: --last
- Wake targets:
  - codex: codex exec -C {project} --skip-git-repo-check --sandbox workspace-write resume --last {prompt}
  - agy: agy --sandbox --dangerously-skip-permissions -p {prompt}
  - claude: claude -p {prompt} --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
- Self-wakeable agents: codex, agy, claude
- Active loop drivers: none

## Edit Ownership

No active ownership.

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.
- If `coord-pulse.sh` reports `ISSUE-004`, surface the printed Terminal command
  to Kristian for an unsandboxed HOME/network/localhost-capable retry; do
  not retry the same wake from a write-confined agent sandbox.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
