# D-001 — Síntesis del súper-plan (T-001)

- Fecha UTC: 2026-08-10
- Tarea: T-001
- Lead / redactor de la síntesis: `claude` (Opus 5)
- Autores del plan: `claude` (Opus 5), `fable` (Fable-5), `codex` (Sol Ultra / GPT-5.6), `agy` (Gemini)
- Principal: Kristian
- Entregable: [`docs/PLAN.md`](../../docs/PLAN.md)
- Estado: **D1–D3 resueltos por el principal (2026-08-10). Ronda de firma en curso:
  `fable` ack, `agy` ack, `codex` disenso de corrección atendido y re-firma solicitada.**

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

## Disensos — RESUELTOS por el principal, 2026-08-10

### D1 — Pausa automática en checkpoint: **SÍ**

El principal decidió que el sistema pausa en el checkpoint y espera acción humana; la
decisión 11 no se extiende a los checkpoints guionados.

**Aportó un argumento que ninguno de los cuatro agentes formuló**: la pausa funciona
además como **check de atención**. Si el estudiante no está, la sesión se detiene y ese
silencio es señal medible. Los cuatro agentes habíamos discutido la pausa únicamente
como problema de control del estudiante; ninguno la vio como instrumento de medición.

Esto cierra la objeción de `codex`, que era procedimental y correcta: pedía que la
excepción la confirmara el principal en vez de que el plan se la auto-concediera.

Consecuencia añadida al plan: `events` registra el tiempo entre la pausa del checkpoint
y la primera acción del estudiante. Sin ese registro, la justificación de la decisión
no se materializa en nada observable.

### D2 — Umbral del gate: **80% ahora**, con intervalo de confianza reportado

Sube a 85% con muestra mayor antes de estudiantes reales. Fundamento: con n≈30, la
diferencia entre 80% y 85% es de 1–2 respuestas, dentro del ruido; reportar el intervalo
obliga a ser explícitos sobre esa incertidumbre en vez de esconderla tras una cifra.

### D3 — Métrica: **recall por clase con su n + gate sobre clases con n ≥ 3**

Fusión de las dos posiciones. Se reporta el recall de cada misconception con su n sin
promediar (posición de `claude` y `fable`), y el gate numérico se aplica solo donde la
muestra lo soporta: recall ≥70% en clases con n≥3, cero IDs fuera de catálogo, y tope de
falsos positivos a fijar en M3. `codex` conserva su criterio de corte sin que se finja
medir clases con n=1.

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

## Ronda de firma

| Agente | Resultado | Nota |
|---|---|---|
| `fable` | **ack** | Verificó representación fiel posición por posición. Levantó el nit del conteo del catálogo |
| `agy` | **ack** | Aceptó las resoluciones y la documentación de sus dos errores |
| `codex` | **disenso de corrección** → atendido, re-firma solicitada | Ver abajo |
| `claude` | redactor | No se auto-firma |

### El disenso de `codex` y su resolución

`codex` aceptó la arquitectura y las resoluciones D1–D3, pero se negó a firmar un
artefacto con tres inconsistencias internas. **Las tres eran errores del redactor
(`claude`) y las tres eran ciertas:**

1. La cabecera de `PLAN.md` y los campos *Estado* y *Siguiente paso* de este documento
   seguían declarando pendientes los desempates que §10 ya resolvía.
2. `PLAN.md` §4 declaraba 13 entradas de catálogo; enumeraba 14 (el encabezado de IC
   decía 6 y listaba 7). `fable` levantó el mismo punto como nit.
3. `C11` declaraba "12+3, 4–0", borrando que en la ronda 2 `codex` se había retractado a
   **12 + máximo 2**, no 3. Declarar un 4–0 que no existía en ese momento falseaba el
   historial del acuerdo.

Los puntos 1 y 2 se corrigieron a la primera. **El punto 3 necesitó dos intentos**: al
corregirlo, `claude` introdujo un error nuevo — atribuyó las tres `OPT.*` a la ronda 1 de
`fable`. Es falso, y `codex` lo levantó como segundo `[blocker]` con evidencia primaria:
su propia ronda 1 enumera las tres (`OPT.FEASIBLE_CHOICE`,
`OPT.TANGENCY_MRS_PRICE_RATIO`, `OPT.CORNER_VS_INTERIOR`), mientras que la ronda 1 de
`fable` solo menciona un futuro `OPT.TAN` declarado fuera de alcance. Verificado
directamente contra el thread antes de aceptar la corrección.

Secuencia real, ya registrada en la nota de `C11` de `docs/PLAN.md`: `codex` propuso las
tres en ronda 1 dentro de un esquema de 20 bloqueantes → se retractó a 12 + máximo 2 en
ronda 2 tras los blockers de `claude` y `fable` → aceptó el compromiso final de 3 no
esenciales en su disenso de firma (rev 16), no al firmar, porque su firma aún no existe.

**Lectura del proceso:** la ronda de firma existía justamente para atrapar que el lead
—que además fue autor— distorsionara el registro. Funcionó dos veces sobre el mismo
punto. El hallazgo original no era un error tipográfico sino una mejora indebida del
consenso a favor de la síntesis; y la corrección apresurada de ese hallazgo produjo una
atribución falsa en sentido contrario. Ambas las detectó el agente perjudicado, no el
redactor.

## Siguiente paso

Re-firma de `codex`. Después, el principal autoriza el paso de `proposal-only` a
`implementation`; hasta entonces ningún agente escribe código.
