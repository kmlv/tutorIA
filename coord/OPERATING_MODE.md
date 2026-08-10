# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-10T19:22:28Z
Derived from: coord/STATE.md

## Current Mode

- Mode: implementation
- Active task: T-003 M1: guion bilingue de linea presupuestaria + validacion del catalogo de misconceptions
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy,fable
- Council session: none
- Active thread: coord/threads/2026-08-10-T-003-m1-guion-bilingue-de-linea-presupuestaria-validacion-del-cat.md
- Check cadence: 5m
- Next check due: manual
- Stop condition: guion es/en escrito desde S2 en la voz de Kristian, catalogo mapeado contra IESA-Micro, y Kristian valida contra sus examenes
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

- content/**: claude
- docs/PLAN.md: claude

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
