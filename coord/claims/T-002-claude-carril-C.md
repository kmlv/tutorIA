# Claim: T-002 / Carril C — El juez: tutores LLM desplegados y evaluacion automatica

Task: T-002
Owner: claude
Reviewer: codex
Claimed UTC: 2026-08-10T18:23:32Z
Last heartbeat UTC: 2026-08-10T18:23:32Z
Expires UTC: 2026-08-10T21:23:32Z (3h; tarea de investigacion)
Status: claimed

## Pregunta del carril

Los tutores LLM que ya estan en produccion con estudiantes reales: que hacen
contra la alucinacion, como evitan regalar la respuesta, y **que tan fiable es un
LLM juzgando una respuesta abierta** comparado con un humano.

Alimenta estas partes de docs/PLAN.md: juez LLM + rubrica, catalogo de
misconceptions (decision 9), distractores mapeados a misconception, split de
costo por rol (decision 17), UX del chat.

## Expected Files / Scope

- coord/work/claude/T-002-carril-C-tutores-llm-juez.md  ← UNICO archivo que escribo
- docs/RESEARCH-PRIOR-ART.md — sintesis final, SOLO despues de que cierren los
  tres carriles

Sistemas asignados a este carril, en exclusiva:

- Khanmigo (**el tutor LLM**; el motor de mastery de Khan es del carril A)
- LearnLM / Gemini Guided Learning
- Modos de estudio/aprendizaje de los asistentes generalistas
- Synthesis Tutor y similares
- Tutor CoPilot (LLM asistiendo a tutores humanos) y sus resultados
- Investigacion de tutoria socratica con LLM y de "no des la respuesta"
- LLM-as-judge / automated short answer grading: fiabilidad vs humano
- Catalogos y datasets de misconceptions (p. ej. Eedi / Diagnostic Questions) y
  distractores etiquetados por misconception
- Prior art interno: InteractiveEduHub, AudioExplainer

## Out Of Scope — pertenece a OTRO agente, no lo toco

- Motor de mastery, knowledge tracing, ITS clasicos → **carril A, codex**
- Media, graficos, manipulables, costo de produccion → **carril B, agy**
- docs/PLAN.md, docs/BRIEF.md, coord/decisions/* → CONGELADOS

## Plan

- [ ] 6–10 fichas de sistema con el formato comun del thread.
- [ ] §3: los 3 hallazgos que cambiarian el PLAN, con seccion afectada.
- [ ] Verificar entregas de A y B contra los archivos, no contra los wake logs.
- [ ] Sintetizar en docs/RESEARCH-PRIOR-ART.md y registrar disensos.

## Handoff

None yet.
