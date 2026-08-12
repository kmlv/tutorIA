# M2 · L6 — Marginal Utility

| | |
|---|---|
| **Source** | YuJa `v=1348968` |
| **Runtime** | 9:07 (548 s) — the shortest video in Module 2 |
| **Format** | reveal.js deck (`S4_Utility_Ch4`) + iPad worked derivatives |
| **Screens captured** | 14 settled states from 19 detected cuts |

---

## 1. Synthesis

A short, dense, almost entirely mechanical lecture. It introduces one concept
and then computes it three times.

**The concept.** "Marginal, in a sense, means incremental." Marginal utility
measures how sensitive satisfaction is to consuming more of one good. He states
it twice, deliberately, then lands the mathematical identity — and repeats *that*
twice as well: **marginal utility is a partial derivative.**

$$MU_1 = \frac{\partial u}{\partial x_1} \qquad MU_2 = \frac{\partial u}{\partial x_2}$$

**The payoff that makes it worth having.** Goods, bads and neutrals — defined
twice already in Module 2, first as preference directions and then as effects on
utility — collapse into the sign of a derivative:

| | marginal utility |
|---|---|
| good | $MU > 0$ |
| bad | $MU < 0$ |
| neutral | $MU = 0$ |

This is the third and sharpest statement of the same trio, and it is the moment
the whole category becomes computable rather than descriptive.

**Second derivatives, briefly.** Marginal utility itself can rise or fall as
consumption grows; you check by differentiating $MU_1$ with respect to $x_1$
again. Raised and then dropped — diminishing marginal utility is set up but not
developed here.

**Three worked examples**, all correct as computed on screen:

| # | $u$ | $MU_1$ | $MU_2$ |
|---|---|---|---|
| 1 | $x_1^{1/2}x_2$ | $\tfrac{1}{2}x_1^{-1/2}x_2$ | $x_1^{1/2}$ |
| 2 | $x_1x_2^2$ | $x_2^2$ | $2x_1x_2$ |
| 3 | $2x_1 + 3x_2$ | $2$ | $3$ |

Example 3 is the quietly instructive one: for perfect substitutes the marginal
utilities are **constants**. Every additional unit is worth exactly as much as
the last, which is the analytic fingerprint of a straight indifference curve —
though the video leaves that connection for the MRS lecture to make.

---

## 2. Screens

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:10 | Deck | **Marginal Utility** — title |
| 2 | 00:40 | Deck | Definition: the rate of change of total utility as the quantity consumed of a good increases |
| 3 | 01:10 | Deck | $MU_1 = \partial u/\partial x_1$ |
| 4 | 01:40 | Deck | $MU_2 = \partial u/\partial x_2$ |
| 5 | 02:20 | Deck | Signs table: good ⟹ $MU > 0$; bad ⟹ $MU < 0$; neutral ⟹ $MU = 0$ |
| 6 | 03:00 | Deck | Marginal utility can itself be increasing or decreasing; check with $\partial MU_1/\partial x_1$ |
| 7 | 03:50 | iPad | *Examples of marginal utility.* Example 1: $u = x_1^{1/2}x_2$ |
| 8 | 04:40 | iPad | $MU_1 = \partial u/\partial x_1$; exponent rule applied → $\tfrac{1}{2}x_1^{-1/2}$, times $x_2$ held constant |
| 9 | 05:30 | iPad | $MU_2 = \partial u/\partial x_2 = 1 \cdot x_1^{1/2} = x_1^{1/2}$ |
| 10 | 06:20 | iPad | Example 2: $u = x_1x_2^2$; $MU_1 = 1 \cdot x_2^2$ |
| 11 | 07:00 | iPad | $MU_2 = x_1 \cdot 2x_2 = 2x_1x_2$ |
| 12 | 07:50 | iPad | Example 3, perfect substitutes: $u = 2x_1 + 3x_2$ ($\alpha = 2$, $\beta = 3$) |
| 13 | 08:30 | iPad | $MU_1 = 2$ |
| 14 | 08:50 | iPad | $MU_2 = 3$; closing |

---

## 3. Regenerated script

