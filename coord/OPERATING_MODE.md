# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-10T17:09:45Z
Derived from: coord/STATE.md

## Current Mode

- Mode: iteration
- Active task: T-001 Super-plan: PoC de tutor interactivo (delivery + ejemplos + preguntas no calificadas + juez de aprendizaje)
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy,fable
- Council session: none
- Active thread: coord/threads/2026-08-10-T-001-super-plan-poc-de-tutor-interactivo-delivery-ejemplos-pregun.md
- Check cadence: 5m
- Next check due: manual
- Stop condition: Las 3 rondas completas (propuesta -> critica cruzada -> sintesis) y Kristian desempata los disensos
- Edit budget: proposal-only
- Duration limit: none
- Codex resume target: --last
- Wake targets:
  - codex: codex exec -C {project} --skip-git-repo-check --sandbox workspace-write resume --last {prompt}
  - agy: agy --sandbox --dangerously-skip-permissions -p {prompt}
  - claude: claude -p {prompt} --model claude-opus-5 --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
  - fable: claude -p {prompt} --model claude-fable-5 --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
- Self-wakeable agents: claude,codex,agy,fable
- Active loop drivers: none

## Edit Ownership

- docs/PLAN.md: claude
- docs/BRIEF.md: claude
- coord/decisions/*: claude

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
