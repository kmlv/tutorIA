---
protocol_name: agent-filesystem-collaboration
protocol_version: 0.4.22
principal: Kristian
agents: claude,codex,agy
---

# Agent Filesystem Collaboration Protocol

This repository uses `coord/` as the shared coordination surface for AI agents.
Read this file, `coord/STATE.md`, `coord/OPERATING_MODE.md`, and the active thread before nontrivial work.

## First Principles

- The filesystem-backed coordination state is the shared source of truth.
- Read `coord/AGENTS_PROTOCOL.md`, `coord/STATE.md`,
  `coord/OPERATING_MODE.md`, and the active thread before acting.
- Do not begin nontrivial work without a visible claim. When the optional task
  ledger is installed, add nontrivial user-supplied repo work to
  `coord/BOARD.md` or attach it to an existing task before acting.
- Prefer small, inspectable changes over broad rewrites.
- Write coordination notes for the next reader, not just the current turn.
- Keep `coord/` coordination in English for greppability; user-facing
  artifacts follow the project's language and style.
- Default to the comprehensive, quality-preserving path when it materially
  improves confidence, unless Kristian asks for speed or narrower scope.
- Respect approval gates in `coord/HUMAN.md`; a gate blocks the named step
  until Kristian resolves it.
- When unsure whether coordination is required, coordinate first.

## Required Loop

0. **On receiving a new task — check first, then announce.** Before any
   nontrivial work, verify whether another agent is already working on
   overlapping scope:

   - Read `coord/STATE.md` for active tasks and their leads.
   - Read `coord/OPERATING_MODE.md` for current ownership and the
     bounded-files set.
   - Skim recent thread messages for unresolved `claim` / `status`
     entries without a closing `iteration-stop` or `handoff`.
   - Check `coord/claims/` if the task-management module is installed.

   Then:

   - If an overlap exists, post a `type: status` or `type: handoff`
     coordinating before starting. Do not pre-empt the other agent.
   - If no overlap, post a `type: claim` announcing the scope, files,
     stop condition, and expected reviewer **before** the first
     nontrivial edit.

   The start-work note must be concrete: say what work is starting now
   and which files, directories, or document sections the agent expects
   to touch. This is especially important for prose documents, papers,
   and shared sections where two agents can otherwise edit nearby text
   without realizing their scopes overlap. If overlap is possible, narrow
   the scope, wait for acknowledgement, or ask Kristian before
   proceeding.

   This applies whether the task arrived via chat, an
   `OPERATING_MODE.md` flip, a `HUMAN.md` resolution, or an in-flight
   handoff. Never start nontrivial work silently.

0a. **Coordinate in the current project first.** If the user conversation or
   active agent session is happening in repository/project A, write the primary
   coordination message in A's `coord/` first, even when the subject or target
   files live in repository/project B. Cross-repo target `coord/` surfaces may
   receive pointers, mirrors, or later claims, but they must not become the
   only place where the current conversation is coordinated unless the
   principal explicitly switches projects.

0b. **Respect project boundaries.** The active repository/project is the only
   default write scope. Any other repository is monitor-only unless the
   principal explicitly says the session has switched to that repository or
   explicitly authorizes named cross-repo write paths. Requests such as
   "look", "monitor", "check", "watch", "report", or "see what they are
   doing" authorize read-only inspection and summary, not edits, generated
   artifacts, commits, or pushes in the other repository.

1. Read `coord/STATE.md`.
2. Read `coord/OPERATING_MODE.md`.
3. Read the active thread listed in `STATE.md`, if any.
4. Before nontrivial edits, append a `claim` or `status` message to the active
   thread with lead, scope, owned files, and any document sections you expect
   to touch.
5. Work only inside your claimed scope.
6. Do not overwrite another agent's work.
7. Report validation and open questions in the thread.
8. Keep operational state visible: if work is waiting on a promised review, blocked by another agent, stale beyond cadence, or dependent on a handoff/ETA, update `coord/STATE.md` or `coord/OPERATING_MODE.md` in the same turn so the principal can see who has the ball without reading the whole thread.
9. Ask for cross-review on important changes.
10. Escalate unresolved decisions to `coord/HUMAN.md`.

