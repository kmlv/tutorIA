# T-005 M2 parallel: graph manipulation (agy) + grader review (codex) + question flow (claude)

---
from: system
to: claude,codex,agy,fable
ts_utc: 2026-08-10T23:38:41Z
type: status
ack: false
task: T-005
op_id: T-005-task.start-4baa3e2d6d73c082
lead: claude
reviewer: codex
review_route: full-mesh
importance: principal-requested
reviewers: codex,agy,fable
council_session: none
cadence: 5m
duration: none
edit_budget: implementation
files_owned:
  - app/web/src/questions/**
  - app/web/src/main.ts
  - app/web/src/chat/**
---

TL;DR: Task T-005 started in mode 'implementation'.

Task: M2 parallel: graph manipulation (agy) + grader review (codex) + question flow (claude)

Stop condition: manip.ts merged, grader review answered, and the four question types run end to end

Lead: claude

Reviewer: codex

Review route: full-mesh

Importance: principal-requested

Reviewers: codex,agy,fable

Council session: none

- system

---
from: claude
to: agy,codex
ts_utc: 2026-08-10T23:39:27Z
type: stale-ping
ack: false
task: T-005
op_id: T-005-message.append-15b0a428e2298458
thread_rev_seen: 1
thread_rev: 2
---

TL;DR: T-005 parallel work. agy: implement drag manipulation in app/web/src/graph/ (owns that dir). codex: READ-ONLY review of deterministic.py + schema.py, focus on eval_expr sandbox and the directional diagnosis. Strict disjoint ownership, we edit at the same time.

T-005 — parallel work on M2. Two independent assignments, disjoint file ownership.

PROJECT LANGUAGE CHANGED (Kristian, 2026-08-10): everything in the repo is now ENGLISH —
docs, code, comments, commit messages, coord messages, and default pack content. Only the
audio explainers in docs/audio/ stay Spanish, because those are for Kristian personally.
Existing files are still Spanish because the instruction arrived mid-M2; write NEW work in
English and do not mass-rename anything.

## Where the project is

M0 and M1 are done. M2 (option A of the bake-off) runs end to end today:

  - `pipeline/cues.py` compiles a script with `<!--cue:X-->` marks into audio +
    `timeline.<lang>.json`. AudioExplainer does NOT strip HTML comments (verified: a
    script with one comment is 6s vs 4s without), so the compiler strips them before
    synthesis and matches each mark to the start_s of the sentence that followed it.
  - `app/web/src/player/sync.ts` fires cues on `previousTime < t <= currentTime`
    (idempotent) and records the internal lag of each firing. p95 measured at 58–73 ms
    on the dev machine. This replaces the phone-recording method Kristian cut.
  - `app/web/src/player/adapter.ts` — `MediaAdapter`. Option A implemented; B/C/D land
    in M4. The runtime only touches media through this interface.
  - `app/web/src/graph/budget_graph.ts` — SVG graph with FIXED scale (rescaling axes on
    an income change would make a parallel shift look like a pivot).
  - Notes panel with KaTeX pre-rendered at build time by `pipeline/render_math.mjs`
    (C3: zero KaTeX JS at runtime).
  - `app/server/core/judge/deterministic.py` — numeric, MCQ and manipulation graders.

Run it: `source .venv/bin/activate && python -m uvicorn app.server.main:app --port 8000
--reload` and `cd app/web && npx vite`. Then http://localhost:5173/?lang=en

## ASSIGNMENT — agy

You own `app/web/src/graph/**`. Implement **drag manipulation** of the budget line.

Two question kinds in `content/packs/budget-line/questions.yaml` need it:

  - `q_feas_manip` (`verificacion.tipo: region`) — the student drags a POINT to a bundle
    strictly inside the budget set.
  - `q_cs_m_manip` and `q_cs_p_manip` (`verificacion.tipo: recta`) — the student drags
    the LINE ENDPOINTS to the new position after a change in income or in a price.

Requirements:

  1. New file `app/web/src/graph/manip.ts`. You may also edit `budget_graph.ts`, which is
     yours for this task. Do not touch anything outside `app/web/src/graph/`.
  2. Export something the caller can drive, e.g.
     `enableDrag(graph, mode: "point" | "line", onChange)`, and a way to disable it.
     `main.ts` is mine — I will wire it. Tell me the exact signature in the thread.
  3. The client NEVER decides correctness. It reports what the student built —
     `{x1, x2}` for point mode, `{p1, p2, m}` for line mode — and the server grades it.
     Do not put tolerances or expected answers in the browser: the student could read
     them in the bundle.
  4. Keyboard accessible. Decision 22 is explicit that the manipulable graph needs a
     textual alternative and keyboard operation; without it this question type is
     unusable for anyone not using a mouse. Arrow keys to move, with a coarse step and a
     fine step (shift). Announce the current value via the existing `aria-label`.
  5. Pointer Events, not mouse events, so it works with touch. `setPointerCapture`.
  6. Criterion 5 is in force: this must stay smooth on a weak CPU. Do not re-render the
     whole SVG on every pointer move — move only the dragged element and recompute the
     line, and coalesce with `requestAnimationFrame`.
  7. `npx tsc --noEmit` must pass. `strict` is on and `noUnusedLocals` too.

Post in the thread when done: the exported signature, and anything in `budget_graph.ts`
you had to change.

## ASSIGNMENT — codex

READ-ONLY review. Do not edit any file. Two targets:

  1. `app/server/core/judge/deterministic.py` and `tests/test_graders.py`.
  2. `app/server/core/content/schema.py` — specifically the `Pack` model validator.

What I actually want scrutinised, in order of how much it would hurt to get wrong:

  a. **`eval_expr`.** It parses expressions from content files with `ast` and an operator
     allowlist, because those files may one day be emitted by an LLM. Is the allowlist
     airtight? Can anything reach attribute access, calls, comprehensions, or huge
     exponents that would hang the process?
  b. **Directional diagnosis in `grade_manip`.** The claim is that comparing slope and
     intercept separately distinguishes "rotated when it should have shifted" (BL-M2)
     from "moved the intercept that does not change" (BL-M3). Is there a student input
     that lands on the wrong misconception, or on none when it should land on one?
  c. **`grade_numeric` diagnosis.** It matches the wrong answer against alternative
     expressions. With `q_slope_numeric` the correct answer is −3 and the tolerance is
     0.01; check the diagnostic branches cannot collide or shadow each other.
  d. **`Pack._integridad_referencial`.** It claims to enforce that every essential
     sub-skill can actually reach mastery given the question bank. Is the arithmetic
     right — `aciertos_consecutivos - max_evidencias_del_juez_llm`?
  e. Anything in `tests/test_graders.py` that asserts something weaker than it appears to.

You have caught four registry errors of mine already, and in two of those the fix I wrote
was itself wrong. Assume the same rate here. Report as `[blocker]` / `[suggestion]` /
`[nit]` in the thread; I apply the fixes since the files are mine.

## What I am doing meanwhile

`app/web/src/questions/**`, `main.ts` and `chat/**`: wiring the four question types into
the dock, submitting to `POST /api/session/{id}/answer`, and showing the socratic probe
that comes back when a misconception is detected.

## Rules

- Edit budget: implementation, but ONLY inside your own paths. Ownership is in
  `coord/OPERATING_MODE.md` and it is strict — we are working simultaneously.
- Post a `claim` before you start editing.
- Do not run `git commit`; I commit at the end so the history stays coherent.
- English, per the note at the top.

- Claude
