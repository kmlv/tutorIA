# M2 · L4 — Utility, Part 2: Drawing Indifference Curves

| | |
|---|---|
| **Source** | YuJa `v=1348928` |
| **Runtime** | 12:45 (765 s) |
| **Format** | reveal.js deck (`S4_Utility_Ch4`) + iPad handwriting + live Desmos |
| **Screens captured** | 19 settled states from 28 detected cuts |

---

## 1. Synthesis

The procedural lecture of Module 2 — the one that hands the student an
algorithm and then runs it twice. Two short conceptual items, then method.

**Goods, bads and neutrals in utility language.** A restatement, deliberately:
a **good** raises utility when consumption rises, a **bad** lowers it, a
**neutral** leaves it unchanged. The same three categories from L2, now phrased
as the sign of the effect on $u$ rather than as a direction of preference. He
also sets an ungraded exercise here and unusually adds *"if you don't get it,
please feel free to contact the instructor, or your TA"*.

**The four-step recipe.** Stated cleanly and then obeyed:

1. Identify the utility function.
2. Set it equal to a constant $K$ — because along an indifference curve utility
   is constant.
3. Solve for $x_2$ in terms of $K$ and $x_1$.
4. Pick a value for $K$ and draw. Repeat with other values of $K$ for more
   curves.

**Example 1 — $u = x_1^{1/2}x_2$** *(written as $\sqrt{x_1}\,x_2$)*. Setting
$u = K$ and solving gives $x_2 = K/\sqrt{x_1}$. At $K = 5$, $x_2 = 5/\sqrt{x_1}$;
at $K = 10$, $x_2 = 10/\sqrt{x_1}$. He introduces the labelling convention
$IC_{u=5}$, $IC_{u=10}$, and observes that the higher curve sits farther from
the origin — as monotonicity requires.

**Desmos as a required tool.** A genuine aside: he recommends desmos.com,
notes it is free, and says the figures in the online notes were made with it and
students can go look at how. This is a workflow instruction, not content.

**Example 2 — $u = (x_1 + x_2)^{1/2}$**, and this is where the lecture earns
its keep. Set $u = K = 5$, so $\sqrt{x_1 + x_2} = 5$. Subtract, square, and you
get $x_2 = (5 - x_1)^2$. But he stops mid-derivation, goes back, and corrects
himself on camera: squaring is only legitimate once you restrict to
$5 - x_1 \geq 0$, because $x_2$ cannot be negative. So the curve is valid only
for $x_1 \in [0, 5]$. **The self-correction is the most valuable thirty seconds
in the video** — the domain restriction is exactly what students drop, and here
it is caught live rather than presented as a finished fact.

---

## 2. Screens

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:10 | Deck | **Goods, Bads and Neutrals** — in utility terms: consumption up ⟹ utility up (good), down (bad), unchanged (neutral) |
| 2 | 01:00 | Deck | Ungraded home exercise, with the offer to contact instructor or TA |
| 3 | 01:40 | Deck | **Drawing an Indifference Curve** — the four steps: identify $u$; set $u = K$; solve for $x_2$; choose $K$ and draw |
| 4 | 03:20 | iPad | *Example.* Step 1: $u = \sqrt{x_1}\,x_2$ (with the equivalent exponent form noted) |
| 5 | 04:10 | iPad | Step 2: $u = K$ |
| 6 | 04:50 | iPad | Step 3: solve for $x_2$ → $x_2 = \dfrac{K}{\sqrt{x_1}}$ |
| 7 | 05:20 | iPad | Step 4: $K = 5$ → $x_2 = \dfrac{5}{\sqrt{x_1}}$ |
| 8 | 05:50 | iPad | The curve for $u = 5$ sketched by hand |
| 9 | 06:25 | iPad | Second curve: $K = 10$ → $x_2 = \dfrac{10}{\sqrt{x_1}}$, drawn farther out |
| 10 | 07:00 | iPad | Labelling convention written: $IC_{u=10}$ and $IC_{u=5}$ |
| 11 | 07:20 | Desmos | Live desmos.com session, axes $x$ and $y$, the $u = 5$ curve plotted |
| 12 | 08:10 | Desmos | The $u = 10$ curve added; the higher curve visibly farther from the origin |
| 13 | 08:55 | Desmos | Note that figures in the online notes were built in Desmos |
| 14 | 09:20 | iPad | *Example 2.* Step 1: $u = \sqrt{x_1 + x_2}$ |
| 15 | 09:50 | iPad | Step 2: set $u = K$; Step 3: $K = 5$ |
| 16 | 10:30 | iPad | Solving: subtract $x_1$, then square → $x_2 = (5 - x_1)^2$ |
| 17 | 11:15 | iPad | **Correction added**: $x_2 \geq 0$, so $(5 - x_1)$ must be non-negative before squaring |
| 18 | 12:00 | iPad | Domain written in: $x_1 \in [0, 5]$, with $x_2 = (5 - x_1)^2$ on that interval |
| 19 | 12:20 | Desmos | The restricted curve plotted |

