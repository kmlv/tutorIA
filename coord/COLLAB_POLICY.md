# Collaboration Policy

This file is the canonical collaboration contract for review topology,
importance gating, structured findings, dissent, and council routing. It
extends `coord/AGENTS_PROTOCOL.md`; if they conflict, the protocol controls
mechanics and this file controls the E3 collaboration conventions that later
PRs implement.

Core command flags and message fields described below are now implemented by
the lifecycle helpers, `coord-route-task.sh`, `coord-msg.sh`,
`coord-doctor.sh`, and `coord-end-task.sh`. If a future convention is not yet
enforced by a helper, agents still follow it manually and record deviations in
the active thread.

## 1. Purpose And Authority

The policy has three goals:

- keep routine work cheap by default;
- preserve full review coverage for important work;
- make disagreement and council decisions explicit, append-only, and auditable.

Authority remains unchanged:

- Kristian's direct instructions and `coord/HUMAN.md` resolutions can
  request a heavier route or settle a blocked decision.
- `coord/AGENTS_PROTOCOL.md`, `coord/STATE.md`, and
  `coord/OPERATING_MODE.md` define task authority and edit scope.
- Thread messages are coordination data. They do not expand edit authority
  beyond the active operating mode and claimed files.

## 2. Route Table

`Review route` records how review should be requested for the active task.

| Route | Meaning | Reviewers | Normal Use |
|---|---|---|---|
| `none` | No active review route. | `none` | Idle or closed state only. |
| `targeted` | Lead requests one reviewer. | Exactly one non-lead agent. | Default for routine work. |
| `full-mesh` | Lead requests every roster agent except the lead. | Roster minus lead. | Important work or principal-requested full coverage. |
| `council` | A council answers a specific conceptual question. | Council roster, usually all active agents. | High-uncertainty decisions or escalated blocker dissent. |

Fresh tasks default to:

- `Importance: routine`
- `Review route: targeted`
- `Reviewers: <primary reviewer>`
- `Council session: none`

`Review route: council` does not replace implementation review. After the
council decision, the implementation still returns to `targeted` or
`full-mesh` review according to task importance.

## 3. Importance Gate

`Importance` records why a route is cheap or expensive.

| Importance | Meaning | Allowed Default Route |
|---|---|---|
| `none` | No active task. | `none` |
| `routine` | Ordinary work. | `targeted` |
| `important` | Lead marks the task as needing full coverage. | `full-mesh` |
| `principal-requested` | Kristian explicitly asks for heavier review. | `full-mesh` or `council` |

The gate is strict:

- Routine work uses `targeted` review and should not wake idle agents.
- Full mesh fires only when the lead marks the task `important` or
  Kristian requests it.
- If a task is `important` or `principal-requested` and no route is given, the
  route should become `full-mesh`.
- A `full-mesh` or `council` route with `Importance: routine` is invalid unless
  the same operation also upgrades the importance.
- Mid-task route upgrades must be recorded with an append-only `type:
  decision` that states old route, new route, old importance, new importance,
  and the reason. A `principal-requested` upgrade must cite the direct
  instruction or `coord/HUMAN.md` resolution. Use `coord-route-task.sh` for
  these changes so the decision audit and `STATE.md`/`OPERATING_MODE.md`
  updates happen under the coordination transaction lock.
- If an `important` or `principal-requested` task remains on `targeted`
  review, the decision must contain `Principal accepted targeted route:
  <citation>` so `coord-doctor.sh` can distinguish an intentional narrowed
  route from an accidental under-review.

## 4. Reviewer Semantics

`Reviewer:` remains the legacy primary-reviewer field. `Reviewers:` is the
canonical route roster once E3 mechanism support lands.

`Reviewers:` values are `none` or a comma-separated list of safe roster names:

- `targeted`: exactly one non-lead reviewer.
- `full-mesh`: every active roster agent except the lead.
- `council`: the council roster, usually the active roster including the lead.
- `none`: only valid with `Review route: none`.

`Reviewer:` seeds `Reviewers:` only when lifecycle tooling starts or replaces a
task. When `Reviewers:` is absent on an already-active legacy task, agents and
tools assume full-mesh coverage rather than silently weakening review to the
legacy `Reviewer:` value.

