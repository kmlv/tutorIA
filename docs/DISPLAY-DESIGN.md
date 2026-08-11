# Display architecture for the concept delivery

Synthesis of T-010, a four-way design consult. Written by `claude` (Opus 5) as lead
from independent proposals by `agy` (Gemini), `codex` (GPT-5.6), `fable` (Fable-5) and
claude.

**Status: proposal. Kristian has not signed off, and two questions below are his.**

---

## 0. Why this exists

Kristian reviewed the running delivery and rejected the screen design:

> "Putting the graph as the single central element is wrong, and having only the notes
> on the side is also wrong. […] When you introduce a good, put an image of that good
> and how it translates into a number. […] So that there is a better connection between
> the concept, the idea, the equation, the magnitudes that go inside the equation, and
> the graph. That seems essential to me. […] We also have to rethink what place the
> equations and the text should occupy, because as it is now it seems like an
> afterthought."

He is right, and the sidebar was literally an afterthought: it was added because he
asked for text and formulas on the page, and placed where there was room.

---

## 1. The diagnosis all four reached independently

The screen shows the END of a chain and hides the middle. A student sees a line on axes
labelled "coffee" and "orange juice" and is expected to already believe three
translations that nothing on screen ever performs:

```
   a good        →   a measured quantity   →   a symbol   →   a location
   coffee            kilograms of coffee       x₁             a point on the plane
```

Those translations **are** the concept. The budget line is the last consequence. We
built the consequence and skipped the concept.

---

## 2. What is agreed, 4 of 4

| # | Agreed | Note |
|---|---|---|
| A1 | **The equation is a structural spine, never a sidebar** | It is the only object containing every link at once: goods (subscripts), quantities (x), prices (p), budget (m) |
| A2 | **A persistent card per good**: glyph → unit → symbol → price | It is a dictionary entry, on screen for the whole delivery, so a glance recovers what x₁ means |
| A3 | **Captions at the bottom, full width, always** | — |
| A4 | **The same object highlights across card, equation and graph simultaneously** | This is the coherence Kristian asked for |
| A5 | **Three horizontal bands**: ledger ≈18%, stage ≈67%, captions ≈15% | All four converged on nearly identical proportions |
| A6 | **The dock coexists at the right and never overlays the captions** | `codex`: default it collapsed during narration |

## 3. What is agreed, 3 of 4

| # | Agreed | Dissent |
|---|---|---|
| B1 | **Inline SVG glyphs, not emoji** | `agy` proposed emoji for zero bytes. Rejected: emoji render inconsistently on exactly the old systems criterion 5 protects, cannot inherit theme colour, and are announced by screen readers with their Unicode name — 🍊 is "tangerine", which is the wrong good |
| B2 | **Captions are the literal spoken sentence** | `agy` proposed a distilled line, narration to `aria-live` only. Rejected: that splits the experience — a sighted student reads one text while a screen-reader user hears another — and a distilled line is a heading, not a caption. We have sentence timings, so the literal sentence is synchronised for free in both languages |
| B3 | **Keep the pack assignment (coffee = good 1)** until Kristian says otherwise | `agy` silently adopted the swap Kristian voiced. See §6 |

---

## 4. The three ideas worth taking, each from a different agent

### 4.1 The provenance invariant — `fable`

> **Nothing appears from nowhere.** Every object that matters enters the screen once,
> stays, and every later appearance of it is visibly derived — by travelling, cloning or
> morphing — from where it already lives.

This is the strongest idea in the consult, and it is stronger than my own proposal for a
precise reason: I proposed highlighting as an *effect applied at chosen moments*; this is
a *rule the whole design obeys*. The axis label is not simply present — the student
watches the unit chip leave the coffee card and dock at the axis. The numeral 3 in the
equation arrives from the price tag.

It also yields a small, testable animation vocabulary — **dock, clone-travel, morph,
project** — instead of ad-hoc motion, and it comes with its own falsifiable constraint:

> The final static frame of every cue must carry the full meaning without the motion.

That makes `prefers-reduced-motion` a first-class case rather than a degradation, and it
is what keeps the design portable to the M4 bake-off, where Remotion and Manim have to
reproduce the same *states* but not necessarily the same choreography.

### 4.2 The dimensional equation — `codex`

Show the equation with units before, or alongside, the compact form:

```
   3 $/kg · x₁ kg  +  1 $/L · x₂ L  =  100 $
                    ↓
              3x₁ + x₂ = 100
```

This is the most direct answer to Kristian's request. He asked for "the magnitudes that
go inside the equation"; this puts the units *inside* the equation rather than beside it,
and it makes the slope's unit — litres per kilo — something the student can read off
rather than be told.

`codex` also contributes **shape markers alongside hue**, so the good↔symbol binding never
depends on colour alone, and a `recap` that collapses the lesson into a left-to-right
chain of five snapshots: good → measured quantity → symbol → constraint → line.

### 4.3 The equation is assembled, not displayed — `fable`, sharpened by `claude`

The equation slot starts empty. Its parts arrive by clone-travel: symbols from the card
symbol stations, numerals from the price tags, `m` from an income tag that appears at
`budget_set`. By the time the full equation exists, the student has watched every part of
it arrive from something already understood.

My contribution here is the mechanism: the build-time KaTeX renderer already emits static
markup, so `pipeline/render_math.mjs` can wrap each term in a span with a stable id at
**zero runtime cost**. Without addressable terms, none of the cross-highlighting in A4 is
possible.

### 4.4 Progressive compression — `fable`

After `slope`, the cards compress to a slim strip and the stage grows. The scaffold
shrinks as the binding is internalised, but never disappears. It mirrors where the
lesson wants attention: ledger-dominant while translations are being built,
stage-dominant once they hold.

