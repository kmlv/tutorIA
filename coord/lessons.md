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

- [priority:1] [status:active] [source:coord/threads/2026-08-10-T-001-super-plan-poc-de-tutor-interactivo-delivery-ejemplos-pregun.md] [confidence:high] [last-confirmed:2026-08-10] Un agente puede reportar en su salida que publico un mensaje en el thread sin que el mensaje haya aterrizado. Ocurrio dos veces en T-001: `fable` en ronda 2 (MCP `coord_post` permission-bounced en headless, salvado por fallback a `coord-msg.sh`) y `agy` en la ronda de firma (reporto "appended my formal ack", el thread solo tenia sus 2 mensajes previos). El lead NO debe contar una firma o entrega por lo que dice el wake log: hay que verificarla contra el thread. Regla operativa: tras cualquier ronda, contar los mensajes por agente con `awk '/^from: /{f=$2} /^type: (ack|dissent)$/{print f, $2}'` antes de declarar el estado.
- [priority:2] [status:active] [source:coord/HUMAN.md#H-001] [confidence:high] [last-confirmed:2026-08-10] Los wake targets `claude -p` necesitan `--output-format stream-json --verbose`; sin ellos el CLI no emite bytes hasta terminar y el guard de no-output de coord-pulse lo mata a los 300s con un ISSUE-004 que culpa al sandbox. Copiar el patron de `~/GithubRepos/AIstigmergy/coord/OPERATING_MODE.md` en vez de escribirlo de memoria. Vale la pena que `coord-doctor` valide esto.
