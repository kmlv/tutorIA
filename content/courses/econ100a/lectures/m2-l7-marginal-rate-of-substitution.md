# M2 · L7 — The Marginal Rate of Substitution

| | |
|---|---|
| **Source** | YuJa `v=1349009` |
| **Runtime** | 17:50 (1070 s) |
| **Format** | reveal.js deck (`S4_Utility_Ch4`) + iPad proof and worked examples |
| **Screens captured** | 32 settled states from 47 detected cuts |
| **Role** | Closes Module 2 and previews consumer choice (Module 3) |

---

## 1. Synthesis

The lecture that ties Module 2 together: it derives one formula, then uses that
formula to *retroactively confirm* two earlier claims. Structurally the most
satisfying video in the two modules.

**What MRS means before any algebra.** The MRS is the slope of an indifference
curve at a particular bundle, and he reads the economics straight off the
steepness: a **steep** curve means the consumer values good 1 highly relative to
good 2; a **flat** curve means the reverse. The concept is given meaning before
it is given a formula.

**The derivation.** Done on the deck and then again on the iPad, using total
differentiation:

1. Along an indifference curve, utility is constant: $u(x_1, x_2) = k$.
2. Totally differentiate: $\dfrac{\partial u}{\partial x_1}dx_1 + \dfrac{\partial u}{\partial x_2}dx_2 = dk$.
3. $k$ is a constant, so $dk = 0$.
4. The partials *are* the marginal utilities: $MU_1\,dx_1 + MU_2\,dx_2 = 0$.
5. Divide by $dx_1$, rearrange, and

$$MRS = \frac{dx_2}{dx_1} = -\frac{MU_1}{MU_2}$$

**Three examples, and the third and second do real work.**

| # | $u$ | $MU_1$ | $MU_2$ | MRS |
|---|---|---|---|---|
| 1 | $x_1^2x_2$ | $2x_1x_2$ | $x_1^2$ | $-\dfrac{2x_2}{x_1}$ |
| 2 | $x_1\sqrt{x_2}$ | $\sqrt{x_2}$ | $\tfrac{1}{2}x_1x_2^{-1/2}$ | $-\dfrac{2x_2}{x_1}$ |
| 3 | $x_1 + 5x_2$ | $1$ | $5$ | $-\dfrac{1}{5}$ |

**The payoff in example 2.** Two visibly different utility functions produce the
*identical* MRS, and he stages it as a surprise — "wait a second, where have we
seen this before?" — before explaining it. The reason is the uniqueness result
from L3: $x_1^2x_2 = (x_1\sqrt{x_2})^2$, so one is an increasing transformation
of the other. Same preferences ⟹ same indifference map ⟹ same slopes ⟹ same
MRS. He names it explicitly: *"all this coincidence is actually not a
coincidence, it's a mathematical implication."* This is the moment Module 2's
separate threads visibly connect.

**The payoff in example 3.** For perfect substitutes the MRS is a constant,
$-1/5$, with no $x$ in it — and he generalizes: perfect substitutes *always*
have constant MRS. He then offers it as an alternative **definition**: perfect
substitutes are preferences whose rate of substitution does not depend on the
bundle. That closes the loop with L5's parallel straight-line indifference
curves, which must have a single slope.

**Closing.** The module ends by pointing forward: budget constraint plus
preferences will combine into consumer choice — "how the consumer uses their
wallet and their brain to find the best affordable thing."

---