## Partner Notification

This section is conditional: use it when two or more agents are actively
coordinating on the same task, such as parallel work, lead/reviewer handoff, or
planned cross-review. Single-agent usage, read-only questions, and status
checks can skip it.

- When an agent receives an artifact-producing task, notify partner agents
  immediately with a heads-up before drafting or opening a substantive plan,
  then post the fuller brief after scope is clear.
- During active work, notify partners at significant state changes: blockers,
  scope changes, hot-file edits, sub-agent or background-process dispatch and
  return, build/test/render results that change next steps, review handoff, and
  commit or push preparation.
- Use the active thread, an appropriate wake mechanism, or both. The purpose is
  to prevent surprises, not to generate no-op pings.

## Directory Roles

- `coord/AGENTS_PROTOCOL.md`: protocol mechanics and baseline coordination
  rules.
- `coord/COLLAB_POLICY.md`: review route, importance gate, structured finding,
  dissent, and council-routing conventions.
- `coord/STATE.md`: single source of truth for the principal, roster, protocol
  version, active task/thread/status, ownership snapshot, and visible
  blocked/waiting states.
- `coord/OPERATING_MODE.md`: derived/auto-stamped operational view of the
  current lead, reviewer, cadence, wait ownership, pause/stop state, and edit
  budget.
- `coord/HUMAN.md`: queue for decisions only Kristian can make.
- `coord/PROVENANCE.md`: protocol source/version record and approved external
  imports.
- `coord/PROFILES.md`: optional working hypotheses about agent strengths,
  preferences, and learning notes; update it from retros and evidence, not
  from vibes.
- `coord/threads/`: append-only coordination conversations.
- `coord/work/<agent>/`: scratch, storyboards, audit notes, drafts. Other agents may read these files for transparency, but only the owning agent writes there unless a thread message explicitly hands off ownership.
- `coord/memory/`: optional shared cross-agent memory; not authoritative project state. Private agent memory belongs in the agent-specific memory system, not here.

## Authoritative vs Derived State

`coord/STATE.md` is authoritative for the active coordination state. Treat
`coord/OPERATING_MODE.md` and optional `coord/BOARD.md` as derived operational
views: lifecycle helpers stamp them from `STATE.md`, and `coord-doctor.sh`
warns when they appear stale or disagree with the STATE-derived active task.

If these files conflict, trust `STATE.md`, refresh the derived view with the
lifecycle helper, and report the mismatch in the active thread. The full
collapse of `STATE.md`, `OPERATING_MODE.md`, and `BOARD.md` into one file is
deferred from T-019 Q4 until the derived-state invariants have proven stable.

## Thread Message Format

**Append new messages to the END of the thread file.** Do not insert messages at the top of the file, in the middle, or above any prior message. After editing, `head` of the file shows the oldest content and `tail` shows the newest. New messages always go at the bottom.

Append messages with frontmatter:

```markdown
---
from: codex
to: claude
ts_utc: 2026-05-07T21:49:00Z
type: claim|proposal|review|review-request|ack|status|decision|dissent|handoff|iteration-start|iteration-check|iteration-stop|stale-ping|protocol-gap|reconcile|protocol-test
ack: false
task: T-001
lead: codex
thread_rev_seen: 12
thread_rev: 13
files_owned:
  - path/or/glob
---

TL;DR: one sentence.

Body.

- Codex
```

Each message declares exactly one `type`. Do not combine types with `|` in an
actual message (for example `status|handoff`); the `|`-separated list above is
the menu of allowed values, not a compound. If a message both reports status and
hands off, post the `handoff` and let the body carry the status. `review-request`
is a directed ask for review (a `to:` recipient is expected). `protocol-test` is
a sanctioned ephemeral type for connectivity/protocol probes; such messages and
any `coord/work/<agent>/protocol-test.md` markers may be pruned after the probe
and should not be treated as durable coordination.

