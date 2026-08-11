# Coordination State

Principal: Kristian

Agents: claude,codex,agy,fable

Protocol version: 0.4.22

## Active Task

- Task: T-011 Implement the approved display architecture: ledger band, stage, captions
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy,fable
- Council session: none
- Active thread: coord/threads/2026-08-11-T-011-implement-the-approved-display-architecture-ledger-band-stag.md
- Status: active

## Current Ownership

- app/web/src/ledger/**: claude
- app/web/src/main.ts: claude
- pipeline/render_math.mjs: claude

## Last Validated State

2026-08-11 ~07:15. Rama Kristian1, commit c67eb33.

- 144 tests de Python en verde; `npm test` en verde (invariantes del motor de cues,
  sondeo por rAF, golden del guion del grafico y del ledger).
- `pipeline/validate_pack.py` y `pipeline/check_cues.py`: 0 errores.
- Hitos cerrados desde el ultimo registro: M3 (juez en sombra), motor de dominio,
  M4 (bake-off medido, gana A en el 100% del simplex), D-1 mitad de recogida,
  D-3 (guion del grafico Y del ledger como datos, con la emision por LLM medida).
- T-011 ronda 2: implementada la mitad que comparten las dos propuestas (foco
  declarativo). Las fichas siguen ahi a la espera de la decision de Kristian.

## Notes

Update this file only at material checkpoints. Use threads for detailed
conversation.
