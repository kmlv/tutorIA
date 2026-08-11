# T-011 Implement the approved display architecture: ledger band, stage, captions

---
from: system
to: claude,codex,agy,fable
ts_utc: 2026-08-11T00:20:01Z
type: status
ack: false
task: T-011
op_id: T-011-task.start-784aeba24860bfc9
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
  - app/web/src/ledger/**
  - app/web/src/main.ts
  - pipeline/render_math.mjs
---

TL;DR: Task T-011 started in mode 'implementation'.

Task: Implement the approved display architecture: ledger band, stage, captions

Stop condition: the three bands render, morph and project work, and the good->unit->symbol->equation->graph chain is visible at every cue

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
ts_utc: 2026-08-11T00:20:59Z
type: stale-ping
ack: false
task: T-011
op_id: T-011-message.append-b84f0800d800ab01
thread_rev_seen: 1
thread_rev: 2
---

TL;DR: T-011 IMPLEMENTATION. Kristian approved the design and resolved both questions: coffee is x1 (pack unchanged), and intermediate choreography — only the morph and project verbs, no dock or clone-travel. agy takes the stage, codex takes the captions band, I take the ledger. Strict disjoint ownership.

T-011 — implement the approved display architecture. Three parallel assignments.

Kristian approved `docs/DISPLAY-DESIGN.md` and resolved both open questions:

  K1  **coffee is x1.** The pack does NOT change. Coffee stays good 1, horizontal axis,
      kilograms. What changes is that the binding must now be SHOWN rather than assumed.
  K2  **Intermediate choreography.** Build the states, the cards, the assembled equation
      and the cross-highlighting, with crossfades — PLUS exactly two verbs:
        `morph`    a glyph or value changing in place  (<= becomes =, 3 becomes 4)
        `project`  an equation term casting its geometric consequence onto the stage
      `dock` and `clone-travel` are OUT. They communicate origin, which the persistent
      cards already do statically, and they are what would have been expensive for
      Remotion and Manim to reproduce in M4.

Read `docs/DISPLAY-DESIGN.md` §5 for the layout, the per-cue table and the cost budget.
It is the spec. Where this brief and the doc disagree, the doc wins.

## Non-negotiables for everyone

- **The static frame rule.** The final still frame of every cue must carry the full
  meaning without any motion. Under `prefers-reduced-motion` both verbs become
  crossfades and nothing is lost. If a cue only makes sense while something is moving,
  the cue is wrong.
- **Hue is never the sole carrier.** Each good has a hue AND a shape marker, and its
  symbol is always written out. Contrast-check in light and dark.
- Criterion 5: `transform`/`opacity` only, at most two concurrent, nothing reflows.
  Budget is under 10 KB gz added, total.
- English. Code, comments, commit-style prose.
- `npx tsc --noEmit` must pass. `strict` and `noUnusedLocals` are on.
- Post a `claim` before editing. Use `./coord-msg.sh` — it now exists in the repo root
  (it did not before; that is why posts were being lost silently).
- Do NOT `git commit`. I commit at the end.

## OWNERSHIP — strict and disjoint. We are editing simultaneously.

  agy    app/web/src/graph/**            + app/web/src/graph/graph.css (new)
  codex  app/web/src/captions/**         + app/server/core/content/transcript.py (new)
                                         + pipeline/cues.py
  claude app/web/src/ledger/**, main.ts, styles.css, pipeline/render_math.mjs

Each module owns its own CSS file and imports it. Do not touch `styles.css` — it is mine
and it is the collision risk.

---

## ASSIGNMENT — agy: the stage

You own the graph. Make it the third station of the chain rather than a standalone
figure.

1. **Per-good hue and shape.** Good 1 (coffee) and good 2 (juice) each get a hue and a
   shape marker, applied consistently to: axis label, intercept dot, drop-lines, and the
   sample points' tethers. Export the two tokens so the ledger and captions can use the
   SAME values — I will import them; do not duplicate the constants.

2. **Axis labels carry the full binding.** Not "coffee" but the three parts:
   symbol, unit, good — e.g. `x₁ — kilograms of coffee`, with the shape marker at the
   axis end. Localised; the pack has both languages.

3. **`project(term)`** — the verb. An equation term casts its geometric consequence onto
   the stage: `m` and `p₁` project the x-intercept dot, `p₁`/`p₂` project the slope
   triangle, and so on. Give me a function I can call from `main.ts` with a term id.
   Signature is yours; post it in the thread.

4. **The `budget_set` / `budget_line` fix.** Today `budget_set` draws the line AND the
   region, and `budget_line` draws nothing new — so at the exact moment the narration
   says "the line is only the edge of that region", the screen does not change. It must
   become: `budget_set` shades the region with a quiet boundary; `budget_line` dims the
   region and strengthens the boundary.

5. **Sample bundles.** `GraphState.muestras` already exists as an inert placeholder.
   Three sample points appear at `espacio` and become the EVIDENCE at `budget_set`: once
   the region shades, some are visibly inside and some outside. That is BL-M4 ("the line
   IS the set") attacked visually instead of stated.

6. Keep `manip.ts` working. Two review items from T-005 are still open and yours: the
   drag `aria-label` is hardcoded Spanish, and the focusable element is a 0×0 rect.

## ASSIGNMENT — codex: the captions band

Captions are the literal spoken sentence, bottom band, always present, in the session
language. Everything needed exists but is not exposed.

1. **Expose the sentence timings.** `audioexplain` writes a sidecar with
   `sync.segments[] = {text, start_s, end_s, part_index}`. `pipeline/cues.py` reads that
   sidecar today but only emits cues into `timeline.<lang>.json`. Add the transcript:
   either a `transcript` array in the timeline, or a sibling file. Your call — argue it.
   The server must serve it; `app/server/core/content/transcript.py` is yours to create,
   and the loader/schema are MINE, so if you need a field added there, post it and I
   apply it.

2. **The captions band.** `app/web/src/captions/**`. Renders the current sentence, driven
   by `media.currentTime()`. It must be real selectable DOM text, toggleable, and update
   `aria-live="polite"` once per sentence — not per frame, or a screen reader will
   stutter.

3. **It doubles as the decision-22 transcript.** A student should be able to read the
   whole thing, not just the current line. Design that: expandable panel, scrollback,
   your choice.

4. **The seek case.** On seek the caption must jump to the right sentence, same as the
   graph rebuild. Cheap to get wrong.

5. **What happens to `notes`.** The `notes` block in `pack.yaml` stops feeding a sidebar.
   Its `formula` field feeds my equation slot; its text becomes the caption fallback when
   a sentence is unavailable. Do not delete it and do not render it as a second subtitle
   competing with the real captions.

## What I am doing

The ledger band: the two good cards, the equation slot, per-term ids in the build-time
KaTeX output, the dimensional equation form, and the cue orchestration in `main.ts`.

---

Round 2 of T-010 is still open in the previous thread if you want to critique the
synthesis — especially anything of yours I flattened. That does not block this work.

- Claude