Use UTC ISO-8601 timestamps. Append order is authoritative for message order. Append order = file order from top to bottom: the first message is at the top of the file, each new message is appended below all previous messages, and the last message is at the bottom. Timestamps are for audit and should be distinct when practical, but file order, not the `ts_utc` value, defines causal ordering between messages.

Thread filenames should follow `YYYY-MM-DD-T-NNN-slug.md` when a task id exists, so threads remain sortable.

## Concurrency Safeguards

Threads are append-only, but agents can still race on stale reads. For
nontrivial coordination messages, include `thread_rev_seen`, the count of prior
frontmatter blocks observed before writing. `thread_rev` may record the expected
post-append revision, but it is informational because races can make it stale.

**Atomic-append is a HARD RULE, not a recommendation.** Every thread write MUST
go through the coord MCP `coord_post` tool OR the `coord-msg.sh` helper. Both
take the atomic per-thread lock and maintain `thread_rev` (and fill `ts_utc` and
`thread_rev_seen`) for you. Do not append to a thread by any other means.

**NEVER edit/patch `coord/threads/*.md` by hand or with apply_patch-style
tools.** Patch tools match on context anchors, and thread messages are full of
non-unique anchors (for example a prior `- Codex` signature, or a repeated
`---`/`from:` delimiter). A patch tool will match the wrong anchor and insert
the new content mid-file, corrupting message order and forcing a `reconcile`.
Editors that rewrite the whole file can also clobber a concurrent append. The
only safe writers are `coord_post` and `coord-msg.sh`.

The ONLY exception is emergency recovery of an already-corrupted thread (for
example, repairing message order after a botched manual write). Such a manual
repair MUST be immediately followed by a `type: reconcile` message — posted via
`coord_post` or `coord-msg.sh` — summarizing what was repaired and what other
agents must revisit.

Do not hand-paste literal frontmatter (a bare `---` line immediately followed
by a `from:` line) into a message body; it is byte-identical to a real message
delimiter and can confuse thread parsers. `coord_post` and `coord-msg.sh`
neutralize this case automatically — another reason all writes must go through
them.

After appending a nontrivial message, re-read the thread tail. If another
message landed after your read and changes your assumptions, append
`type: reconcile` summarizing the crossed messages and what must be revisited.

The hot shared coordination files are `coord/STATE.md`,
`coord/OPERATING_MODE.md`, `coord/PROVENANCE.md`, and
`coord/AGENTS_PROTOCOL.md`. Before editing a hot file, record a preflight note
in the active thread with `file`, `sha256_before`, and `thread_rev_seen`; after
editing, report `sha256_after`. `coord/work/<agent>/` files are write-owned by
their agent and do not need hot-file preflight.

During iteration windows, the lead is the single writer for hot shared files.
The reviewer proposes hot-file changes in the thread unless ownership is
explicitly handed off.

## Ownership

For nontrivial edits, declare ownership before editing. Ownership can be a file,
directory, task, or responsibility area. If ownership overlaps, coordinate in the
thread before editing.

Claims can be thread messages in v1. Separate claim files are optional only when
race risk is high. Ownership is the union of open claims for the same agent and
task; later narrower messages do not release earlier ownership unless they
explicitly say so. Release ownership with `type: handoff`, `type:
iteration-stop`, or task closure.

## Optional Task Management

For parallel, multitask, or high-race projects, install the task-management
module. Keep it opt-in: single-lane work can stay in the active thread unless
ownership, review, or decision history becomes hard to scan.

- `coord/BOARD.md`: the derived visible queue for Backlog, Doing, Review, and
  Done when the optional ledger is installed.
- `coord/claims/`: one claim file per active task/scope.
- `coord/templates/`: short task, claim, decision, peer-review, and retro
  templates.
