# M4 BUILD PLAN

Written against the repo at `Kristian1` (85b728c), the four scouting reports, `docs/PLAN.md` §6 and `docs/M4-PREREGISTRO.md`. Every file reference below was checked, not remembered.

---

## 0. The one structural change this plan makes

`PLAN.md` §6 assumes four arms of six hours. The scouting says that is 24 hours buying about 6 hours of information. This plan keeps the rules — every option runs inside the real app through its `MediaAdapter`, hard stops, pre-declared cuts — and changes the arm list, on one principle that I want stated before anything else because it disposes of three questions at once:

> **An option earns a timebox only if it changes what the `MediaAdapter` is. Anything that keeps `<audio>` as the clock is a *stage-layer* candidate, not a *medium*, and belongs to M5.**

That principle is not invented for convenience. It is what the interface is for (`adapter.ts:1-16`: "everything that differs between options A/B/C/D lives behind this interface"). Applying it:

- **A** — `<audio>` + DOM. The incumbent. Already built. Costs 0 h of build, ~1 h of measurement.
- **B1 (Remotion → MP4 behind `<video>`)** — a different medium. **Gets the full 6 h.**
- **B2 (`@remotion/player`)** — keeps `<audio>`-equivalent transport and a React DOM stage. It is option A with a different drawing library. **Not an arm.** M5 stage-layer candidate.
- **C (Manim → MP4 behind `<video>`)** — *the same medium as B1*: one h264 file behind a `<video>` element. Its criterion-5 and checkpoint cells are B1's by construction. It differs only in authoring economics. **Gets a 2 h probe inside a 6 h box, with a written escalation trigger.**
- **D (hybrid)** — its own scout concluded the only seam worth building reuses A's MP3, A's timeline, A's cue ids, A's SVG and A's checkpoints, and changes zero lines of `main.ts`. **0 h. Recorded as an add-on for the winner.**
- **KGJS** — see §6. **0 h in M4.**

Human cost: **3 h shared + 6 h (B1) + 2 h (C) + 2 h (the criterion-2 experiment) ≈ 13 h**, against 24 h. The hours saved are not saved, they are moved into §5's harness and the schema, which is the thing M4 actually has to deliver under D-3.

---

## 1. Build order, and why

**M4-0 (shared, off the clock) → the 20-minute weight sweep → B1 → C-probe → measurement block → report.**

The order is *cheapest information first, but only after the shared bill is paid*, and the defence is specific:

**Why the shared prep goes first, not inside an arm.** Three of the required changes are to the "built once" half: `main.ts:217-220` paints `graph.render(estado)` and `paintLedger()` on every cue with no notion that someone else owns the picture; `Timeline.audio` is a single filename (`schema.py:196-199`); and `create_session` returns `pack.timelines.get(body.lang)` (`main.py:79`) without consulting `media_variant`, so §6's promise that each technology brings its own pacing is unreachable. Every non-A option needs all three. Charge them to whichever arm runs first and that arm reports "did not fit in the budget" for a reason that has nothing to do with its technology, and the bake-off measures the app's coupling instead. Three independent scouts flagged this. It is the single largest source of measurement error in the whole exercise.

**Why the weight sweep runs before any building.** `M4-PREREGISTRO.md` fixes criterion 2 at 35% and criterion 4 at 25%. That is 60% of the weight on two cells where the scouting already has strong priors and they point the same way. Twenty minutes with the scouts' findings as a provisional score matrix tells you whether the simplex sweep has a stable winner. If it does, the arms that follow are falsification attempts with a named target, not a fishing expedition — and that is a much better evening than the alternative. It also has to happen before results exist, or it is not a pre-registration.

**Why B1 before C.** B1 is the only arm that can still surprise in either direction. Its scout half-falsified the pre-registered hypothesis already — the MP4 is 2.5 MB against A's 1.69 MB MP3, i.e. **+0.85 MB for the entire moving picture**, with *less* main-thread JS than A because A mutates SVG on every cue. If that holds under measurement, "video wins on old machines" is confirmed but "video is heavy" is refuted, which is a real result. And B1 builds the `<video>` adapter that C then reuses verbatim, so B1 first makes C a 2-hour content swap instead of a second integration.

