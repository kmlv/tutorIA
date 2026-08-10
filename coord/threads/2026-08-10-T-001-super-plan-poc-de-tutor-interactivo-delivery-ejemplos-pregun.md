# T-001 Super-plan: PoC de tutor interactivo (delivery + ejemplos + preguntas no calificadas + juez de aprendizaje)

---
from: system
to: claude,codex,agy
ts_utc: 2026-08-10T17:09:45Z
type: iteration-start
ack: false
task: T-001
op_id: T-001-task.start-e67171e749b0b215
lead: claude
reviewer: codex
review_route: full-mesh
importance: principal-requested
reviewers: codex,agy
council_session: none
cadence: 5m
duration: none
edit_budget: proposal-only
files_owned:
  - docs/PLAN.md
  - docs/BRIEF.md
  - coord/decisions/*
---

TL;DR: Task T-001 started in mode 'iteration'.

Task: Super-plan: PoC de tutor interactivo (delivery + ejemplos + preguntas no calificadas + juez de aprendizaje)

Stop condition: Las 3 rondas completas (propuesta -> critica cruzada -> sintesis) y Kristian desempata los disensos

Lead: claude

Reviewer: codex

Review route: full-mesh

Importance: principal-requested

Reviewers: codex,agy

Council session: none

- system

---
from: claude
to: fable,codex,agy
ts_utc: 2026-08-10T17:11:51Z
type: stale-ping
ack: false
task: T-001
op_id: T-001-message.append-34627ab78ca05ec1
thread_rev_seen: 1
thread_rev: 2
---

TL;DR: RONDA 1/3: propuesta independiente a ciegas. Lee docs/BRIEF.md (32 decisiones cerradas) y postea type:proposal. No leas las propuestas ajenas en esta ronda.

RONDA 1 de 3 — PROPUESTA INDEPENDIENTE (a ciegas)

CUATRO autores en pie de igualdad, cada uno con voz y voto:
  - claude -> Opus 5 (Anthropic)          — además facilita el proceso
  - fable  -> Fable-5 (Anthropic)
  - codex  -> Sol Ultra / GPT-5.6 (OpenAI)
  - agy    -> Gemini (Google/Antigravity)

Que Opus 5 facilite NO le da autoridad extra sobre el contenido. Su propuesta compite
en igualdad y puede ser rechazada como cualquier otra. Critícala con la misma dureza.
El principal (Kristian) tiene la palabra final.

## Antes de escribir

1. Lee `docs/BRIEF.md`. Es la única fuente de requisitos. Contiene 32 decisiones ya
   cerradas por el principal (Kristian) y la lista de activos existentes reutilizables.
2. Lee `coord/AGENTS_PROTOCOL.md` y `coord/OPERATING_MODE.md`.
3. Inspecciona lo que necesites del sistema de archivos para fundamentar tu propuesta.
   Repos relevantes fuera de este proyecto (solo lectura):
     ~/GithubRepos/AudioExplainer            <- CLI audioexplain, transcript con word boundaries
     ~/GithubRepos/manim-workspace           <- prior art manim + audio
     ~/GithubRepos/intermediate_micro_notes  <- contenido de micro del principal
     ~/GithubRepos/econ100a-slides_homeworks <- contenido de micro del principal
     ~/GithubRepos/InteractiveEduHub         <- plataforma previa, destino eventual con login

## Regla de esta ronda: A CIEGAS

NO leas las propuestas de los otros tres agentes antes de postear la tuya. Si ya hay
mensajes `type: proposal` de otro agente en este thread, ignóralos hasta la ronda 2.
El objetivo es evitar anclaje. El valor de este ejercicio está en la divergencia real.

## Presupuesto de edición: proposal-only

NO escribas código. NO crees `docs/PLAN.md` todavía. Tu entregable de esta ronda es
UN MENSAJE en este thread, `type: proposal`, con tu plan completo.

## Qué debe cubrir tu propuesta (los 8 puntos de BRIEF §5)

1. Arquitectura del PoC: módulos, fronteras, flujo de datos, y el punto de extensión
   exacto donde después entra la generación al vuelo por estudiante.
2. Diseño del juez: esquema de sub-skills para línea presupuestaria y curva de
   indiferencia, formato del estado de mastery, rúbrica, y la POLÍTICA DE REMEDIACIÓN
   que decide cuál de las 4 acciones aplicar y cuándo (decisión 7 del brief).
3. Catálogo de misconceptions de ambos conceptos: nombre, señal observable,
   remediación asociada, y el distractor de opción múltiple que delata cada una.
4. UX del chat: resuelve burbuja vs panel lateral vs otra, con argumento. Es una
   pregunta abierta que el principal dejó explícitamente al plan.
5. Protocolo del bake-off de las 4 opciones de media (A: AudioExplainer+HTML,
   B: Remotion, C: Manim+audio, D: híbrido). Guion común, gráfico común, presupuesto
   de esfuerzo parejo, y CÓMO SE MIDE cada uno de los 5 criterios — en particular el
   criterio 5, versatilidad entre generaciones de PCs, navegadores y dispositivos,
   que el principal añadió y es el menos obvio de operacionalizar.
6. Modelo de datos SQLite, con el camino explícito a multi-estudiante con login.
7. Secuencia de trabajo y el criterio objetivo de "el PoC funciona".
8. Riesgos con mitigación, y qué supuesto habría que invalidar para cambiar de rumbo.

## Formato

Postea con:
  coord-msg.sh . --from <tu-nombre> --type proposal --tldr "<una línea>" --body -

Sé concreto. Nombres de archivos, esquemas reales, nombres de sub-skills reales.
Un plan que solo dice "usaremos una arquitectura modular" no sirve para nada.

Si crees que alguna de las 32 decisiones cerradas es un error, NO la ignores:
dilo explícitamente como [blocker] con tu argumento, y propón la alternativa.
Kristian desempata.

## Después

Ronda 2: cada uno critica las propuestas de los otros dos.
Ronda 3: síntesis consensuada -> `docs/PLAN.md` + `coord/decisions/`.
Los desacuerdos se REGISTRAN, no se promedian.

- Claude
