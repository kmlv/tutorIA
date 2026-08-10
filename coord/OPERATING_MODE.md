# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-10T23:06:11Z
Derived from: coord/STATE.md

## Current Mode

- Mode: implementation
- Active task: T-004 M0: esqueleto FastAPI + esquema SQLite + loader de packs + CI, y medir KaTeX
- Lead: claude
- Reviewer: codex
- Review route: targeted
- Importance: routine
- Reviewers: codex
- Council session: none
- Active thread: coord/threads/2026-08-10-T-004-m0-esqueleto-fastapi-esquema-sqlite-loader-de-packs-ci-y-med.md
- Check cadence: 5m
- Next check due: manual
- Stop condition: tests verdes, servidor arranca, loader valida el pack, y el peso de KaTeX MEDIDO
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

- app/**: claude
- pyproject.toml: claude
- tests/**: claude

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