**Why C is a probe and not an arm.** Its kill switch (§3) is checkable in two hours and its outcome is already 80% predicted. Spending 6 h to confirm a prediction is exactly what the timebox rule exists to prevent.

---

## 2. What gets built, and what is cut

### M4-0 — shared prep, ~3 h, off the clock

1. **Stage ownership.** One flag on the adapter (`variant` already exists at `adapter.ts:28` and is read by nobody — that is presumably what it was for). `main.ts` skips `graph.render` / `paintLedger` when the adapter owns the picture. Six call sites: `main.ts:118, 161, 171-173, 219-220, 366-369`. **The ledger band and the caption band stay DOM in every variant.** That is a design decision, not a cut: it is the honest comparison and it protects criterion 4 for everyone.
2. **`createAdapter` cases** for `B` and `C` (`adapter.ts:91-97`).
3. **Second media asset.** Add `video: str | None` to `Timeline` (`schema.py:196`). `/media/{concept_id}/{filename}` (`main.py:150`) already serves any file in the pack `media/` dir and Starlette's `FileResponse` answers Range, so **no route work and no server change is needed to seek an MP4** — verified independently by two scouts.
4. **Variant-aware timeline selection** in `create_session` (`main.py:79`), falling back to lang. `Pack.media_variant_default` already exists (`schema.py:210`).
5. **The config schema + the validator gate.** This is the D-3 deliverable and it is the most important thing in M4. Today the only cue-id check anywhere is `validate_pack.py:79-83`, which checks that each checkpoint's `despues_de_cue` appears in the script. Nothing cross-checks that the ids a renderer knows are the ids the timeline fires. `aplicarCue` (`main.ts:381-408`) and `paintLedger` (`main.ts:181-215`) are `switch` statements with **no default branch**: a cue named `budget-line` fires, records telemetry, reports a healthy lag, and changes nothing on screen. Extend `pipeline/validate_pack.py` with: cue ids in any config artefact ⊆ ids in `timeline.<lang>.json` ⊆ ids handled by the renderer; a closed vocabulary for every enum field; `.strict()` so unknown keys are errors; and the geometric invariant check the Manim scout demonstrated ("after m=250 the line runs off the axes"). ~60 lines.
6. **`bakeoff/results/<X>/time_log.md`** scaffolding (T-001 names this path) and the `__tutoria` clock-mechanism probe (§5).

**Cut from M4-0:** Spanish for the non-A arms; any refactor of `budget_graph.ts`; anything to do with `holdRest()` (verified a no-op — `CueEngine` self-blocks at `sync.ts:167-175` and 15/15 cues fire identically with or without it).

**M4-0 has its own hard stop: 4 h.** If it overruns, stop the bake-off and report the coupling as the finding. That is a real possible outcome and it should be allowed to happen.

### Arm B1 — Remotion, 6 h

| Hours | Work |
|---|---|
| 0:00–0:30 | `npm install remotion @remotion/cli @remotion/renderer react react-dom`. Budget disk: node_modules 221 MB, and the **first render silently pulls a 193 MB Chrome Headless Shell**, ending at ~524 MB. Read `node_modules/remotion/LICENSE.md` and put the licensing question to Kristian in writing at minute 10 (free for ≤3 employees / non-profits; terms change in 5.0). |
| 0:30–2:00 | Beat compiler: read `content/packs/budget-line/media/timeline.en.json`, replay `aplicarCue` to derive the 15 beats (~3 KB of JSON), and **apply the reveal-offset rule**: any visual beat sharing a timestamp with a `prediction` shifts +1.2 s. In EN that is 80.607, 113.936, 161.608. This lives in the compiler, not in the artwork, so it survives re-renders. |
| 2:00–3:30 | Composition + render. `--audio-bitrate=64k --crf=28` → ~2.5 MB, ~70 s. |
| 3:30–5:00 | `RemotionVideoAdapter`: `document.createElement("video")`, mount into `.escenario` (`main.ts:79`), delegate `CueEngine` unchanged (`sync.ts:40` takes an `HTMLMediaElement`), wire `play`/`pause`/`timeupdate`/`ended`/`seeked`. |
| 5:00–6:00 | End-to-end at `?variant=B`: 15 cues in order, 3 predictions, 2 checkpoints, `ended` exactly once → `practice.start()`. Capture the §5 measurements. |