```markdown
# Marginal Utility

<!--cue:concept-->
Marginal means incremental. So marginal utility asks a very specific question:
if the consumer gets a little more of one good, how much does their satisfaction
move? Not how satisfied are they in total — how *sensitive* is that satisfaction
to one more unit.

<!--cue:derivative-->
And if that sounds like something from your calculus course, it is. The rate of
change of total utility as we increase one good, holding the others fixed, is a
partial derivative. That is all marginal utility is:
$MU_1 = \partial u / \partial x_1$, and likewise
$MU_2 = \partial u / \partial x_2$. The economics gave it a name; the
mathematics already had one.

<!--cue:predict:signs-->
<!--cue:signs-->
Now go back to goods, bads and neutrals, and ask what each one means here.
A good is something you want more of, so more of it raises utility — its
marginal utility is **positive**. A bad lowers utility, so its marginal utility
is **negative**. And a neutral changes nothing, so its marginal utility is
**zero**. Those three categories, which we first described in words, are now
just the sign of a derivative. That is what the utility language bought us.

<!--cue:second_derivative-->
One more layer. Marginal utility is itself a function, so it can rise or fall as
you consume more. To find out which, differentiate it again: take
$\partial MU_1 / \partial x_1$. We will come back to why a *falling* marginal
utility is the interesting case.

<!--cue:example1-->
Let us compute some. First, $u = x_1^{1/2}x_2$. For $MU_1$, differentiate with
respect to $x_1$ and treat $x_2$ as a constant that comes along for the ride:
the exponent one-half drops to the front and the power falls by one, giving
$\tfrac{1}{2}x_1^{-1/2}$, all multiplied by $x_2$. For $MU_2$, now $x_1^{1/2}$ is
the constant, and the derivative of $x_2$ is just one — so $MU_2 = x_1^{1/2}$.

<!--cue:example2-->
Second, $u = x_1x_2^2$. Differentiating with respect to $x_1$: the $x_1$ becomes
one and $x_2^2$ rides along, so $MU_1 = x_2^2$. With respect to $x_2$: bring the
two down, drop the exponent to one, keep $x_1$ — so $MU_2 = 2x_1x_2$.

<!--cue:example3-->
Third, and watch what happens. Perfect substitutes: $u = 2x_1 + 3x_2$.
Differentiate with respect to $x_1$ and the $x_2$ term vanishes entirely,
leaving $MU_1 = 2$. Likewise $MU_2 = 3$.

<!--cue:example3_meaning-->
Look at what those answers are — plain numbers, with no $x$ in them. The
marginal utilities are **constant**. The five-hundredth unit of good one is
worth exactly as much as the first. And that is precisely why the indifference
curves for perfect substitutes came out as straight lines: the rate at which
this consumer trades the goods never changes, because the value of one more unit
never changes.

<!--cue:recap-->
To recap. Marginal utility is the partial derivative of the utility function
with respect to one good. Its sign classifies the commodity: positive for a
good, negative for a bad, zero for a neutral. It can itself rise or fall, found
by differentiating a second time. And when marginal utilities come out constant,
you are looking at perfect substitutes.
```

---

## 4. Flags for Kristian

- **The signs table is the best thirty seconds in Module 2 for consolidation.**
  Goods/bads/neutrals get defined three separate times across L2, L4 and L6; this
  is the version that makes them computable. A regenerated pack should probably
  define them once, in words, and then land here.
- **Example 3's constant marginal utilities are never linked to the straight
  indifference curves from L5**, although the two facts are the same fact. That
  connection is free and I have added it above (`cue:example3_meaning`) — worth
  checking you agree with placing it here rather than in the MRS video.
- **Diminishing marginal utility is set up and dropped.** Screen 6 introduces
  the second derivative, then nothing in Modules 1-2 uses it. Either it belongs
  later or this beat should point forward explicitly.
- **Caption error worth fixing.** At 03:58 the caption reads *"one kind of cab
  daggers"* where you said **Cobb-Douglas**. File:
  `content/courses/econ100a/captions/m2-l6-marginal-utility.srt`.