- `coord/decisions/`: durable decision records.
- `coord/reviews/`: substantial or closing peer-review artifacts.
- `coord/retros/`: optional lessons learned after coordination-heavy tasks.

Use finalized retros as the evidence trail for updates to `coord/PROFILES.md`.
Profiles are working hypotheses; do not update them from informal impressions
alone.

Install or use it when two or more tasks are active, several agents may touch
nearby files or prose sections, a task needs durable decisions/reviews, or a
post-iteration retro should capture whether agents followed their own rules and
what Kristian corrected. The ledger is also the intended home for future
council scoreboards or other per-task comparison artifacts.

When installed, every nontrivial user request becomes either a `BOARD.md` task
or is explicitly attached to an existing task. Before touching project files
outside `coord/`, an agent must have either a claim file or a thread claim that
names the files or scope. If two or more tasks are active, use claim files
rather than thread-only claims.

`Done` requires: claimed scope complete, checks recorded, latest peer review has
no blockers, no visible blocked/waiting state remains, and durable decisions
recorded when they affect future analysis, writing, or implementation.

Keep at most three tasks active across Doing and Review unless the principal
explicitly approves a higher cap. Additional requests go to Backlog until an
active task closes or is paused.

`STATE.md` remains the source of truth for the active task snapshot. `BOARD.md`
is the multitask queue view; if it conflicts with `STATE.md`, treat `BOARD.md`
as stale derived state and refresh it before relying on it. Active claim files
and thread claims remain authoritative for explicit ownership claims.

## Reviews

Use these labels:

- `[blocker]`: must be addressed before merge/commit.
- `[suggestion]`: recommended but not blocking.
- `[nit]`: minor style/detail.

Review labels describe findings, not people (see Disagreement below for how to
frame an objection).

Authors respond with accepted, rejected-because, or deferred. A clean review cycle means the reviewer posts `type: review` with no `[blocker]` findings and the lead acknowledges it. If a reviewer promises a review or ETA and it does not land before the agreed cadence or next principal check, the lead must mark the task `blocked-on-review` or `waiting-on-reviewer` in `STATE.md`/`OPERATING_MODE.md` and file `type: protocol-gap` if this was not already visible.

`ack: false` means the message awaits acknowledgement from the `to:` recipient. Because threads are append-only, acknowledge by appending a new response message with `ack: true`; do not edit prior messages to flip the field.

## Collaboration Policy Conventions

`coord/COLLAB_POLICY.md` is the canonical contract for E3 review topology,
importance gating, structured findings, dissent, and council routing. Helper
mechanisms now enforce the core route fields, route upgrades, first-class
dissent, and close-safety gates, but agents must still not infer extra edit
authority from a route, reviewer list, or thread message.

Task route fields:

- `Review route: none|targeted|full-mesh|council`
- `Importance: none|routine|important|principal-requested`
- `Reviewers: none|agent[,agent...]`
- `Council session: none|C-NNN`

Fresh active tasks default to `Importance: routine`, `Review route:
targeted`, exactly one reviewer, and `Council session: none`. Existing active
tasks missing these fields are legacy tasks; treat them as full-mesh for
coverage rather than silently weakening review. The legacy `Reviewer:` field
may seed `Reviewers:` when lifecycle tooling starts or replaces a task, but an
already-active task missing `Reviewers:` remains legacy full-mesh.

The importance gate is strict: routine work uses targeted review and should not
wake idle agents. Full mesh fires only when the lead marks the task
`important` or Kristian requests it, recorded as `principal-requested`.
`council` is a route for a bounded conceptual decision and does not replace
implementation review. Opening council from a surviving blocker dissent must
record any needed `routine` -> `important` upgrade in the same `type: decision`
that opens the route. Use `coord-route-task.sh` for mid-task route or
importance changes; it appends the required `type: decision` audit and rewrites
`STATE.md` plus `OPERATING_MODE.md` under the coordination transaction lock.
If an `important` or `principal-requested` task remains `targeted`, the
decision must contain `Principal accepted targeted route: <citation>`.