---

## 5. The synthesised design

```
┌──────────────────────────────────────────────────────────────────────┐
│ LEDGER  ~18%                                                          │
│  ┌──────────────────┐   ┌────────────────────┐   ┌──────────────────┐│
│  │ ☕ glyph          │   │  EQUATION SLOT      │   │ 🍊 glyph         ││
│  │ measured in  kg  │   │  assembled, never   │   │ measured in  L   ││
│  │ quantity     x₁  │   │  merely displayed   │   │ quantity     x₂  ││
│  │ price     $3/kg  │   │  per-term ids       │   │ price     $1/L   ││
│  └──────────────────┘   └────────────────────┘   └──────────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│ STAGE  ~67%          axes · sample points · region · line · triangle  │
├──────────────────────────────────────────────────────────────────────┤
│ CAPTION  ~15%        the sentence being spoken, verbatim, selectable  │
└──────────────────────────────────────────────────────────────────────┘
```

Each good owns a hue **and** a shape marker, carried constantly on card border, equation
terms, axis label, intercept and drop-lines. Hue is never the sole carrier: symbols are
always written out.

### What each cue paints

| cue | ledger | stage | equation slot |
|---|---|---|---|
| `consumo` | both glyphs dock in | empty | empty |
| `canasta` | quantity stations fill | — | `(x₁, x₂)` docks |
| `espacio` | unit + symbol stations fill; **unit chips clone-travel to the axes** | axes appear in each good's hue; a sample bundle projects as a point with drop-lines | `(x₁, x₂)` |
| `budget_set` | price stations fill; income tag appears | region projects; sample points now read inside/outside | parts travel in to assemble `p₁x₁ + p₂x₂ ≤ m`, with the dimensional form shown first |
| `budget_line` | still | region dims, boundary strengthens | `≤` **morphs** to `=` — one glyph, one dimming, nothing else moves |
| `intercepts` | — | each intercept dot is projected by the term that produces it | `m`, `p₁`, `p₂` tint in turn |
| `slope` | cards begin compressing after this cue | slope triangle projects, labelled `−3 L/kg` | `p₁` and `p₂` tint together |
| `cp1` | frozen, dimmed | frozen | frozen |
| `income_shift` | income tag morphs 100→150 | ghost + parallel line | `m` tints |
| `price_pivot` | coffee price tag morphs 3→4 | pivot; the juice intercept pulses to say "I did not move" | `p₁` tints in coffee's hue |
| `cp2` | frozen, dimmed | frozen | frozen |
| `recap` | compression reverses | base line restored | full equation; the chain pulses once left to right |

> **Sequencing bug this fixes.** Today `budget_set` draws the line *and* the region and
> `budget_line` draws nothing new — so at the exact moment the narration says "the line
> is only the edge of that region", the screen does not change. In the design above,
> that sentence is the only moment `≤` becomes `=`.

### Cost

| Item | Weight |
|---|---|
| Two inline SVG glyphs | ~3 KB |
| Per-term spans in the pre-rendered KaTeX | ~1 KB markup, zero runtime |
| FLIP utility for the four verbs | ~2 KB |
| Cards, hues, bands | CSS only |
| **Total** | **under 10 KB gz**, against ~133 KB of headroom |

All motion is `transform`/`opacity` on small elements, at most two concurrent. Nothing
reflows. Under `prefers-reduced-motion` every verb becomes a crossfade.

---

## 6. Open for Kristian

### K1 · Which good is x₁?

You said *"ounces of coffee … x₂"* and *"orange juice … x₁"*, which is the **reverse** of
the pack, where coffee is good 1. `agy` adopted your version; `codex` and `claude` flagged
it rather than assume.

It matters more than usual here, because the entire redesign is about making the
symbol↔good binding explicit. If the binding in your head is the opposite of the one on
screen, the design fails for you specifically.

Weak recommendation: keep coffee as good 1, so the expensive good is on the horizontal
axis and the slope is steeper than 1, which makes the trade-off easier to see. But this
is yours.

### K2 · Is the choreography worth it?

The provenance invariant is the best idea here, and it is also the most expensive and the
least portable: the M4 bake-off options would have to reproduce the same motion, and
Manim and Remotion are pre-rendered, so "clone-travel" becomes real animation work per
concept.

Three options, in increasing cost:

1. **States only.** Build the three bands, the cards, the assembled equation and the
   cross-highlighting, with crossfades instead of travel. Keeps everything Kristian
   asked for; drops the "watch it happen" quality.
2. **States plus the two cheapest verbs** (`morph` and `project`). The `≤`→`=` morph and
   the intercept projection are where the pedagogy actually lives.
3. **The full four verbs.** Best delivery, most expensive, and the hardest for the
   bake-off to match.

Recommendation: **option 2.** `morph` and `project` carry the causal claims — a glyph
changing and a term casting its consequence — while `dock` and `clone-travel` are mostly
about origin, which the persistent cards already communicate statically.

---

## 7. Process notes, recorded because they affect how to read this

- **The blind round was not blind for `fable`.** The coord wake prelude embeds the full
  thread body. `fable` woke after three proposals were posted and had them in its
  prelude; it disclosed this itself rather than letting the convergence read as
  independent. Discount its agreement accordingly. Its two original contributions — the
  provenance invariant and progressive compression — appear in none of the other three.
- **`./coord-msg.sh` did not exist in this repo**, and the MCP `coord_post` tool
  permission-bounces in headless wakes. Agents had no working writer, which is why
  `agy`'s T-001 signature was silently lost. Found by `fable`; fixed.
- For the next blind consult the wake prelude has to be trimmed to the brief. Until then
  a blind round only holds for agents woken **simultaneously**.
