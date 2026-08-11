# tutorIA

An interactive tutor for intermediate microeconomics. Proof of concept.

A lesson is narrated audio plus a graph that moves with it. The narration stops at
checkpoints and predictions to ask something; afterwards a practice loop chooses items
from a bank until the concept's mastery criterion is met, or gives up and says so. A chat
tutor is available throughout and is **structurally unable to hand over an answer** — the
answer key is never in the browser.

One concept ships today: the budget line, in Spanish and English.

## Run it

```bash
uv venv && uv pip install -e '.[llm]' && npm --prefix app/web install
```

```bash
source .venv/bin/activate && python -m uvicorn app.server.main:app --port 8000
```

```bash
npm --prefix app/web run dev
```

The API key for the LLM provider lives **server-side only** and never reaches the
browser. Put it in a gitignored `.env`; `scripts/doctor.py` tells you whether it is
loaded without printing it.

Useful URL parameters: `?lang=es|en`, `?t=<segundos>` to paint a moment without playing,
`?variant=A|B` to switch the media technology.

## Check it

```bash
.venv/bin/python -m pytest && npm --prefix app/web test
```

```bash
.venv/bin/python pipeline/validate_pack.py content/packs/budget-line && .venv/bin/python pipeline/check_cues.py content/packs/budget-line
```

The two gates are not optional decoration. `validate_pack.py` checks the content's
internal consistency; `check_cues.py` closes a failure that is otherwise **silent** — a
cue whose id nobody handles fires, reports a healthy lag, and paints nothing.

`bakeoff/medir/e2e.mjs` drives the whole student journey in a real browser, in both
languages and both media variants. It exists because the unit suite proves the pieces and
not that they fit.

## How it is put together

| | |
|---|---|
| `app/server/` | FastAPI. Grading, mastery, the LLM judge, the chat guardrail. |
| `app/web/` | The client. No build-time secret, no answer key. |
| `content/packs/<id>/` | The lesson **as data**: script, questions, misconceptions, and `graph.yaml`. |
| `pipeline/` | Compiles a pack: audio, cue timings, KaTeX, the video variant. |
| `evals/`, `bakeoff/` | The gold set and the render bake-off, with their instruments. |
| `coord/` | Multi-agent coordination. `HUMAN.md` is what waits on Kristian. |

Two decisions shape everything else. **The judge runs in shadow**: it grades open answers,
stores its verdict, and the student is never shown it — flipping that needs a gate that
has not been passed. And **the lesson is data, not code**: what the graph and the equation
band do at each cue lives in `graph.yaml`, so a new concept does not need TypeScript.

## Where to read further

- `docs/PLAN.md` — the project plan and its numbered decisions.
- `docs/JUDGE.md` — how open answers are graded, and why the score is computed in code
  rather than asked of the model.
- `docs/D3-GUION-GRAFICO.md` — the lesson as data, and what happened when three models
  were asked to write one.
- `bakeoff/02-informe.md` — the render bake-off: what was measured and what it changed.
- `docs/TRANSFER-CHECK.md` — the experiment that asks whether the tutor's help transfers.
- `coord/HUMAN.md` — open questions for Kristian.

## What this is not

It has not been in front of a student. The judge's agreement gate was **simulated against
another model's intent, not against Kristian's labels**, so it says the machinery works
and nothing about pedagogy. The misconception catalogue is a hypothesis written by
language models and is marked as such. Everything here is built so those gaps are visible
rather than papered over.
