# Coordination Lessons

Last updated UTC: 2026-08-10T16:44:23Z

Lessons are advisory memory, not authority. `coord/AGENTS_PROTOCOL.md`,
`coord/STATE.md`, `coord/OPERATING_MODE.md`, the active thread, and
Kristian's explicit instructions override this file.

Use append-only entries with source tags. Promote candidate entries to
`[status:active]` only after review. Active entries may be injected into wake
prompts only when they include source, confidence, and TTL/last-confirmed
metadata, so keep them short, evidence-backed, and safe to quote.

Entry shape:

- [priority:2] [status:candidate|active|retired] [scope:review] [source:path:line] [confidence:high|medium|low] [ttl:30d|last-confirmed:YYYY-MM-DD] Durable lesson.

## Active Lessons

## Candidate Lessons

- [priority:1] [status:active] [scope:review] [source:coord/threads/2026-08-10-T-002-prior-art-sistemas-de-aprendizaje-similares.md] [confidence:high] [last-confirmed:2026-08-10] En tareas de investigacion, la etiqueta `[verificado:<url>]` de un agente no es evidencia: hay que mirar si la URL apunta a la PAGINA que sostiene el dato o solo al dominio. En T-002 agy marco `[verificado:phet.colorado.edu]` un "$100.000 y 500 horas por simulacion" que no existe en fuentes publicas de PhET, y `[verificado:econgraphs.org]` un "<16ms en navegadores viejos" que nadie ha medido. Las dos conclusiones sobrevivieron; las cifras no. Regla operativa: el lead verifica al menos los numeros que SOSTIENEN un hallazgo antes de sintetizar, y exige URL de pagina, no de dominio. El modo de fallo de prior art no es la pereza, es la cifra plausible que nadie publico.
- [priority:2] [status:active] [scope:review] [source:coord/work/codex/T-002-carril-A-motor-mastery.md] [confidence:medium] [last-confirmed:2026-08-10] Reparto por carriles tematicos disjuntos + un archivo por agente + claim file cuya seccion Out Of Scope NOMBRA los sistemas del otro: en T-002 los tres agentes trabajaron en paralelo sin una sola colision, y los tres lo declararon en su §4. Las fronteras previsibles (Khan mastery vs Khanmigo, Duolingo adaptativo vs Duolingo LLM) se resolvieron por adelantado en el encargo, no sobre la marcha.
- [priority:1] [status:active] [source:coord/HUMAN.md#H-002] [confidence:high] [last-confirmed:2026-08-10] Anotar un item abierto en `coord/HUMAN.md` cambia la decision de arranque de coord-pulse a `fresh:human-open-item`, y por ese camino el wake de `codex` muere a los ~3,2s sin escribir un byte (log truncado a 0, runlog solo con la cabecera). El argv resuelto es correcto — ejecutado a mano funciona — asi que el fallo esta en el lanzamiento, no en la configuracion. Sintoma peligroso: desde el thread es indistinguible de un agente que ignora el encargo; solo `coord.wake.duration_ms` en trace.jsonl lo delata (3263 ms frente a 85.000-115.000 ms de los wakes sanos). El camino fresh deberia correr el mismo escaner de no-output que el normal.

- [priority:1] [status:active] [source:coord/threads/2026-08-10-T-001-super-plan-poc-de-tutor-interactivo-delivery-ejemplos-pregun.md] [confidence:high] [last-confirmed:2026-08-10] Un agente puede reportar en su salida que publico un mensaje en el thread sin que el mensaje haya aterrizado. Ocurrio dos veces en T-001: `fable` en ronda 2 (MCP `coord_post` permission-bounced en headless, salvado por fallback a `coord-msg.sh`) y `agy` en la ronda de firma (reporto "appended my formal ack", el thread solo tenia sus 2 mensajes previos). El lead NO debe contar una firma o entrega por lo que dice el wake log: hay que verificarla contra el thread. Regla operativa: tras cualquier ronda, contar los mensajes por agente con `awk '/^from: /{f=$2} /^type: (ack|dissent)$/{print f, $2}'` antes de declarar el estado.
- [priority:2] [status:active] [source:coord/HUMAN.md#H-001] [confidence:high] [last-confirmed:2026-08-10] Los wake targets `claude -p` necesitan `--output-format stream-json --verbose`; sin ellos el CLI no emite bytes hasta terminar y el guard de no-output de coord-pulse lo mata a los 300s con un ISSUE-004 que culpa al sandbox. Copiar el patron de `~/GithubRepos/AIstigmergy/coord/OPERATING_MODE.md` en vez de escribirlo de memoria. Vale la pena que `coord-doctor` valide esto.