---

## 3. Regenerated script

```markdown
# Drawing an Indifference Curve

<!--cue:goods_utility-->
We met goods, bads and neutrals before, in the language of preference. In
utility language they are even easier to state. A commodity is a **good** if
consuming more of it raises your utility. It is a **bad** if consuming more
lowers it. And it is **neutral** if consuming more changes nothing at all. Same
three ideas, now as the sign of an effect.

<!--cue:recipe-->
Now the practical skill: given a utility function, draw its indifference
curves. There is a recipe, and it is four steps.

One: identify the utility function you are working with. Two: set it equal to a
constant — call it $K$. That step is the whole idea, because along an
indifference curve utility does not change, so it equals *some* fixed number.
Three: solve for $x_2$ in terms of $K$ and $x_1$, which puts it in a form you
can plot. Four: choose a value for $K$ and draw the curve. Want more curves?
Choose another $K$.

<!--cue:example1-->
Let us run it. Take $u = \sqrt{x_1}\,x_2$. That is step one done. Step two: set
it equal to $K$, so $\sqrt{x_1}\,x_2 = K$. Step three: divide both sides by
$\sqrt{x_1}$ and you get $x_2 = K/\sqrt{x_1}$.

<!--cue:example1_draw-->
Step four. Let $K = 5$, so $x_2 = 5/\sqrt{x_1}$ — a curve falling away from the
vertical axis and flattening as $x_1$ grows. Now take $K = 10$:
$x_2 = 10/\sqrt{x_1}$, the same shape, sitting farther out.

<!--cue:predict:which_higher-->
<!--cue:ic_labels-->
Which of those two curves does the consumer prefer to be on? The $K = 10$ one,
and notice it is the one farther from the origin — exactly what more-is-better
requires. Higher utility, farther out. It is worth labelling them so you never
lose track: $IC_{u=5}$ and $IC_{u=10}$.

<!--cue:example2-->
Now a second function, because it hides something. Take
$u = \sqrt{x_1 + x_2}$. Step two, set it to $K = 5$: $\sqrt{x_1 + x_2} = 5$.
Step three, solve for $x_2$. Subtract $x_1$ from both sides — careful, from
inside the root first: $\sqrt{x_1+x_2} = 5$ gives $x_1 + x_2 = 25$... but let us
do it the way it usually goes wrong, squaring at the end, so you can see the
trap.

<!--cue:trap-->
Suppose you write $\sqrt{x_1 + x_2} = 5$, move things around, and square to get
$x_2 = (5 - x_1)^2$. Before you plot that, stop and ask what $x_2$ is allowed to
be. It is a quantity of a good, so it cannot be negative — and squaring hides
that, because squaring turns a negative into a positive and cheerfully hands you
a curve that means nothing.

<!--cue:domain-->
So the restriction has to be imposed *before* you square: $5 - x_1$ must be zero
or positive, which means $x_1$ runs from zero to five and no further. Plot
$x_2 = (5 - x_1)^2$ on that interval only. This is the step that gets dropped,
and dropping it produces indifference curves in regions where the consumer
cannot be.

<!--cue:tool-->
One practical note. Get comfortable with a graphing tool — Desmos is free and
does this well. Type the function, watch the curve, change $K$ and watch it
move. Building the intuition for which way a curve bends is much faster when you
can see twenty of them in a minute.

<!--cue:recap-->
To recap. To draw an indifference curve: identify the utility function, set it
equal to a constant $K$, solve for $x_2$, then pick values of $K$ and plot.
Larger $K$ gives curves farther from the origin. And whenever solving involves
squaring, work out the domain first — quantities cannot be negative, and the
algebra will not remind you.
```

---

## 4. Flags for Kristian

- **The on-camera self-correction at 11:15 is the best moment in this video.**
  You catch the missing domain restriction mid-derivation rather than presenting
  a clean finished result. That is worth keeping deliberately rather than
  polishing away — the regenerated script above stages it as a trap the student
  walks into first.
- **One thing to check in Example 2.** Solving $\sqrt{x_1 + x_2} = 5$ directly
  gives $x_1 + x_2 = 25$, i.e. $x_2 = 25 - x_1$ — a straight line. The video
  instead arrives at $x_2 = (5 - x_1)^2$, which corresponds to
  $\sqrt{x_1} + \sqrt{x_2} = 5$, a different function. The deck source
  (`S4_Utility_Ch4.md`, "Drawing an Indifference Curve - Example!") should settle
  which was intended. **I have not resolved this and it needs your eye** — the
  domain lesson is correct and valuable either way, but the function it is
  attached to may be mislabelled. My regenerated script deliberately keeps the
  domain point and stays vague about which of the two functions produced it;
  that is a placeholder, not a fix.
- **Desmos is presented as a required tool** (07:19) and the notes' figures are
  said to be built in it. If tutorIA reproduces this material, that dependency is
  worth an explicit decision rather than inheriting it by accident.
