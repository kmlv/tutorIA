# ECON-100A — Lecture Ingest (Modules 1 and 2)

Synthesis of Kristian's recorded *Intermediate Microeconomics* lectures from
Canvas course [93725](https://canvas.ucsc.edu/courses/93725), hosted on YuJa at
`media.ucsc.edu`.

**Scope: Modules 1 and 2 only.** Modules 3-10 are deliberately out of scope and
untouched. 11 videos, 2 h 49 m of runtime.

---

## What is here

| Path | Contents | In Git |
|---|---|---|
| `lectures/` | One file per video: synthesis, screen inventory, regenerated script, flags | yes |
| `transcripts/` | Readable timestamped transcripts | yes |
| `captions/` | Original `.srt` caption files as published | yes |
| `manifest.json` | Video IDs, durations, YuJa source paths | yes |
| `media-inventory.json` | SHA-256 hashes and sizes of the retained media | yes |
| `workspace/econ100a/video/` | The 11 source MP4s (2.67 GB) | **no** |
| `workspace/econ100a/frames/` | 264 extracted screen frames | **no** |
| `workspace/econ100a/sheets/` | Contact sheets used for review | **no** |

Each `lectures/*.md` has four sections: **Synthesis** (what the lecture does and
in what order), **Screens** (a timestamped inventory of every settled on-screen
state), **Regenerated script** (rewritten in the tutorIA house style with
`<!--cue:-->` markers), and **Flags for Kristian**.

---

## Retention and rights

The recordings are Kristian's own intellectual property. Following the retention
contract in `TechnicalVideoNotes/docs/product/PLAYER_MVP.md`:

> Acquired video, audio, captions, transcripts, frames, generated narration, and
> player bundles are retained locally outside Git until the principal explicitly
> requests cleanup. The system records hashes and provenance; it does not publish
> or redistribute source media by default.

So: media stays in the git-ignored `workspace/`, hashes and provenance are
recorded in `media-inventory.json`, nothing is deleted, and nothing is published.

---

## The two lecture formats

| | Module 1 | Module 2 |
|---|---|---|
| Surface | iPad handwriting on a dark grid, 1600×1200 | reveal.js deck recording, 1024×768 |
| Also uses | `S2_Budget_Constraint_Ch2` deck, live EconGraphs | Desmos widgets, occasional iPad |
| Screen source | Frame extraction + reading | Deck Markdown, at exact fidelity |

Module 2's slides come from `econ100a-slides_homeworks/docs/` — `S3_Preferences_Ch3.md`
and `S4_Utility_Ch4.md`. Slide text quoted in the screen inventories is taken
from that source rather than read off a frame, so it is exact. Module 1's
handwritten pages have no source and were read from extracted frames.

Captions are **human-authored, not ASR** (YuJa reports `captionTypes: HUMAN`),
which is why transcript quality is high — and why the caption errors listed
below are worth fixing rather than shrugging at.

---

## Pipeline

```bash
# 1. Screens: detect cuts, sample each interval at its settled state
python3 extract_screens.py VIDEO OUTDIR --threshold 0.05 --max-interval 60
./extract_all.sh                      # all 11

# 2. Readable transcripts from the published captions
python3 srt_to_transcript.py captions/SLUG.srt > transcripts/SLUG.md

# 3. Contact sheets for review (2×2 for handwriting, 3×3 for slides)
python3 contact_sheets.py FRAMEDIR OUTDIR --cols 2 --rows 2 --final-only

# 4. Re-collect downloads from ~/Downloads into the workspace
./collect_videos.sh
```

Cut detection runs on a 320px downscale, which is ~30× faster and preserves the
transitions that matter. Because handwritten content accumulates *within* a
page, each interval is sampled near its end — the completed state — rather than
at its start.

---

## Lectures

### Module 1 — Intro and Budget

| | Lecture | Runtime |
|---|---|---|
| L1 | [Introduction to Microeconomics](lectures/m1-l1-intro-microeconomics.md) | 4:21 |
| L2 | [Consumption Bundles and the Budget Line](lectures/m1-l2-consumption-bundles-and-budget-line.md) | 25:21 |
| L3 | [Changes in the Budget Line](lectures/m1-l3-changes-in-budget-line.md) | 12:43 |
| L4 | [Taxes (and Gifts)](lectures/m1-l4-taxes.md) | 20:07 |

### Module 2 — Preferences and Utility

| | Lecture | Runtime |
|---|---|---|
| L1 | [Preferences, Part 1](lectures/m2-l1-preferences-part1.md) | 17:30 |
| L2 | [Preferences, Part 2: Indifference Curves and Convexity](lectures/m2-l2-preferences-part2.md) | 12:24 |
| L3 | [Utility, Part 1](lectures/m2-l3-utility-part1.md) | 21:52 |
| L4 | [Utility, Part 2: Drawing Indifference Curves](lectures/m2-l4-utility-part2.md) | 12:45 |
| L5 | [Typical Utility Functions](lectures/m2-l5-typical-utility-function.md) | 14:59 |
| L6 | [Marginal Utility](lectures/m2-l6-marginal-utility.md) | 9:07 |
| L7 | [The Marginal Rate of Substitution](lectures/m2-l7-marginal-rate-of-substitution.md) | 17:50 |

---

## Cross-cutting findings

**Needs Kristian's decision.**

1. **A published caption asserts the opposite of what is taught.** `m2-l3` at
   09:27 reads *"we can say that X is three times as preferred as Y"* — the exact
   misconception the passage exists to refute. Highest-value single fix.
2. **`content/packs/budget-line/pack.yaml` under-attributes Kristian.** Its
   provenance note says coffee/orange juice replaced his original goods. The
   video shows coffee and orange juice are his own, from 01:41 onward, along with
   $m=100$, $p_1=3$, $p_2=1$. The pack was not modified — that is outside this
   task's claim.
3. **`m2-l4` Example 2 may have a mislabelled utility function.** The derivation
   reaches $x_2 = (5-x_1)^2$, which corresponds to $\sqrt{x_1}+\sqrt{x_2}=5$,
   not the stated $\sqrt{x_1+x_2}=5$. The domain lesson is valuable either way,
   but the function needs checking.

**Caption errors to fix** (human-authored, so these are vendor typos):
- Kristian's name is spelled "Cristian" (`m1-l1`).
- "Cobb-Douglas" → "cab daggers" (`m2-l6`, 03:58).
- "budget constraint" → "value constraint" (`m1-l3`).
- "perfect complements" said where "perfect substitutes" is meant (`m2-l7`, 14:21).

**Teaching worth preserving deliberately.**
- The food-stamp kink built from a single point, then generalized (`m1-l4`).
- "Maybe pause the video and think about it" before the $p_2$ case (`m1-l3`).
- The completeness counterexample: "I don't know" ≠ indifference (`m2-l1`).
- Stating what monotonicity *cannot* rank (`m2-l1`).
- Chocolate as a good that becomes a bad at a quantity (`m2-l2`).
- The on-camera domain-restriction self-correction (`m2-l4`).
- Perfect complements derived by splitting the space, then verified numerically (`m2-l5`).
- Two utility functions yielding the same MRS, staged as a surprise (`m2-l7`).

**Gaps in the recorded material.**
- The deck exercise *"Can two distinct indifference curves cross each other?"* is
  never addressed on video.
- The three goods/bads/neutrals indifference curves are never drawn.
- `m1-l4` sets three ungraded exercises and answers none of them.
- Diminishing marginal utility is introduced (`m2-l6`) and never used.
- `m1-l1` spends ~2 of its 4 minutes on a blank page.