**Pre-declared cuts (B1):** Spanish. Any second render resolution unless hours remain. The ledger absorbed into the video. Any scrubber UI — `seek`, `duration`, `destroy`, `off` stay stubs. `@remotion/player` exploration. Render caching or CI. Visual polish beyond parity with A's SVG — and if the last 30 minutes are spent on polish, it is logged as a *separate line* in `time_log.md` so criterion 3 is not contaminated by taste.

### Arm C — Manim, 2 h probe inside a 6 h box

| Hours | Work |
|---|---|
| 0:00–0:30 | `brew install cairo pkg-config` if needed (pycairo has **no macOS wheels** — verified), then `uv venv --python 3.12 .venv && uv pip install manim`. ~266 MB. |
| 0:30–1:30 | Render the lesson at 720p30 (~17 s, ~1.8 MB), timed to the 15 real cue timestamps, with hand-placed hold beats before the three reveals. Mux: **never `-shortest`** — the muxed duration must be 211.512 s or the recap truncates and `ended` fires early, killing the mastery loop. |
| 1:30–2:00 | Drop the file behind **B1's adapter** as `?variant=C`, run once end to end, capture the same measurements and the rubric stills. |

**Escalation trigger (the only one):** if, on Kristian's eye before the formal blind rating, the Manim render is visibly better than B1 by enough that criterion 1's 20% could flip the ranking, C gets its remaining 4 hours to be authored properly. Otherwise it reports "same medium as B, worse authoring economics" and stops.

**Pre-declared cuts (C):** 1080p60. Spanish. Any `always_redraw` on a `MathTex` — measured at ~108 ms/frame, 7.1× realtime, and it is exactly what a model would write for "show m as it changes". Prefer Pango `Text` over `MathTex` wherever the symbol also appears in the KaTeX ledger, to avoid shipping two math renderers of the same expression.

---

## 3. Kill switches

Written now so that stopping is a rule being followed, not a judgement made after seeing an ugly number.

**M4-0** — exceeds 4 h → stop the bake-off; report the app's coupling as the M4 finding.

**B1**
- **K-B1 (hour 1):** `npx remotion render` exits non-zero on this machine. The `versions` command already warns "Your macOS version is older than macOS 15 (Sequoia)"; it was a false alarm at 4.0.507 but a bump could make it real. → not viable, report the version.
- **K-B2 (hour 4):** after the offset pass, `ffmpeg -ss 80.607 -i out/lesson.mp4 -frames:v 1 rev.png` still shows the budget line or the caption "the line is only the boundary of the set". One 30-minute escalation; then report "the reveal cannot be held mechanically in this pipeline", which is a criterion-1 kill, not a criterion-5 one.
- **K-B3 (hour 5):** `window.__tutoria.lag().n < 15`, or the run stalls at `line_vs_set` with narration continuing. That is the `blocked`-never-cleared deadlock (`sync.ts:48, 111-113`). A real `<video>` emits `play` on a genuine paused→playing transition, so if this fires the adapter is wrong, not Remotion — 30 minutes, then kill.
- **K-B4 (hour 0, non-technical):** licensing answer from Kristian. Not a kill, but it must be asked before the evening, not at deployment.

**C**
- **K-C1 (0:30):** `uv pip install manim` fails on pycairo. 15 minutes for `brew install cairo pkg-config`, then report install-blocked.
- **K-C2 (hour 2) — the main one:** producing one personalised variant end to end (change `m` 100→150, re-render, re-mux) requires editing Python **or** takes more than 60 s of machine time. Both are already expected from scouting (17 s at 720p30, 64 s at 1080p60, plus a cairo+TeX toolchain per variation). → criterion 2 = 0 by construction; stop the clock; do not spend hours 3–6.
- **K-C3 (any hour):** `ffprobe -v error -show_entries format=duration -of csv=p=0 lesson_av.mp4` ≠ 211.512 ± 0.05, or `ended` fires before the last transcript sentence at 211.444.

