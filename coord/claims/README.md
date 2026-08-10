# Claims

Create one claim file per active task using `coord/templates/claim.md`.

Claim files are lightweight locks for task scope and expected files. If a claim
exists, read it before acting.

Use claim files instead of thread-only claims when two or more tasks are active
or when agents may touch nearby files, directories, or prose sections.

Default expiry is 90 minutes after the last heartbeat for active coding or
research work. Writing and review tasks may set a longer explicit expiry.

Takeover is never silent. If a claim appears stale, append to the active thread
and escalate to `coord/HUMAN.md` when takeover could risk user work.
