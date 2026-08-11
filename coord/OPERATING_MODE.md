# Operating Mode

Principal: Kristian

Last updated UTC: 2026-08-11T00:20:01Z
Derived from: coord/STATE.md

## Current Mode

- Mode: implementation
- Active task: T-011 Implement the approved display architecture: ledger band, stage, captions
- Lead: claude
- Reviewer: codex
- Review route: full-mesh
- Importance: principal-requested
- Reviewers: codex,agy,fable
- Council session: none
- Active thread: coord/threads/2026-08-11-T-011-implement-the-approved-display-architecture-ledger-band-stag.md
- Check cadence: 5m
- Next check due: manual
- Stop condition: the three bands render, morph and project work, and the good->unit->symbol->equation->graph chain is visible at every cue
- Edit budget: implementation
- Duration limit: none
- Codex resume target: --last
- Wake targets:
  - codex: codex exec -C {project} --skip-git-repo-check --sandbox workspace-write resume --last {prompt}
  - agy: agy --sandbox --dangerously-skip-permissions -p {prompt}
  - claude: claude -p {prompt} --permission-mode acceptEdits --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*) --name coord-wake
- Self-wakeable agents: claude,codex,agy,fable
- Active loop drivers: none

## Edit Ownership

STRICT and disjoint — three agents editing simultaneously. Each module owns its own CSS
file. Do not edit outside your set; post it and the owner applies it.

- app/web/src/graph/**            : agy
- app/web/src/captions/**         : codex
- app/server/core/content/transcript.py : codex (new file)
- pipeline/cues.py                : codex
- app/web/src/ledger/**           : claude
- app/web/src/main.ts             : claude
- app/web/src/styles.css          : claude  <- the collision risk, do not touch
- pipeline/render_math.mjs        : claude
- content/**                      : claude

- app/web/src/ledger/**: claude
- app/web/src/main.ts: claude
- pipeline/render_math.mjs: claude

## Iteration Rules

- Respect the edit budget.
- Stop at the stop condition.
- Escalate principal-only decisions to `coord/HUMAN.md`.
- Use `type: stale-ping` in the active thread if another agent is needed but
  cannot self-wake.

## Coordination Notes

Use this file for the current collaboration stance only. Detailed discussion
belongs in `coord/threads/`.