**Shared, applies to every arm:** if the config artefact cannot be made to fail loudly on a wrong key by the M4-0 validator, criterion 2 is **unmeasurable** for that option and it is reported as such rather than scored. A format whose failure mode is "renders a plausible, confidently wrong lesson" does not get a number.

---

## 4. Shared cost vs per-option cost

**Shared, already paid, and frozen for the duration:** `script.{en,es}.md`, both MP3s (1,692,332 B en / 1,862,252 B es), `timeline.en.json` (211.512 s, 15 cues, 50 transcript sentences) and `timeline.es.json` (232.752 s). **Nobody runs `pipeline/cues.py` during an arm.** Re-narration moves every timestamp downstream of the edit — the hybrid scout verified this by running the pipeline twice: an identical script reproduces every timestamp exactly (edge-tts is deterministic), but a parameter change shifted `budget_set` 67.955→68.05 and everything after it. A re-run mid-bake-off invalidates B1's baked reveal offsets and C's hand-placed holds silently.

**Shared, paid in M4-0, off the clock:** the five infrastructure items and the validator in §2. Defence for putting them outside the clock: `PLAN.md` §2.1 already draws the seam between "the two halves", and §6 charges only *script, MP3 and timeline* as shared. These items are the built-once half by the plan's own definition, and they are needed identically by B, C and any future option.

**Shared, paid once, on nobody's clock:** the measurement harness (§5), the blind rubric instrument and its randomised order, and the criterion-2 emission trial.

**Genuinely per-option, on the clock:** beat/scene authoring, the option's own compiler, the render, the adapter subclass, the reveal-hold discipline, and the `time_log.md`.

---

## 5. The measurement harness

### Criterion 2 — personalisation (35%)

`PLAN.md` §6 specifies `(m: 100→150, p1: 10→8, "cerveza"→"café")`. That is stale: the real `pack.yaml` `ejemplo` is `{coffee, orange juice, p1: 3, p2: 1, m: 100}`. **Redefine the standardised change concretely as: `m 100→150`, `p1 3→2`, `coffee → tea`.** Record per option: human minutes (stopwatch), machine seconds, files touched (`git status --porcelain | wc -l`), whether a binary appears in the diff, and whether any code was edited.

