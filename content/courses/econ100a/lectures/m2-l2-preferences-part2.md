# M2 · L2 — Preferences, Part 2: Indifference Curves and Convexity

| | |
|---|---|
| **Source** | YuJa `v=1348889` |
| **Runtime** | 12:24 (744 s) |
| **Format** | reveal.js deck (`S3_Preferences_Ch3`), heavy use of embedded Desmos widgets |
| **Screens captured** | 11 settled states from 14 detected cuts |

---

## 1. Synthesis

Picks up exactly where L1 left a gap. Monotonicity could not rank bundles where
one good rises and another falls; indifference curves are the object that can.

**Indifference sets.** Defined as "a set of bundles that the consumer regards as
equal" — repeated twice for emphasis. Take a bundle $x$, collect every bundle
indifferent to it, and that collection is $I(x)$. He is careful about a naming
problem the textbook glosses over: **an indifference set need not be a curve.**
It can be a thick band. Only under further assumptions does it thin out into a
curve, which is why "indifference set" is the more honest term.

The worked instance uses the course's running goods: $(3,4) \sim (1,12)$ and
$(6,2)$ on the same curve — three ounces of coffee with four cups of juice feels
the same as one ounce with twelve.

**Weakly preferred set.** The shaded region containing every bundle at least as
good as those on the curve.

**How many curves?** Infinitely many — "in most cases uncountable, infinite". But
you never draw them all; a handful conveys the preferences, because the
information lives in the *shape*: the slope and how curved they are. From a
four-curve indifference map he reads off that the consumer is monotonic
(curves slope downward) and treats the two goods roughly symmetrically.

**Goods, bads, neutrals.** A **good** is a commodity you want more of. A **bad**
is one you want less of — trash. A **neutral** leaves you unaffected. The good
example is unusually careful: chocolate is a good *up to a point*. Half a
kilogram in a week is fine; past that, more actively hurts, and chocolate has
become a bad. So goodness is a property of the commodity **at a quantity**, not
a permanent label.

**Convexity.** The assumption that people like balance — averages over extremes.
If $x$ is all coffee and $y$ is all orange juice, the fifty-fifty mixture
$z = 0.5x + 0.5y$ is at least as preferred as either. He then makes the move
that matters: convexity is not primarily a statement about mixtures, it is what
*forces the shape of the curve*. For $z$ to beat both $x$ and $y$ when $x$ and
$y$ sit on the same indifference curve, that curve must bow toward the origin.
He closes with the counterexample — a curve bowed the wrong way, where the
averaged bundle is worse — and points out that this is the only way it can look
if convexity fails.

---

## 2. Screens

| # | Time | On screen |
|---|---|---|
| 1 | 00:25 | **Indifference Curves or Indifference Sets** — a set of bundles a consumer regards as equal; take $x$, all bundles equally preferred form $I(x)$; every $y$ in the set has $y \sim x$; "since an indifference 'curve' is not necessarily a curve, we might want to call it *indifference set*" |
| 2 | 02:10 | **Indifference Curve (example)** — Desmos widget, coffee on the horizontal axis and orange juice on the vertical, showing $(3,4) \sim (1,12)$ |
| 3 | 03:00 | Same widget with $(6,2)$ also marked on the curve |
| 4 | 03:20 | **Weakly preferred set _WP(x)_** — "WP(3,4) is the shaded area", Desmos widget with the region shaded above the curve |
| 5 | 03:55 | **Is there only one indifference curve?** — "No! Typically, there are infinite"; "in most cases it makes sense we talk and draw several (*the indifference map*)", Desmos widget |
| 6 | 04:40 | Indifference map showing four downward-sloping curves |
| 7 | 05:30 | **Goods Vs. Bads Vs. Neutrals** — "Assume $x_2$ is a good: more is better. Draw an IC for each case:" $x_1$ is a good · $x_1$ is a bad · $x_1$ is a neutral |
| 8 | 07:45 | **Assumption on Preferences (4): Convexity** — "Mixtures of bundles are (weakly) preferred to the bundles themselves"; "if the 50-50 mixture of the bundles $x$ and $y$ is formed like this $z = (0.5)x + (0.5)y$, then $z$ is at least as preferred as $x$ OR $y$" |
| 9 | 09:20 | **Assumption on Preferences (4): Convexity** — textbook figure `INTMIC9_FIG03_10A`: two extreme bundles on an indifference curve with the averaged bundle inside the weakly preferred set |
| 10 | 10:50 | **Assumption on Preferences (4): Convexity** — "Example of preferences that do **not** satisfy convexity", figure `INTMIC9_FIG03_10B`: dark blue indifference curve bowed the wrong way, light blue weakly preferred set, averaged bundle *outside* it |
| 11 | 12:10 | Final slide held to close |