## 2. Screens

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:15 | Deck | **Marginal Utilities and the MRS** — title |
| 2 | 00:50 | Deck | MRS as the slope of an indifference curve; steep vs flat read as relative valuation |
| 3 | 01:40 | Deck | The result highlighted: $MRS = \dfrac{dx_2}{dx_1} = -\dfrac{MU_1}{MU_2}$ |
| 4 | 02:20 | Deck | Step 1: along an indifference curve, $u = k$ |
| 5 | 02:50 | Deck | Step 2: total differentiation, $\tfrac{\partial u}{\partial x_1}dx_1 + \tfrac{\partial u}{\partial x_2}dx_2 = dk$ |
| 6 | 03:40 | Deck | Step 3: $dk = 0$ because $k$ is constant |
| 7 | 04:10 | Deck | Step 4: partials replaced by $MU_1$, $MU_2$ |
| 8 | 04:50 | Deck | Step 5: divide by $dx_1$ and solve → the MRS formula |
| 9 | 05:20 | iPad | Handwritten heading **Marginal rate of substitution**; goal stated: show slope $= -MU_1/MU_2$ |
| 10 | 06:00 | iPad | $u(x_1,x_2) = k$ written |
| 11 | 06:40 | iPad | Total differential written out longhand |
| 12 | 07:00 | iPad | $dk = 0$ marked; partials identified as $MU_1$, $MU_2$ |
| 13 | 07:20 | iPad | $MU_1dx_1 + MU_2dx_2 = 0$ |
| 14 | 07:50 | iPad | Divided by $dx_1$ |
| 15 | 08:00 | iPad | Rearranged to $\dfrac{dx_2}{dx_1} = -\dfrac{MU_1}{MU_2}$ — proof complete |
| 16 | 08:30 | iPad | *Example 1* (yellow): $u = x_1^2x_2$ |
| 17 | 09:00 | iPad | $MU_1 = 2x_1x_2$, $MU_2 = x_1^2$ |
| 18 | 09:30 | iPad | Simplified: $MRS = -\dfrac{2x_2}{x_1}$ |
| 19 | 10:00 | iPad | *Example 2*: $u = x_1\sqrt{x_2}$ |
| 20 | 10:40 | iPad | $MU_1 = \sqrt{x_2}$ |
| 21 | 11:10 | iPad | $MU_2 = x_1 \cdot \tfrac{1}{2}x_2^{-1/2}$ |
| 22 | 11:50 | iPad | Exponent simplification worked step by step |
| 23 | 12:30 | iPad | Result: $MRS = -\dfrac{2x_2}{x_1}$ — same as example 1 |
| 24 | 13:00 | iPad | The two utility functions set side by side, question raised |
| 25 | 13:40 | iPad | Explanation: one is an increasing transformation of the other, so same preferences, same MRS |
| 26 | 14:10 | iPad | *Example 3*: $u = x_1 + 5x_2$ |
| 27 | 14:40 | iPad | $MU_1 = 1$, $MU_2 = 5$ |
| 28 | 15:00 | iPad | $MRS = -\tfrac{1}{5}$ |
| 29 | 15:30 | iPad | In white (notes convention): **MRS for perfect substitutes is always constant** |
| 30 | 16:20 | iPad | Parallel straight indifference curves redrawn to match |
| 31 | 17:00 | iPad | Closing statement; preview of consumer choice |
| 32 | 17:40 | iPad | Final frame |

---

## 3. Regenerated script

