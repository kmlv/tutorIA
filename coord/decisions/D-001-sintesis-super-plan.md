# D-001 — Síntesis del súper-plan (T-001)

- Fecha UTC: 2026-08-10
- Tarea: T-001
- Lead / redactor de la síntesis: `claude` (Opus 5)
- Autores del plan: `claude` (Opus 5), `fable` (Fable-5), `codex` (Sol Ultra / GPT-5.6), `agy` (Gemini)
- Principal: Kristian
- Entregable: [`docs/PLAN.md`](../../docs/PLAN.md)
- Estado: **pendiente de firma de los cuatro agentes y de 3 desempates del principal**

## Proceso

Tres rondas, según la decisión 30 del principal:

1. **Ronda 1 — propuestas independientes a ciegas.** Cuatro propuestas completas sin que
   ningún agente viera las de los demás.
2. **Ronda 2 — crítica cruzada.** Cinco mensajes de review (fable envió dos).
3. **Ronda 3 — síntesis.** Este documento y `docs/PLAN.md`.

Presupuesto: `proposal-only`. Ningún agente escribió código.

## Consenso alcanzado

15 decisiones cerradas (C1–C15 en `docs/PLAN.md` §1). Las más significativas:

- **Backend Python/FastAPI, 4–0.** `claude` y `codex` cambiaron de voto. El argumento
  decisivo no fue afinidad de lenguaje sino que la generación al vuelo implica que el
  runtime invoque el pipeline (audioexplain, manim, ambos Python); en TypeScript eso
  exige un servicio Python aparte con frontera de red, construido justo el día en que
  generar debe ser barato.
- **La costura fuente/artefacto**, no la abstracción de runtime, es lo que habilita
  tanto "un docente edita el contenido" como "un LLM lo genera mañana".
- **Deterministic-first**: el LLM solo juzga respuestas abiertas.
- **El catálogo de misconceptions queda fuera de la generación automática**: es la
  ontología que hace comparables a los estudiantes entre sí.
- **El juez corre en modo sombra** y debe pasar un gate de concordancia con el principal
  antes de que se le permita mover el estado de mastery.

## Convergencia independiente (señal fuerte)

En la ronda 1, escribiendo a ciegas, los cuatro agentes llegaron por separado a:

1. La misma frontera de extensión para la generación al vuelo
   (`ConceptBundle` / `DeliveryAssetProvider` / `PackSource` / `get_media`).
2. Rechazo de la burbuja de chat en favor de panel lateral, con el mismo argumento
   (ocluye el gráfico durante la manipulación).
3. Tabla de remediación determinista en vez de dejar decidir al modelo, con el mismo
   orden de escalada.

Cuatro modelos de tres vendors distintos convergiendo a ciegas es la evidencia más
fuerte que produjo el ejercicio.

## Disensos elevados al principal

- **D1 — ¿La decisión 11 aplica a los checkpoints guionados?** `codex` sostiene que la
  pausa automática la contradice; `fable`, `agy` y `claude` leen que la decisión gobierna
  que el tutor no robe el control, no la estructura del guion. 3–1, pero es
  interpretación de la intención del principal, no cuestión de votos.
- **D2 — Umbral del gate de concordancia**: ≥85% (`codex`) vs ≥80% (`claude`, `fable`).
- **D3 — Métrica de misconceptions**: macro-F1 ≥0.75 (`codex`) vs recall por clase
  reportado con su n (`claude`, `fable`, 3–1). El argumento contra el macro-F1 es de
  potencia estadística: con ~13 clases y ~30 respuestas etiquetadas, varias clases
  quedan con n ≤ 2.

Resuelto sin el principal: vanilla TS vs React lo decide el spike de M0–M2.

## Anomalías del proceso, registradas

- **H-001**: el wake CLI de `fable` falló en la ronda 1. Causa raíz: `claude` escribió el
  wake target de memoria en vez de copiar el patrón que el principal ya usaba en
  `~/GithubRepos/AIstigmergy`; faltaban `--output-format stream-json --verbose`, sin los
  cuales `claude -p` no emite bytes y el guard de coord-pulse lo mata a los 300 s.
  `claude` atribuyó el fallo a sandbox antes de sospechar de su propia configuración.
- **Asimetría de procedencia**: la propuesta de ronda 1 de `fable` la produjo un
  subagente lanzado por Opus 5 (con la ceguera preservada por instrucción explícita,
  confirmada por el agente), no el agente CLI. Su voz de ronda 1 pasó filtrada por Opus 5;
  las de `codex` y `agy` no. Desde la ronda 2, `fable` participa como agente CLI.
- **Números sin medir**: la discusión sobre el peso de KaTeX se hizo sin poder descargar
  el paquete (sandbox). Las cifras de ambos lados están sin verificar y M0 las mide antes
  de que el presupuesto sea un gate.
- 11 errores detectados y corregidos durante el proceso, tabulados en `docs/PLAN.md` §11.
  Seis eran de `claude`, el redactor de esta síntesis.

## Siguiente paso

Ronda de firma: los cuatro agentes revisan `docs/PLAN.md` y firman o registran disenso.
Después, el principal desempata D1–D3 y autoriza el paso de `proposal-only` a
`implementation`.
