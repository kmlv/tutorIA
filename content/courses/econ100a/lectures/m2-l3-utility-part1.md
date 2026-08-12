# M2 · L3 — Utility, Part 1

| | |
|---|---|
| **Source** | YuJa `v=1348906` |
| **Runtime** | 21:52 (1312 s) — the longest video in Module 2 |
| **Format** | reveal.js deck (`S4_Utility_Ch4`) + iPad handwriting |
| **Screens captured** | 19 settled states from 31 detected cuts |

---

## 1. Synthesis

The translation lecture: everything said with $\succ$, $\succsim$ and $\sim$ gets
re-said with numbers, and the video's real job is to justify why that is
allowed and to fence off what the numbers do **not** mean.

**Continuity, lightly.** One more assumption is needed and he says explicitly he
will not do it rigorously: if $A \succ B$, then small enough changes to either
bundle preserve the ordering.

**Utility defined.** "Utility is nothing but what we also call a satisfaction
level" — how many utils a bundle delivers. A utility function extends this to
every option the consumer might face.

**The representation theorem, stated plainly.** If preferences satisfy
completeness, transitivity and continuity, they **can be represented by a
continuous utility function**. The payoff is practical and he says so: from
here on we can stop writing squiggly symbols and just use functions. The formal
correspondence is given as three biconditionals:

$$x' \succ x'' \iff u(x') > u(x'') \qquad x' \succsim x'' \iff u(x') \geq u(x'') \qquad x' \sim x'' \iff u(x') = u(x'')$$

**Utility is ordinal.** The most important warning in the video. If $u(x) = 6$
and $u(y) = 2$, you may conclude $x \succ y$ — and nothing more. You may **not**
say $x$ is three times as preferred. The numbers are subjective and
individually scaled: your top choice might be 10 and mine 100, and no
interpersonal comparison is available. Only the *ordering* carries meaning.

**Indifference curves are level curves.** A genuinely clarifying reframe: since
an indifference curve holds bundles of equal utility, it is a contour of the
utility function — exactly like altitude contours on a topographic map, where
the peak is in the middle and lower contours lie farther out. Higher
indifference curves are higher satisfaction the way outer contours are lower
ground. The first concrete function appears here, $u = x_1x_2$, with its convex
curves.

**Utility functions are not unique.** Even for a consumer with unique
preferences, the function representing them never is. He first defines an
*increasing function* on the iPad — flagged as a "memory bubble" — then states
the rule: $u$ and $v$ represent the same preferences if $v = f(u)$ for $f$
strictly increasing. Two worked checks with $u = x_1x_2$ and bundles
$(4,1)$, $(2,3)$, $(2,2)$:

| bundle | $u = x_1x_2$ | $v = u^2$ | ranking |
|---|---|---|---|
| $(2,3)$ | 6 | 36 | best |
| $(4,1)$ | 4 | 16 | tied |
| $(2,2)$ | 4 | 16 | tied |

The squaring changes every number and no comparison, because squaring is
strictly increasing on the positive region. Same again for $w = 2u + 10$.

---

## 2. Screens

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:15 | Deck | **Utility** — title slide |
| 2 | 00:45 | Deck | **One additional assumption on _preference relations_** — continuity |
| 3 | 01:40 | Deck | **Utility Function** — satisfaction level; how many utils a bundle gives |
| 4 | 03:30 | Deck | **Utility Function** — old notation vs new: iPhone 7 $\succ$ Galaxy 8 rewritten as $u(\text{iPhone 7}) > u(\text{Galaxy 8})$ |
| 5 | 04:40 | Deck | **Utility Function** — two-good version, beer and pizza: $(2,3) \succ (1,4)$ rewritten as $u(2,3) > u(1,4)$ |
| 6 | 05:40 | Deck | **Utility Function** — the representation result: completeness + transitivity + continuity ⟹ representable by a continuous utility function |
| 7 | 07:10 | Deck | The three biconditionals linking $\succ$ / $\succsim$ / $\sim$ to $>$ / $\geq$ / $=$ |
| 8 | 08:45 | Deck | Ordinality example: $u(x) = 6$, $u(y) = 2$ ⟹ $x \succ y$, and that is all it means |
| 9 | 11:00 | Deck | **Utility Functions & Indifference Curves** — an indifference curve is a set of equal-utility bundles, hence a level curve |
| 10 | 12:30 | Deck | Topographic-map analogy: altitude contours around a peak |
| 11 | 13:30 | Deck | **Utility Functions & Indiff. Curves - Example!** — $u = x_1x_2$ with two convex indifference curves |
| 12 | 14:30 | Deck | **Utility Functions & Indifference Curves** — indifference map: several curves together |
| 13 | 15:00 | Deck | **Utility functions (are not unique)** |
| 14 | 15:45 | iPad | Handwritten "memory bubble": $f(z)$ is **increasing** if a larger input always gives a larger output |
| 15 | 17:00 | iPad | The rule: $u$ and $v$ represent the same preferences if $v = f(u)$ with $f$ strictly increasing |
| 16 | 17:40 | Deck | **Example 1!** — $u = x_1x_2$ with bundles $(4,1)$, $(2,3)$, $(2,2)$; utilities 4, 6, 4 |
| 17 | 18:50 | Deck | **Example 1!** — $v = u^2 = x_1^2x_2^2$; utilities 16, 36, 16; ranking unchanged |
| 18 | 20:30 | Deck | Explanation: squaring is strictly increasing on the positive region, so order is preserved |
| 19 | 21:15 | Deck | **Example 2!** — $w = 2u + 10$, also an increasing transformation, same ranking again |

---

## 3. Regenerated script