---

## 3. Regenerated script

```markdown
# Indifference Curves and the Taste for Balance

<!--cue:gap-->
Last time we ended on a gap. More-is-better ranks bundles where one has more of
everything, and says nothing at all when one good goes up while another goes
down. Which is most of the interesting cases. So we need an object that speaks
to exactly those trade-offs.

<!--cue:indifference_set-->
Here it is. Take a bundle $x$. Now collect every other bundle that this consumer
regards as *equally good* — no better, no worse. That collection is the
indifference set containing $x$, and we write it $I(x)$. Every bundle $y$ inside
it satisfies $y \sim x$.

<!--cue:not_a_curve-->
A warning about the name. We say "indifference curve" out of habit, but nothing
so far forces this set to be a thin curve. It could be a thick band. Only once
we add more assumptions does it narrow into a line, so "indifference set" is the
honest term and "curve" is the special case.

<!--cue:example-->
Concretely, with coffee on one axis and orange juice on the other: three ounces
of coffee and four cups of juice might feel exactly the same to you as one ounce
of coffee and twelve cups of juice. If so, $(3,4) \sim (1,12)$, and both sit on
the same curve. Maybe $(6,2)$ is on it too. That single curve is a statement
about what you are willing to trade.

<!--cue:weakly_preferred-->
Now shade everything at least as good as that curve — the curve itself and
everything beyond it. That region is the weakly preferred set.

<!--cue:predict:how_many-->
<!--cue:many_curves-->
How many indifference curves are there? Not one. Not a few. Infinitely many —
through every single bundle in the space there runs a curve. But you never need
to draw them all. Sketch four or five and you have said what you needed to,
because the information is not in how many there are. It is in their **shape**:
which way they slope, and how sharply they bend. Downward-sloping curves, for
instance, tell you the consumer is monotonic.

<!--cue:goods_bads-->
That shape depends on what kind of commodity you are dealing with. A **good** is
something you want more of — chocolate, up to a point. A **bad** is something
you want less of: trash. And a **neutral** is something you are simply
indifferent to; more or less of it changes nothing.

<!--cue:chocolate-->
Notice "up to a point", because it matters. Chocolate is a good while you are
eating the first half kilo in a week. Past that, more of it starts to hurt, and
now the same commodity is a bad. So being a good is not a permanent label
stamped on a commodity — it is a property at a given quantity.

<!--cue:convexity-->
One more assumption, and it is about balance. Most people, offered a bundle of
nothing but coffee or a bundle of nothing but orange juice, would rather have
some of each. Convexity states that: take any two bundles $x$ and $y$, form the
fifty-fifty mixture $z = 0.5x + 0.5y$, and $z$ is at least as preferred as
either one.

<!--cue:predict:convex_shape-->
<!--cue:convex_shape-->
And here is why we care, because this is not really a claim about mixtures — it
is a claim about the shape of the curve. Put $x$ and $y$ on the *same*
indifference curve, so the consumer is indifferent between them. Convexity says
the average of the two is at least as good as both. For the averaged bundle to
sit inside the weakly preferred region, the curve running between $x$ and $y$
has to bow inward, toward the origin. That inward bow *is* convexity, drawn.

<!--cue:non_convex-->
And if preferences are not convex? Then the curve bows the other way, and the
averaged bundle falls outside the weakly preferred set — the mixture is worse
than both extremes. Someone who would rather have a full plate of one thing
than a bit of each has preferences that look like that. It is a coherent taste;
it just is not the one we normally assume.

<!--cue:recap-->
To recap. An indifference set collects the bundles a consumer regards as equal,
and it is only a thin curve once we assume enough. The weakly preferred set is
everything at least as good. There are infinitely many curves, and the shape
carries the information. Commodities can be goods, bads, or neutrals — and the
same commodity can switch as the quantity grows. Convexity says mixtures beat
extremes, which is exactly the same statement as: indifference curves bow
toward the origin.
```

---

## 4. Flags for Kristian

- **"An indifference set is not necessarily a curve"** is a distinction most
  courses skip, and you make it in the first ninety seconds. Preserved above.
- **The chocolate example is the best version of goods/bads I have seen in this
  material**, precisely because the commodity *changes category* at a quantity
  rather than being labelled once. Worth reusing in the pack.
- **The deck asks students to draw three indifference curves** (good, bad,
  neutral) on the Goods/Bads/Neutrals slide, but the video does not draw them —
  screen 7 is on screen while you talk through the definitions verbally. Those
  three sketches are missing from the recorded material.
- **The home exercise "Can two distinct indifference curves cross each other?"**
  appears in the deck right after this slide and is never addressed on video.
  Same flag as in L1.