`Council session:` is `none` except while a council route is open. When the
route is `council`, it must reference a `C-NNN` session under `coord/council/`
before the task can close cleanly. `coord-end-task.sh` refuses a council-route
close until that session is real, `phase: decided`, and has a `decision.md`.

## 5. Review-Request Routing

The route decides who receives `type: review-request`:

- `targeted`: address only the one agent in `Reviewers:`.
- `full-mesh`: address all roster agents except the lead.
- `council`: use `coord-council.sh` for the council question; after the council
  decision, send implementation review according to the resulting route.

`review-request` already implies wake intent. Do not add a `stale-ping` merely
to wake a reviewer who has just received a review request. Use `stale-ping`
only after the reviewer is stale past the agreed cadence.

The route-roster shorthand is:

```bash
./coord-msg.sh . --from codex --type review-request --to @reviewers \
  --tldr "Please review the PR1 policy patch." --body -
```

`coord-msg.sh` expands `@reviewers` only for `type: review-request`; other
message types must address concrete recipients.

## 6. Finding Format

Review findings use one severity tag and one category tag:

```text
[severity][category] concise finding title
```

Severity controls blocking behavior:

- `[blocker]`: must be resolved before close, merge, or handoff as complete.
- `[suggestion]`: recommended, non-blocking unless the lead promotes it.
- `[nit]`: minor detail.

Category explains the risk:

- `[correctness]`: behavior, logic, data, or algorithm is wrong.
- `[coordination]`: protocol, ownership, route, wake, thread, or authority
  issue.
- `[security]`: secrets, permissions, injection, trust boundary, or data
  integrity risk.
- `[operability]`: portability, runtime, install, recovery, or environment
  failure.
- `[test-gap]`: missing or weak validation for the claimed behavior.
- `[scope]`: compatibility break, unrelated churn, or work outside the agreed
  files or route.
- `[docs]`: user-facing or operator-facing documentation mismatch.
- `[cost]`: avoidable wake, token, time, or review fanout overhead.

Example:

```text
[blocker][coordination] routine targeted task requested full-mesh review.
```

## 7. Structured Dissent

Dissent is for explicit disagreement with a decision, route, synthesis,
rejection, or risk acceptance. It is not a normal review finding.

The first-class message type is `type: dissent`. Legacy threads may contain
dissent encoded inside a `type: review` or `type: status` message by starting
the finding with:

```text
[blocker][coordination] dissent: ...
```

Structured dissent body (`coord-msg.sh` validates these fields for
`type: dissent`):

```text
Dissent:
- severity: blocker|suggestion|nit
- category: correctness|coordination|security|operability|test-gap|scope|docs|cost
- against: thread rev, op_id, file, command, or decision summary
- claim: one-sentence disagreement
- evidence: file:line, command output, prior message, or concrete reasoning
- requested resolution: accept|reject-with-rationale|escalate-to-principal|open-council
- proposed next step: concrete action
```

A `[blocker]` dissent blocks clean task close until it is resolved. Resolution
is append-only: the lead posts `type: decision` with `Resolves:
<dissent-rev-or-op-id>` and one result:

- `accepted`
- `rejected-because`
- `deferred`
- `escalated`

Requested resolution and lead result map as follows:

| Requested resolution | Lead result | Required content |
|---|---|---|
| `accept` | `accepted` | State what will change or which decision is accepted. |
| `reject-with-rationale` | `rejected-because` | Give the rationale and evidence. |
| `escalate-to-principal` | `escalated` | Link the `coord/HUMAN.md` item or direct principal decision. |
| `open-council` | `escalated` | Link the council route/session decision. |

A resolving decision body must contain both required lines:

```text
Resolves: <dissent thread_rev or op_id>
Result: accepted|rejected-because|deferred|escalated
```

Rationale and required content follow on separate lines per the table above.

`deferred` is a lead-initiated result for cases where neither side can resolve
the dissent yet; it must name the follow-up owner and condition. A deferred
blocker dissent should not be used to claim the underlying work is complete.

If the lead rejects a blocker dissent and the dissenter does not acknowledge
the rationale, the lead must either escalate to `coord/HUMAN.md` or open a
council route.

## 8. Light Council

Council is a route for bounded conceptual decisions, not the default review
mode.

