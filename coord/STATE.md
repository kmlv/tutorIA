# Coordination State

Principal: Kristian

Agents: claude,codex,agy,fable

Protocol version: 0.4.22

## Active Task

- Task: T-002 Prior art: sistemas de aprendizaje interactivo similares
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy
- Council session: none
- Active thread: coord/threads/2026-08-10-T-002-prior-art-sistemas-de-aprendizaje-similares.md
- Status: active

## Paused / Awaiting Principal

- Task: T-001 Super-plan: PoC de tutor interactivo (delivery + ejemplos + preguntas no calificadas + juez de aprendizaje)
- Thread: coord/threads/2026-08-10-T-001-super-plan-poc-de-tutor-interactivo-delivery-ejemplos-pregun.md
- Status: waiting-on-principal (H-002). Plan firmado 3/3 (fable rev 17, agy rev 23, codex rev 26).
  Ningun agente escribe codigo hasta que Kristian cambie el edit budget a implementation.

## Current Ownership

Dos tareas activas -> claims por archivo, no solo por thread (AGENTS_PROTOCOL.md
"Optional Task Management"). Un carril = un agente = un archivo. Nadie escribe en
el archivo de otro.

- coord/work/claude/T-002-*.md: claude (carril C — tutores LLM y juez)
- coord/work/codex/T-002-*.md: codex (carril A — motor de mastery y remediacion)
- coord/work/agy/T-002-*.md: agy (carril B — delivery multimodal y manipulables)
- docs/RESEARCH-PRIOR-ART.md: claude (sintesis, solo tras cerrar los tres carriles)
- docs/PLAN.md, docs/BRIEF.md, coord/decisions/*: claude — CONGELADOS en T-002.
  Los hallazgos se proponen en §3 de cada carril; no se aplican al PLAN hasta que
  Kristian lo autorice.

## Last Validated State

T-001: docs/PLAN.md y coord/decisions/D-001 firmados por los tres revisores,
verificado contra el thread (no contra los wake logs) el 2026-08-10T18:16Z.

## Notes

Update this file only at material checkpoints. Use threads for detailed
conversation.
