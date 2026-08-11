# The LLM judge (M3)

The judge grades open responses. It is the only place in tutorIA where a model's opinion
touches a student's record, which is why almost everything here is about limiting what
the model is allowed to decide.

Provider: **OpenAI** (Kristian, 2026-08-11), behind the `LLMProvider` seam. Judge model
`gpt-5.6-sol`. Everything below is provider-neutral except where it says otherwise.

---

## 1. The model reports; the code decides

The model is asked for observations, not a verdict:

- for each rubric line (`key_points` on the question), **is this idea present**, and
  **quote the student's words that show it**;
- **does the answer display a catalogued misconception**, and quote the words;
- how confident it is.

`correcta` and `score` are computed in `grader_open.score_from` from those booleans.
`correcta` requires every *essential* key point; `score` is the full fraction present, so
"did they get it" and "how close were they" stay two different numbers. If the model
returned a field claiming the answer was correct, it would not be read.

This is the same commitment as the deterministic graders (C7): the model supplies at most
one of the three evidences a sub-skill needs for mastery, and even that one is scored by
code.

## 2. The enum has two escape hatches

The output schema constrains `misconception_id` to the pack's catalogue **plus**
`NINGUNA` and `FUERA_DE_CATALOGO`. Without those, the model is forced to name a
catalogued error even when the student made none, and the "zero out-of-catalogue ids"
gate passes by construction while meaning nothing. (T-002, lane C.)

Only the misconceptions the question actually watches are shown to the model, not the
whole catalogue — putting ids in front of it that this item cannot legitimately produce
is how out-of-catalogue-adjacent noise gets in.

## 3. Evidence is checked against the student's text

Every quote the model attributes to the student is matched back against the answer,
accent- and case-insensitively. A quote the student never wrote is recorded as
`evidence_unverified` in the judge JSON and surfaces in the concordance report.

It does **not** overturn the verdict. Whether hallucinated evidence predicts disagreement
with Kristian is a question the gold set should answer, not one the grader should assume.

## 4. There is no `temperature`

`temperature`, `top_p` and `top_k` are rejected outright on Claude Opus 5 / Sonnet 5, and
are frequently rejected on the gpt-5 reasoning family. "Run the judge at temperature 0"
is not a setting that exists any more, and on any model it never guaranteed identical
outputs — it only felt like it did.

Reproducibility is bought elsewhere, and all four levers are load-bearing:

| Lever | Where |
|---|---|
| A fixed rubric that does not vary between runs | `questions.yaml` → `key_points` |
| An output schema the model cannot leave | `build_schema`, enforced server-side |
| A fixed `seed` | `openai_provider.SEED` |
| A versioned prompt whose fingerprint is stored beside every verdict | `prompt_id()` |

The fingerprint is `sha256(SYSTEM_PROMPT)[:12]`, appended to the version string. It
catches the edit nobody remembered to bump the version for, which is most of them, and
which is what silently makes historical verdicts incomparable.

## 5. Shadow mode is structural, not a convention

Every verdict is written to `answers` with `shadow = 1`, and the mastery path reads
through `Repo.evidence()`, which filters that column. The judge therefore *cannot*
promote a student even if `JUDGE_MODE` is misconfigured, because the promotion path never
sees its rows.

Going live needs two environment variables, not one: `JUDGE_MODE=live` **and**
`JUDGE_GATE_PASSED=1`. The second only makes sense to set after reading a concordance
report, which is the point of requiring it.

---

## The M3 gate

Fixed by Kristian:

1. ≥80% agreement with Kristian, **with the interval reported**
2. recall ≥70% on each misconception with n≥3
3. zero out-of-catalogue ids

The gate is evaluated on the point estimate, because that is how it was set. The report
prints the Wilson interval next to it, and when the lower bound falls short it says how
many items would be needed to close that gap. The difference between "passed the gate"
and "demonstrated" should be visible rather than buried in one number.

## Running it

```bash
.venv/bin/python scripts/doctor.py --live      # is a provider configured and working
.venv/bin/python evals/build_goldset.py        # (re)build the gold set from _raw/
.venv/bin/python evals/label.py                # Kristian labels; resumable
.venv/bin/python evals/run_judge.py            # run the judge, write evals/runs/
.venv/bin/python evals/report.py               # concordance + gate
```

`run_judge` and `report` are separate on purpose: a verdict costs money and time, the
report will be rewritten many times while we argue about what it should measure, and
comparing two models is comparing two run files. The gold set is labelled once no matter
how many judges we try.

`report.py --vs-intent` compares the judge against the intention each answer was written
with instead of against Kristian. That is another model's opinion, it is **not** the gate,
and it exists to exercise the whole path and catch a grossly broken judge before anyone
spends an hour labelling.

## What this cannot tell us

The gold set is **synthetic**: the answers were written for it, not produced by students.
Agreement with Kristian on prose we wrote is not evidence that the judge works on prose a
nineteen-year-old writes at midnight. Every item carries `source`, and the report says so
at the top of every run. The real check is the first cohort, and until then this number
should be quoted with that qualifier attached.