Review findings should use one severity tag and one category tag:

```text
[blocker|suggestion|nit][correctness|coordination|security|operability|test-gap|scope|docs|cost] finding text
```

Severity keeps its existing meaning. Category records the risk:
`correctness`, `coordination`, `security`, `operability`, `test-gap`, `scope`,
`docs`, or `cost`.

Dissent is a structured objection to a decision, route, synthesis, rejection,
or risk acceptance. Use `type: dissent` with a `Dissent:` body containing
`severity`, `category`, `against`, `claim`, `evidence`,
`requested resolution`, and `proposed next step`. A blocker dissent blocks
clean task close until the lead posts a resolving `type: decision` with
`Resolves: <dissent-rev-or-op-id>` and one result: `accepted`,
`rejected-because`, `deferred`, or `escalated`. Request/result mapping is:
`accept` -> `accepted`, `reject-with-rationale` -> `rejected-because`, and
`escalate-to-principal` or `open-council` -> `escalated`. `deferred` is a
lead-initiated result that must name the follow-up owner and condition. If
rejection does not converge, escalate to `coord/HUMAN.md` or open a council
route.

Council-as-route reuses `coord-council.sh`: sealed proposals, anonymized
ranking, Borda tally, and chair synthesis. The chair posts a `type: decision`
linking the `coord/council/C-NNN.../decision.md`; after that, implementation
returns to targeted or full-mesh review according to importance. A task on
`Review route: council` cannot close cleanly unless `Council session: C-NNN`
points at a real decided session under `coord/council/`.

## Disagreement

Critique code, scope, assumptions, or risk; never the person. A disagreement
must include both the reason and a concrete alternative.

If two rounds do not converge, stop debating and add the decision to
`coord/HUMAN.md`.

## Heartbeats

When agents are actively coordinating and waiting on each other, they should
check or append at the agreed cadence. Automation is optional. The protocol must
still work when agents only wake on user invocation.

### Iteration Mode

Iteration mode is an optional operating mode for unattended or lightly
supervised collaboration.

Required fields live in `coord/OPERATING_MODE.md`:

- active task;
- lead and reviewer;
- active thread;
- check cadence;
- next check due;
- stop condition;
- edit budget;
- wake targets for agents that an external wrapper should be able to wake;
- file ownership.
- active loop drivers, if any, with agent, mechanism, cadence, started_at,
  stop_condition, persistence, and last_seen_thread_rev.

Use `type: iteration-start` when entering iteration mode, `type:
iteration-check` for periodic updates, and `type: iteration-stop` when the stop
condition is met. Closed threads stay in `coord/threads/`; `coord/STATE.md` stops pointing to them. Add a final `type: handoff`, `type: decision`, or `type: iteration-stop` message summarizing the resolution.

Before `iteration-stop`, verify: canonical source is clean if touched; local
provenance is updated; no pending `ack: false` message is directed at the lead;
the latest review has no `[blocker]`; the reviewer's latest message is acked by
the lead; and active loop drivers are stopped or explicitly allowed to expire.

Edit budgets:

- `read-only`: inspect and report only.
- `proposal-only`: edit only `coord/` artifacts.
- `bounded-files`: edit only listed `files_owned`.
- `implementation`: broader implementation allowed, but still constrained by
  the active task and ownership.

### Heartbeat Asymmetry

Some agents can self-wake or loop; others only respond when invoked by the
principal or external tooling. The protocol must be honest about that.

- If an agent can monitor on a timer, it may check the active thread at the
  configured cadence.
- If an agent cannot self-wake, it responds on the next invocation.
- If an agent is needed but appears stale, append `type: stale-ping` to the
  active thread with `to:` and `waiting_since:`.
- If `coord/OPERATING_MODE.md` lists a wake target for an agent under
  `Wake targets`, an external wrapper may run `coord-pulse.sh --agent NAME`
  to wake it with the active thread. `coord-codex-pulse.sh` is deprecated (a shim
  that delegates to `coord-pulse.sh --agent codex`); `coord-pulse.sh --agent
  codex --print-prompt` prints the prompt for an interactive `codex resume`.
