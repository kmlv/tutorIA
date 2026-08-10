# Coordination Provenance

Record where this project's coordination protocol came from and any local
adaptations. This keeps local installs honest about which canonical version
they track and why they diverged.

The header fields below always reflect the latest update and are maintained
by `bootstrap.sh` / `coord-update.sh --apply`; the log keeps the history.

Protocol: agent-filesystem-collaboration

Protocol version: 0.4.22

Installed from: fdc77d2

Installed UTC: 2026-08-10T16:44:23Z

Kit scripts dir: /Users/klopezva/.aistigmergy/kit

## Update Policy

Apply reusable protocol improvements to the canonical protocol source first,
then update this installation from a recorded source commit or tag. Treat
local-only changes to reusable protocol files as a review `[blocker]`.

## Protocol Update Log

Append one block per import or upgrade from the canonical source.

- Imported: 2026-08-10T16:44:23Z
- Source commit: fdc77d2
- Source protocol version: 0.4.22
- Rationale: initial install via bootstrap.sh

## Local Protocol Deviations

None.

## Approved External Imports

Record every artifact imported from another repository that is not a protocol
template. Anything not listed here must not be imported.

| Date UTC | Artifact | Source repo/commit | Approved by | Thread |
|---|---|---|---|---|
