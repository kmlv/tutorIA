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