```markdown
# The Marginal Rate of Substitution

<!--cue:meaning-->
Pick a bundle — some amount of good one, some amount of good two. An
indifference curve runs through it. Now look at how steep that curve is right
there, because the steepness is telling you something about this consumer.
A steep curve means they would give up a lot of good two to get a little more of
good one: they value good one highly. A flat curve means the opposite. That
slope has a name — the marginal rate of substitution — and it is one of the most
informative numbers in consumer theory.

<!--cue:goal-->
So we want a way to compute it from any utility function. And it turns out to be
short: the MRS is minus the ratio of the two marginal utilities. Let me show you
where that comes from, because the derivation is three lines and it explains the
minus sign.

<!--cue:proof_setup-->
Start with the one thing that defines an indifference curve: along it, utility
does not change. So $u(x_1, x_2) = k$ for some constant $k$.

<!--cue:proof_differentiate-->
Now take the total differential of both sides. On the left, a small change in
$x_1$ contributes $\partial u / \partial x_1$ times $dx_1$, and a small change in
$x_2$ contributes $\partial u/\partial x_2$ times $dx_2$. On the right, we get
$dk$.

<!--cue:proof_zero-->
And here is the step that does all the work. $k$ is a *constant*. A constant
cannot change, so $dk = 0$. The total change in utility along the curve is zero
— which is just the definition of the curve, written in calculus.

<!--cue:proof_finish-->
Those two partial derivatives are things we already named last time: they are
$MU_1$ and $MU_2$. So the equation reads
$MU_1\,dx_1 + MU_2\,dx_2 = 0$. Divide through by $dx_1$, move terms across, and
you have it: $\dfrac{dx_2}{dx_1} = -\dfrac{MU_1}{MU_2}$. The minus sign was
never assumed — it fell out of requiring that utility stay constant.

<!--cue:example1-->
Let us use it. Take $u = x_1^2x_2$. The marginal utilities: $MU_1 = 2x_1x_2$,
and $MU_2 = x_1^2$. So the MRS is minus $2x_1x_2$ over $x_1^2$, and cancelling
one $x_1$ leaves $-\dfrac{2x_2}{x_1}$.

<!--cue:example2-->
Now a different function: $u = x_1\sqrt{x_2}$. Its marginal utilities look
nothing alike — $MU_1 = \sqrt{x_2}$, and $MU_2 = \tfrac{1}{2}x_1x_2^{-1/2}$.
Form the ratio, tidy up the exponents, and you get... $-\dfrac{2x_2}{x_1}$.

<!--cue:predict:why_same-->
<!--cue:why_same-->
The same answer. Two different-looking utility functions, identical MRS
everywhere. Before I explain it, see whether you can — you already have the
piece you need.
...Square the second function. $(x_1\sqrt{x_2})^2 = x_1^2x_2$, which is the
first one. So the second is an increasing transformation of the first, and we
established that increasing transformations represent the *same preferences*.
Same preferences means the same indifference map. The same map means the same
curves, with the same slopes at every point. And the slope is the MRS. So this
was never going to come out differently. It is not a coincidence; it is what the
uniqueness result guarantees.

<!--cue:example3-->
One more, and this one is perfect substitutes: $u = x_1 + 5x_2$. The marginal
utilities are constants — $MU_1 = 1$ and $MU_2 = 5$ — so the MRS is
$-\tfrac{1}{5}$. Notice what is *missing* from that answer: there is no $x_1$
and no $x_2$ in it.

<!--cue:substitutes_constant-->
Which means the MRS is the same at every bundle. This consumer will always
trade at one-to-five, whether they are holding almost nothing or a great deal.
And that generalizes: perfect substitutes always have constant MRS. In fact you
can turn it around and use it as the definition — perfect substitutes are
preferences whose rate of substitution does not depend on the bundle.

<!--cue:closing_loop-->
Check it against the picture from before. The indifference curves for perfect
substitutes were straight parallel lines. Parallel straight lines all have the
same slope, everywhere. Constant MRS. The geometry and the calculus were saying
one thing in two languages the whole time.

<!--cue:recap-->
To recap. The MRS is the slope of an indifference curve, and it measures how the
consumer values one good relative to the other. It equals minus the ratio of
marginal utilities, which follows from the fact that utility is constant along
the curve, so its total differential is zero. Utility functions that are
increasing transformations of each other give the same MRS, because they
describe the same preferences. And a constant MRS is the signature of perfect
substitutes.

<!--cue:forward-->
That closes preferences and utility. We now have two halves of the problem: the
budget constraint says what the consumer *can* afford, and preferences say what
they *want*. Next we put the wallet and the brain together, and ask what the
best affordable bundle actually is.
```

---

## 4. Flags for Kristian

- **Example 2 is the best-constructed moment in Modules 1-2.** You let the
  identical answer land as a surprise, then explain it with a result from four
  videos earlier. The regenerated script above keeps the surprise and adds an
  explicit prediction beat before the explanation.
- **Verbal slip at 14:21.** You say *"MU1, in this perfect complements
  preference, is very simple"* while working $u = x_1 + 5x_2$, which is perfect
  **substitutes** — and you use the correct term a minute later when
  generalizing. Worth a caption fix; students reading the transcript will hit
  the wrong word at the exact moment the result is being stated.
- **The alternative definition of perfect substitutes (constant MRS) deserves
  more room.** It arrives at 15:57 with about ninety seconds left. It is a
  genuinely different way into the concept than L5's "interchangeable goods"
  framing, and it connects the calculus to the geometry.
- **Your colour convention is load-bearing and undocumented.** At 15:07 you say
  you are switching to white "so we keep our convention of having white for notes
  and yellow for examples". That convention runs through the Module 1 iPad pages
  too. If tutorIA reproduces the handwritten style, this is worth encoding
  deliberately rather than rediscovering.