```markdown
# Utility: Preferences as Numbers

<!--cue:continuity-->
We need one more assumption before utility works, and I will keep it informal.
Continuity says that if you strictly prefer bundle A to bundle B, then nudging
either bundle by a small enough amount will not flip that. Preferences do not
jump.

<!--cue:utility_def-->
With that, here is utility, and it is simpler than its reputation. A utility
level is a satisfaction level — how good a particular bundle feels to this
consumer. A utility function just does that for every bundle they might face.
Feed it a bundle, get a number back.

<!--cue:translation-->
So we can rewrite everything. Where we used to write that one phone is strictly
preferred to another, we now write that the utility of the first is greater than
the utility of the second. With two goods it is the same move: instead of saying
two beers and three slices is preferred to one beer and four slices, we write
$u(2,3) > u(1,4)$. Same claim, different alphabet.

<!--cue:representation-->
And you should ask why bother, since preference relations already worked. Here
is the reason. If a consumer's preferences satisfy completeness, transitivity
and continuity, then those preferences **can be represented by a continuous
utility function**. Not approximated — represented. Which means we can put the
squiggly symbols away and work with functions, and functions are things we can
differentiate, plot, and solve.

<!--cue:biconditionals-->
The link is exact in all three directions. Strict preference matches strictly
greater utility. Weak preference matches greater-than-or-equal. Indifference
matches equality. Every one of them holds in both directions, for every pair of
bundles.

<!--cue:predict:ordinal-->
<!--cue:ordinal-->
Now the warning, and it is the thing students get wrong. Suppose $u(x) = 6$ and
$u(y) = 2$. What can you conclude? Exactly one thing: $x$ is preferred to $y$.
You may **not** say $x$ is three times as good. That sentence has no meaning
here.

<!--cue:ordinal_why-->
Why not? Because these numbers are subjective and privately scaled. I might call
my favourite thing a 10; you might call yours a 100. Neither of us is wrong,
and no one can tell whether my 9 is your 9 or your 80. There is no
interpersonal comparison available, and even within one person the size of the
gap is not meaningful. That is what we mean when we call utility **ordinal**: it
carries real numbers, but only the *order* of those numbers says anything.

<!--cue:level_curves-->
Now connect this back to indifference curves, because it makes them much easier
to think about. An indifference curve holds bundles the consumer regards as
equal — which is to say, bundles with the *same utility number*. So an
indifference curve is a contour of the utility function.

<!--cue:map-->
You have seen this picture before, on a topographic map. Lines drawn around a
hill, each one joining points at the same altitude, the peak in the middle and
the lower contours farther out. Indifference curves are those lines, with
satisfaction in place of altitude. Curves farther from the origin are higher
ground.

<!--cue:first_function-->
Our first concrete utility function is about as simple as it gets: multiply the
two quantities together, $u = x_1x_2$. Its contours are the convex curves we
drew last time. Sketch two of them, or five if you need a fuller picture of the
preferences — a handful of curves together is an indifference map.

<!--cue:not_unique-->
One last idea, and it surprises people. Even for a consumer whose preferences
are entirely their own, the utility function representing them is *never*
unique. Many different functions describe the same person.

<!--cue:increasing-->
To see why, recall what an increasing function is: $f$ is increasing when a
larger input always produces a larger output. Nothing more. Now the rule: two
utility functions $u$ and $v$ represent the same preferences whenever you can
write $v = f(u)$ for some strictly increasing $f$.

<!--cue:example_square-->
Test it. Take $u = x_1x_2$ and three bundles: four-and-one, two-and-three, and
two-and-two. Their utilities are 4, 6 and 4 — so two-and-three wins, and the
other two are tied. Now square the whole function: $v = x_1^2x_2^2$. The
numbers become 16, 36 and 16. Every number changed. Did any comparison change?
No. Two-and-three still wins, the other two are still tied.

<!--cue:example_why-->
And that is not luck. Squaring is strictly increasing over the positive
quantities we are using, so it can stretch the numbers but never reorder them.
Try $w = 2u + 10$ and the same thing happens, for the same reason. Since only
the ordering ever meant anything, and the ordering is untouched, all three
functions describe the same consumer.

<!--cue:recap-->
To recap. Add continuity, and preferences that are complete and transitive can
be represented by a continuous utility function, with strict preference,
weak preference and indifference matching $>$, $\geq$ and $=$ exactly. Utility
is ordinal: the order means everything, the magnitudes and the gaps mean
nothing. Indifference curves are the level curves of the utility function, like
altitude contours. And any strictly increasing transformation of a utility
function represents exactly the same preferences.
```

---

## 4. Flags for Kristian

- **⚠️ A published caption states the opposite of what you teach.** At **09:27**
  the caption track reads: *"we know that because six is greater and two but we
  can say that X is three times as preferred as Y"*. Everything that follows —
  utility is subjective, no interpersonal comparison, utility is ordinal — makes
  clear you said **cannot**. The published caption asserts precisely the
  misconception the passage exists to prevent, and students who read captions
  will read the wrong claim. This is the single highest-value fix in Modules 1-2.
  The caption file is `content/courses/econ100a/captions/m2-l3-utility-part1.srt`.
- **The topographic-map analogy is the clearest thing in the lecture** and it is
  yours. Preserved as `cue:map`.
- **Slide text is stale in a way you noticed on camera.** At 03:58 you say *"I
  need to update this slides for newer versions, by the way"* about the iPhone 7
  / Galaxy 8 example. Still true in `S4_Utility_Ch4.md`. The regenerated script
  above drops the brand names entirely and uses the beer/pizza bundle instead,
  which does not age.
- **Minor arithmetic to verify on screen 17.** The transcript renders
  $u(2,3) = 36$ under $v = u^2$ as "3,6" — a caption formatting artefact, not an
  error on your part. The slide is correct.
