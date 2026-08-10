# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-10T19:16:34Z
Derived from: coord/STATE.md

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
  - codex: codex exec -C {project} --skip-git-repo-check --sandbox workspace-write -c model_reasoning_effort=medium resume --last {prompt}
  - agy: agy --sandbox --dangerously-skip-permissions -p {prompt}
  - claude: claude -p {prompt} --model claude-opus-5 --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
  - fable: claude -p --output-format stream-json --verbose --model claude-fable-5 --max-budget-usd 25.00 --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --no-session-persistence {prompt}
- Self-wakeable agents: claude,codex,agy,fable
- Active loop drivers: none

## Edit Ownership

No files claimed.

## Iteration Rules

- Respect the edit budget: proposal-only. T-002 es investigacion; no se escribe
  codigo de la app ni se modifica el plan firmado.
- Un hallazgo que deberia cambiar docs/PLAN.md se escribe como propuesta en la §3
  de tu propio carril. No se aplica al PLAN. Kristian decide.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

T-001 queda en `waiting-on-principal` (ver coord/STATE.md y H-002 en
coord/HUMAN.md). Su thread sigue siendo el registro de esa discusion; T-002 usa
un thread nuevo para no arrastrar 150 KB de debate del plan al contexto de cada
wake.