Then the part §6 does not yet contain, and which D-3 makes decisive — **the LLM emission trial**, run once per *format* (A's config, B1's beats JSON, C's scene spec), N=10 generations each, zero-shot from the schema alone:

```
python3 pipeline/validate_pack.py content/packs/budget-line   # gate must be green first
# for each generated artefact:
python3 pipeline/validate_config.py <artefact> content/packs/budget-line/media/timeline.en.json
```

Record three numbers: validator pass rate; of the passes, how many are pedagogically correct on human inspection; and **of the failures, how many would have been silent without the gate**. That last number is the criterion-2 measurement that matters. Scouting already has the concrete cases to seed the trial: `show.lines` for `show.line` rendered the budget set with no boundary line under the caption "the line is the boundary" — that frame teaches BL-M4, the misconception the lesson exists to destroy, at exit code 0.

### Criterion 4 — accessibility and maintainability (25%)

```
cd app/web && npm run build && npm run dev
npx @axe-core/cli "http://localhost:5173/?variant=A&t=100"      # repeat for B, C
```

Run axe once against A in M4-0. If A comes back with zero violations, axe is a pass/fail instrument only and the load is carried by a direct count, which is the honest measure of pixels-vs-DOM. In the console at `?t=100` per variant:

```js
document.querySelectorAll('.lienzo svg text, .bands .katex').length
document.querySelector('.lienzo svg')?.getAttribute('aria-label')
```

A returns a non-zero count plus the generated `descripcion(state)` label (`budget_graph.ts:47`); B1 and C return the ledger and captions only, and zero on-stage text. Then the stopwatch task: change the visible stage string "coffee" to "Coffee" and time it, counting files and binaries.

### Criterion 5 — versatility (15%)

Lag, after a full playthrough, per variant: `window.__tutoria.lag()` → `{n, p50, p95, max}` (`main.ts:374-377`).

**The normalisation that keeps the table honest.** `startFine` uses `requestVideoFrameCallback` (`sync.ts:95-105`), which is `undefined` on `<audio>` and a `function` on `<video>` — confirmed by three scouts. Uncorrected, A reports ~150–300 ms and any `<video>` arm reports ~16–37 ms, a structural advantage that has nothing to do with the technologies. So: **run every variant twice.** Once with `HTMLVideoElement.prototype.requestVideoFrameCallback = undefined` injected before load — that column is the comparable one — and once natively, reported as a separate bonus column labelled with its polling mechanism. Costs nothing and it is the difference between a table and a lie.

Six cells: `{no throttle, 4×, 6×} × {no net throttle, Fast 3G}`, driven by CDP exactly as the hybrid scout did:

```
npm i puppeteer-core     # drives the installed Chrome, no download
# Emulation.setCPUThrottlingRate {1,4,6}; Network.emulateNetworkConditions
```

Do **not** measure this in the Claude browser pane: it reports `visibilityState: "hidden"`, and Chrome suspends `<video>` in a hidden tab while `<audio>` keeps playing — `play()` rejects with `AbortError` and the picture freezes on frame 0. That cost one scout an hour.

Per cell record: bytes transferred, time to first audio, dropped frames (`video.getVideoPlaybackQuality().droppedVideoFrames`), the 15/0 cue count, and the yes/no eye judgement §6 asks for. Plus the seventh, qualitative cell: Kristian's old machine — and **run `system_profiler SPHardwareDataType` on it first**, because the cell needs a name in the report.

One preflight, once:

```
.venv/bin/python -m uvicorn app.server.main:app --port 8000
curl -sD- -o /dev/null -H "Range: bytes=0-99" \
  http://127.0.0.1:8000/media/budget-line/20260810-194900_budget-line-en.mp3 | head -3
```

Expect `206 Partial Content` + `accept-ranges: bytes`. Without Range, `seekable` becomes `[[0,0]]`, every seek clamps to 0 silently, and `lagSummary` reports a healthy p50 for a lesson whose picture is 87 s behind the narration. `lagSummary` is denominated in media time (`sync.ts:149-155`) and is structurally blind to it.

### Criterion 1 — the blind rubric (20%)

Six instants: `t = 45, 80.6, 100, 132.5, 161.6, 190`. For A, `?variant=A&t=<T>` repaints from `session.media.cues` without touching the media (`main.ts:355-371`) — that affordance was written for exactly this. For the video arms `?t=` deliberately bypasses the adapter, so capture instead via `__tutoria.media.seek(T)` then screenshot the page. That exercises the `seeked` → `rebuild()` path, which is designed but has had no live caller since `HtmlAudioAdapter` never appends its element to the document — so the capture doubles as the first real test of it. Randomise filenames with `shuf` before distribution; rate on §6's three items (label legibility, pivot-vs-shift distinguishability, script fidelity) by the four agents plus Kristian.

---

## 6. D-2 — KGJS: **no**

KGJS does not enter M4 as a fifth option. Three reasons, in order of weight.

1. **It is not a medium.** Grepping `src/ts` for `currentTime`, `requestAnimationFrame`, `setInterval`, `animate`, `tween`, `easing` returns nothing time-related. It has no clock, so its adapter would be `HtmlAudioAdapter` verbatim — same MP3, same timeline, same cue engine — and the arm would compare A against A while producing criteria-3 and -5 numbers that are A's by construction. This is the same principle that removes B2 and D from the arm list, applied consistently.
2. **It fails the criterion D-3 promoted.** Issue #51, "Adding a yaml and json schema", open since 2023-04-09, with the maintainer replying that generating one is "very far from my area of expertise". No JSON Schema, no `ajv`, no validator, two competing surface syntaxes, and semantics that mix live expressions with parse-time truthiness checks without marking which is which. The ten-case probe returned 2 loud / 8 silent, and the silent ones are precisely the model-plausible slips: `"handles": "params.showIntercepts"` — the most natural thing to write — puts the intercept dots on screen at t=0 and spoils the reveal.
3. **Corpus contamination is a live risk.** Most KGJS in a model's training data *is* econgraphs.org, which is Makler's copyrighted courseware, not the MIT engine. "Write me a KGJS budget-line spec" invites reproduction from memory, and checking for that is unbudgeted work.

**What the "no" forfeits, and why it costs nothing in M4:** D-3 wants a schema *Kristian defines once*, against which a model emits. KGJS's format being "already JSON" is not the same property — an unschema'd JSON that fails silently is worse for D-3 than a verbose format that throws.

**What I schedule instead, with a date:** KGJS is an **M5 stage-layer candidate**, evaluated against `budget_graph.ts` and not against Remotion, with a schema we generate ourselves from its TypeScript interfaces (`ts-json-schema-generator`, the tool suggested on #51 and never taken up) plus the same cue-id cross-check M4-0 builds. Its case is criterion 3 projected to concept #20 and it is genuinely strong: ~30 ready-made intermediate-micro primitives covering most of concepts 2–20 declaratively. Two conditions attach: the 30 leaking global CSS rules must be scoped (open issue #57), and vendoring `build/lib/kg-lib.js` inherits an **Apache-2.0 attribution obligation for mathjs that upstream has not discharged** — ten minutes with a THIRD-PARTY-NOTICES file, but it has to actually be done.

---

## 7. What could make the whole bake-off pointless

**Stated plainly: under the pre-registered weights, the arithmetic already has a winner, and it is A.** Criterion 2 is 35% and criterion 4 is 25%. Any pre-rendered option scores near zero on 2 (the render *is* the product; personalisation means a toolchain per student per variation) and near zero on the pixels half of 4. That caps B1 and C at roughly criterion 1 (20%) plus criterion 5 (15%) before anything is measured. Run the simplex sweep in §1 with the scouts' findings as provisional scores and I expect A to win in the large majority of plausible weightings. If that is what it says, running three more arms confirms it at a cost of an evening each.

**The deeper finding, which three scouts reached independently and none was looking for:** *constraining the config format enough for a model to emit it safely makes the fancy renderer unnecessary.* The Manim scout's 686-byte scene spec is consumed directly by the existing SVG `BudgetGraph` with no render step, no TeX and no 4 MB download. Remotion's 3 KB beat tree is the same shape. KGJS's whole pitch is that shape. The artefact that needs Manim — arbitrary Python, where `ax.set_budget_line(3)` is a silent no-op via `Mobject.__getattr__` and a wrong sign renders beautifully — is exactly what D-3 rules out. If M4 confirms this a fourth time, M4 was expensive.

**So what does the bake-off still buy?** Four things, and they are worth the 13 hours:

1. **Criterion 1 blind, which nobody can answer from scouting.** Does a rendered lesson actually teach better than the SVG one? That is the only cell where the answer is genuinely unknown, and it is the reason B1 gets its full six hours.
2. **A falsification chance that has already half-fired.** The pre-registered hypothesis says video wins on old machines and is heavy. Scouting found the MP4 is +0.85 MB over the audio A already ships and puts *less* work on the main thread than A does. Confirming that on Kristian's actual old machine is a result worth having, and it is the opposite of what the plan predicted.
3. **An existence proof that a second adapter drops in.** Once B1 runs, changing medium later is a known quantity instead of a fear. That is what the `MediaAdapter` seam was built for and it has never been exercised.
4. **The schema, the validator gate and the emission trial** — which are needed no matter who wins, and which today do not exist.

**And two ways to make it pointless by accident, both avoidable tonight:** publishing criterion-5 lag numbers without normalising `requestVideoFrameCallback`, which hands the video arms a win they did not earn; and running any arm before the validator gate exists, which makes every criterion-2 score unmeasurable because a wrong config is invisible — `aplicarCue` and `paintLedger` have no default branch, `NOTES` is a bare `Record` lookup, and a cue named `budgetLine` fires, reports a healthy lag, and changes nothing.

**Where I am uncertain, and what I would run:** whether the stage-ownership change is 30 minutes or 3 hours — prototype the flag against the six call sites in the first 20 minutes of M4-0 and re-estimate before committing; whether axe-core adds anything over the DOM-text count — run it once against `?variant=A&t=100` and if A is clean, it is a pass/fail instrument only; and whether the emission pass rates differ between formats at all — if the beats JSON and A's config both land 8–10/10 after the gate, criterion 2 collapses to render latency, which is a question already decided, and the report should say so instead of pretending the 35% did work.