- **Review-request implies wake.** Posting a `type: review-request` to a
  reviewer carries wake intent: the orchestrator should wake that reviewer with
  the active thread. A separate `type: stale-ping` is not needed merely to wake
  a reviewer who has just been sent a review-request; reserve `stale-ping` for
  an agent that has gone quiet past cadence.
- **Takeover after N stale-pings.** If the lead or owner does not respond after
  N (default 3) `type: stale-ping`s across the check cadence, a waiting agent
  MAY post a `type: handoff` taking over the task and demoting the unresponsive
  agent to reviewer. Record the takeover in the active thread (and update
  `coord/STATE.md` / `coord/OPERATING_MODE.md`). The principal can override the
  takeover via `coord/HUMAN.md`.
- **Self-wakeable vs principal-relayed.** `coord/OPERATING_MODE.md` declares
  which agents can self-wake — those with a working wake target and valid
  auth — versus those the principal must relay. When a wake fails on
  authentication or credit, `coord-pulse.sh` escalates rather than silently
  dropping the wake (see `coord-pulse.sh --log`).
- **Sandbox-blocked wakes fail loud.** If `coord-pulse.sh` reports
  `ISSUE-004` (no first output, startup `EPERM` under CLI HOME/config,
  localhost-bind denial, or pre-turn vendor auth failure), the waker asks
  Kristian to authorize the printed Terminal command from an unsandboxed
  HOME/network/localhost-capable shell. A write-confined agent such as codex
  under `--sandbox workspace-write` must not keep retrying the same child from
  inside that sandbox; the child inherits the same jail and will fail again.

The principal should only need to intervene for `coord/HUMAN.md` items,
visible `blocked-*` / `waiting-*` states, `stale-ping` re-invocation, or
stop-condition decisions.

If the principal finds themselves repeatedly brokering messages that agents
should read from the thread, or asking "where are we?" because a wait/blocker
is only implicit in the thread, file `type: protocol-gap`.

Avoid no-op thread appends during scheduled loops; they clutter the audit trail.
It is acceptable to update local liveness counters in `coord/OPERATING_MODE.md`
when there is no substantive thread message to add.

## Quality Rules

- Read before writing.
- Keep threads append-only.
- Coordinate in the current project first; for cross-repo work, leave a pointer
  in the current project's active thread before moving detailed work elsewhere.
- Treat other repositories as monitor-only by default. Do not edit, generate
  artifacts, commit, or push outside the active project unless the principal
  explicitly switches the session or names the cross-repo write paths.
- Keep `STATE.md` concise, but never hide active waits, blockers, stale promises, or ownership ambiguity for brevity.
- Do not import files, decisions, threads, work notes, memory files, examples, adapters, reviews, retros, or other project-specific artifacts from other repositories unless they are protocol templates explicitly named in the active thread or in `coord/PROVENANCE.md`.
- Apply reusable protocol improvements to the canonical protocol source first, then update project-local installations from a recorded source commit or tag. Treat local-only reusable protocol changes as a review `[blocker]`.
- Record approved external protocol imports in `coord/PROVENANCE.md`.
- Announce every nontrivial coordination action in the active thread in the
  same turn, including starting or stopping loops, scheduling jobs, editing
  `coord/` files, changing operating mode, or beginning work outside `coord/`.
  This keeps agents working from shared state instead of stale local context.
- Do not commit or push unrelated WIP.
- Commit per coherent task.
- Prefer evidence: command output summaries, screenshots, diffs, citations.
- Do not call the principal "human" in project-facing prose when a name is
  configured. Use "Kristian" here. Template-inherited filenames such as `coord/HUMAN.md` are exempt.
- If unsure whether a decision belongs to the principal, ask in the thread or
  add it to `coord/HUMAN.md`.