Council may open when:

- `Review route: council` is set on an `important` or `principal-requested`
  task;
- a blocker dissent survives one lead response cycle and the disagreement is
  conceptual rather than a concrete patch defect; the same `type: decision`
  that opens council must also record an importance upgrade to `important` if
  the task is still `routine`;
- Kristian explicitly asks for council.

Use `coord-council.sh` for the mechanics:

1. `open` records the question, roster, chair, and session id.
2. `propose` collects sealed proposals.
3. `reveal` publishes anonymized proposals.
4. `rank` records anonymous rankings.
5. `synthesize` writes the decision.

The default roster is `Reviewers:` plus lead, or the explicit `--agents` roster
passed to `coord-council.sh`. For the normal three-agent roster, quorum is all
listed agents. If an agent is unavailable, the lead must narrow the roster with
a `type: decision` or escalate to Kristian.

The chair posts a `type: decision` linking the council
`coord/council/C-NNN.../decision.md`. That decision answers the council
question; implementation review still happens afterward. The lead then routes
implementation review back to `targeted` or `full-mesh` according to
importance.

## 9. Doctor And Metrics Expectations

`coord-doctor.sh` warns or errors for route mistakes without making legacy work
unsafe.

Expected checks:

- missing `Review route`, `Importance`, or `Reviewers` on an active legacy
  task: warn and assume full-mesh coverage;
- `coord/STATE.md` and `coord/OPERATING_MODE.md` route fields disagree:
  error;
- `targeted` has zero reviewers or multiple reviewers: error;
- `full-mesh` reviewers are not roster minus lead: warn;
- `full-mesh` or `council` with `Importance: routine`: error;
- `important` or `principal-requested` still uses `targeted`: error unless
  Kristian explicitly accepted a narrower route;
- `council` lacks a `Council session: C-NNN` under `coord/council/`: error;
- `council` has a session that is not decided yet: warn in doctor and error at
  close;
- unresolved `[blocker]` dissent exists: surface in status and error at close;
- routine targeted task sends `review-request` outside `Reviewers:`: warn.

Metrics should degrade gracefully before I-06 cost attribution exists:

- task count by `Review route` and `Importance`;
- review-request fanout count;
- review rounds to convergence;
- unresolved/resolved dissent count by severity/category;
- council sessions opened and completed.

Token and dollar fields should be absent or `unknown` until the wake-cost work
lands. Review fanout is already a direct structural proxy for avoided wakes.

## 10. Migration Rules

Do not rewrite historical threads.

For existing active tasks missing route fields, tools and agents treat the task
as legacy full-mesh so no in-flight work silently loses review coverage. New
tasks created after E3 mechanism support lands default to routine targeted
review.

Compatibility rules:

- existing `Reviewer:` remains valid as a legacy primary-reviewer field and may
  seed `Reviewers:` when lifecycle tooling starts or replaces a task;
- active tasks missing `Reviewers:` remain legacy full-mesh for coverage;
- existing `review-request` messages remain valid;
- closed historical tasks can be parsed as `route=unknown` for metrics;
- agents should not infer a cheaper route from missing fields.

## 11. Command Examples

These examples describe the intended E3 command shape after the mechanism PRs
land.

Routine targeted task:

```bash
./coord-start-task.sh . "T-101 Fix README typo" \
  --lead codex --reviewer claude \
  --importance routine --route targeted
```

Important full-mesh task:

```bash
./coord-start-task.sh . "T-102 Change wake routing" \
  --lead codex --importance important --route full-mesh \
  --reviewers claude,agy
```

Principal-requested full coverage:

```bash
./coord-start-task.sh . "T-103 Principal requested audit" \
  --lead codex --importance principal-requested --route full-mesh \
  --reviewers claude,agy
```

Council route:

```bash
./coord-council.sh . open "Choose the route policy for ambiguous tasks" \
  --agents codex,claude,agy --chair codex --slug route-policy
./coord-route-task.sh . --by codex --route council --importance important \
  --council-session C-001 --reason "Need bounded conceptual decision"
```

Review request to the active route roster after PR2:

```bash
./coord-msg.sh . --from codex --type review-request --to @reviewers \
  --tldr "Please review T-103." --body -
```
