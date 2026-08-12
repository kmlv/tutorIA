# M1 · L2 — Consumption Bundles and the Budget Line

| | |
|---|---|
| **Source** | YuJa `v=1354922` · Canvas module item 2032602 |
| **Runtime** | 25:21 (1520 s) — the longest video in Modules 1-2 |
| **Format** | Alternating reveal.js deck (`S2_Budget_Constraint_Ch2`) and iPad handwriting |
| **Screens captured** | 41 settled states from 67 detected cuts |
| **Related** | This is the source lecture for the existing `content/packs/budget-line` pack |

---

## 1. Synthesis

The foundational lecture of the course. It moves in a deliberate order —
**define the objects, define affordability, find the boundary, draw it, then do
it with numbers** — and each step is stated on a slide and then worked by hand.

**Objects first.** The *consumption choice set* is everything a consumer could
conceivably consume, "regardless of their own budgetary and time constraints".
A *consumption bundle* is a vector of quantities, $(x_1, \ldots, x_n)$, and
prices are a matching vector $(p_1, \ldots, p_n)$. He grounds this immediately:
$x_1$ = coffee in ounces, $x_2$ = orange juice in ounces, and for the
three-good version, $x_3$ = pizza in slices. So $(5, 7)$ means five ounces of
coffee and seven of orange juice.

**Affordability as an inequality.** A bundle is affordable when total
expenditure does not exceed income: $p_1x_1 + \cdots + p_nx_n \leq m$. He then
tests it arithmetically twice with $p = (1, 0.5, 3)$ and $m = 10$:

- $(1,1,1)$ costs $1 + 0.5 + 3 = 4.5 \leq 10$ → **affordable**, "inside the budget constraint".
- $(5,7,4)$ costs $5 + 3.5 + 12 = 20.5 > 10$ → **not affordable**.

**The line as the equality case.** The pivotal sentence, and he repeats it
verbatim: *"there are bundles that are just affordable in the sense that if you
buy them, your income will be fully spent."* Those bundles satisfy
$p_1x_1 + p_2x_2 = m$ — the budget line. From here he restricts to two goods,
justified explicitly: the important points only need two, and two can be drawn.

**Geometry.** He introduces the *commodity space* as the two-dimensional plane
with $x_1$ and $x_2$ as axes, marks affordable and unaffordable points on it by
hand (green checks and red crosses), then derives the line properly. Set
$x_2 = 0$ to get the horizontal intercept $m/p_1$; set $x_1 = 0$ to get the
vertical intercept $m/p_2$. Then he solves the equation for $x_2$ to reach
slope-intercept form:

$$x_2 = \frac{m}{p_2} - \frac{p_1}{p_2}x_1$$

which names the vertical intercept and the slope $-p_1/p_2$, negative because
prices are positive. He then closes the loop that matters: the line *divides*
the commodity space into the affordable region — the **budget set** — and the
unreachable region outside.

**Extension and example.** A textbook figure shows three commodities, where the
budget line becomes a budget plane with intercepts $m/p_1$, $m/p_2$, $m/p_3$.
He ends with the worked case $m = 100$, $p_1 = 3$, $p_2 = 1$: intercepts
$100/3$ and $100$, slope $-3$.

**Structural observation.** Roughly the first eleven minutes are arithmetic on
bundles with no picture at all; the commodity space does not appear until about
13:30. The payoff — that the inequality is a *region* and the equality is its
*edge* — arrives late, and a rewrite can front-load the picture.

---

## 2. Screens

Deck slides (`S2_Budget_Constraint_Ch2`) alternate with iPad pages. Slide text
below is exact, taken from the deck source rather than read off the frame.

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:20 | Deck | **Budget Constraint** — Intermediate Microeconomics (Econ 100A), UCSC - 2020 |
| 2 | 00:40 | Deck | **Consumption Choice Sets** — "the collection of all consumption choices available to the consumer"; "What constrains consumption choice?" → "Budgetary, time and other resource limitations." |
| 3 | 01:10 | Deck | **Consumption bundle** — bundle of $x_1 \ldots x_n$ denoted by the vector $(x_1, x_2, \ldots, x_n)$ (boxed); prices denoted $p_1, p_2, \ldots, p_n$ |
| 4 | 01:50 | iPad | Handwritten: $\{x_1$: Coffee (oz), $x_2$: Orange Juice (oz)$\}$; below, the general form $(x_1, x_2)$; below that, the instance $(5, 7)$ |
| 5 | 03:20 | iPad | Three-good version added: $x_3$: Pizza (slices), with the bundle $(5, 7, 2)$ |
| 6 | 04:10 | Deck | **Affordable Bundles - Budget Constraints** — "when $p_1x_1 + \ldots + p_nx_n \leq m$", "where $m$ is the consumer's (disposable) income"; "all the bundles that when purchased do not exhaust the consumer's income" |
| 7 | 05:40 | iPad | *Example* table: $x_1$ Coffee $p_1 = 1$ · $x_2$ OJ $p_2 = 0.5$ · $x_3$ Pizza $p_3 = 3$ |
| 8 | 06:30 | iPad | Expenditure written out: $p_1x_1 + p_2x_2 + p_3x_3$, each term braced, whole thing braced and labelled **total Exp.**, with $\leq m$ |
| 9 | 08:00 | iPad | Test 1: $1(1) + 0.5(1) + 3(1) = 4.5$, income $= 10$ → affordable |
| 10 | 10:20 | iPad | Test 2: $1(5) + 0.5(7) + 3(4) = 5 + 3.5 + 12 = 20.5 > 10$ → not affordable |
| 11 | 11:30 | Deck | **"Budget line" or "budget constraint"** — the just-affordable bundles, expenditure exactly equal to income |
| 12 | 13:40 | iPad | Empty commodity space: $x_2$ / O.J. on the vertical axis, $x_1$ / Coffee on the horizontal |
| 13 | 14:20 | iPad | A red **✗** placed high in the space (an unaffordable bundle) |
| 14 | 14:50 | iPad | A green **✓** placed near the origin (an affordable bundle); more of each follow |
| 15 | 15:30 | Deck | **Budget Set** |
| 16 | 16:10 | iPad | Intercept derivation: set $x_2 = 0$ → $x_1 = m/p_1$; set $x_1 = 0$ → $x_2 = m/p_2$; both labelled *intercepts* |
| 17 | 18:00 | Deck | **Budget for Two Commodities** — $p_1x_1 + p_2x_2 = m$ (boxed), "Affordable set, intercepts, slope", with textbook Figure 2.1: shaded budget set, vertical intercept $= m/p_2$, budget line with slope $= -p_1/p_2$, horizontal intercept $= m/p_1$ |
| 18 | 19:00 | iPad | Slope-intercept derivation: from $m = p_1x_1 + p_2x_2$, an arrow down to $x_2 = \dfrac{m}{p_2} - \dfrac{p_1}{p_2}x_1$ |
| 19 | 20:40 | iPad | **The summary page.** Budget line drawn; $m/p_2$ and $m/p_1$ circled in yellow; *slope $= -p_1/p_2$* circled and arrowed to the line; the triangle hatched in green and labelled **Budget Set**, with green ✓ marks inside and red ✗ marks outside; **Budget line** labelled with an arrow to the hypotenuse |
| 20 | 22:30 | Deck | **Budget for Three Commodities** — 3-D figure, $p_1x_1 + p_2x_2 + p_3x_3 = m$, intercepts $m/p_1$, $m/p_2$, $m/p_3$ |
| 21 | 23:40 | iPad | *Example*: $m = 100$, $p_1 = 3$, $p_2 = 1$. Axes drawn; vertical intercept $\dfrac{m}{p_2} = \dfrac{100}{1}$; horizontal intercept $\dfrac{m}{p_1} = \dfrac{100}{3}$ |
| 22 | 25:00 | iPad | Line connecting the two intercepts; slope stated as $-p_1/p_2 = -3$ |

**Screen 19 is the keystone frame.** Everything the lecture builds — set,
boundary, intercepts, slope, and the affordable/unaffordable split — is on that
single page simultaneously. It arrives at roughly minute 21 of 25.

---

## 3. Regenerated script

The existing `content/packs/budget-line/script.en.md` already covers this
material and is *not* superseded by what follows. This version is written from
the video and is deliberately closer to Kristian's own sequencing: it keeps the
numeric affordability tests, which the pack drops, and it keeps his repeated
"just affordable" phrasing.

```markdown
# Bundles, Affordability, and the Budget Line

<!--cue:choice_set-->
Start with everything you could conceivably consume. Every combination, ignore
your wallet entirely for a moment — that whole collection is the consumption
choice set. Now put the wallet back. What stops you from reaching most of it is
not that you do not want those things; it is that budgets, time, and resources
are limited. Economics lives in that gap.

<!--cue:bundle-->
A single combination is a bundle, and we write it as a vector: how much of good
one, how much of good two, and so on. Let us make it concrete. Good one is
coffee, measured in ounces. Good two is orange juice, also in ounces. Then the
bundle $(5, 7)$ means five ounces of coffee and seven of orange juice. Add a
third good, pizza in slices, and $(5, 7, 2)$ means five, seven, and two slices.
Prices get their own vector: $p_1$, $p_2$, $p_3$.

<!--cue:affordable-->
Now, when can you actually buy a bundle? Multiply each quantity by its price,
add it all up, and compare it to your income. A bundle is affordable when
$p_1x_1 + p_2x_2 + \cdots + p_nx_n \leq m$. That sum on the left is your total
expenditure; $m$ is what you have to spend.

<!--cue:test_cheap-->
Let us test it, because the arithmetic makes it stick. Coffee costs one dollar
an ounce, juice fifty cents, a slice of pizza three dollars, and you have ten
dollars. Take the bundle one, one, one. That is one dollar, plus fifty cents,
plus three: four dollars fifty. Four fifty is less than ten, so you can afford
it — comfortably.

<!--cue:predict:test_expensive-->
<!--cue:test_expensive-->
Now try five ounces of coffee, seven of juice, four slices of pizza. Work it
out before I do. Five times one is five. Seven times fifty cents is three
fifty. Four slices at three dollars is twelve. Total: twenty dollars fifty.
Against an income of ten, that bundle is out of reach.

<!--cue:just_affordable-->
Between those two cases is the one that matters. There are bundles that are
*just* affordable — buy them and your income is exactly, completely spent.
Nothing left over, nothing short. For those bundles the inequality closes into
an equality: $p_1x_1 + p_2x_2 = m$. That is the budget line.

<!--cue:two_goods-->
From here we stay with two goods. Not because life has two goods, but because
every point worth making can be made with two, and two can be drawn.

<!--cue:commodity_space-->
So draw it. Coffee on the horizontal axis, orange juice on the vertical. Now
every bundle is a point in this plane, and the plane has a name: the commodity
space. Somewhere out here are bundles too expensive to reach. Down near the
origin are bundles you can easily afford. The question is where the border runs.

<!--cue:intercepts-->
Two points are easy, and they are the ends of the border. Spend everything on
coffee — that means zero juice — and the equation collapses to $p_1x_1 = m$, so
you get $m/p_1$ ounces of coffee. Spend everything on juice instead and you get
$m/p_2$. Those are the intercepts, and they are called that because they are
where the line meets the axes.

<!--cue:slope-->
For the whole line, solve the budget equation for $x_2$:
$x_2 = \dfrac{m}{p_2} - \dfrac{p_1}{p_2}x_1$. Now it is in the form you already
know. The vertical intercept is $m/p_2$, and the slope is $-p_1/p_2$ —
negative, necessarily, because both prices are positive. That slope is the
relative price: it says how much juice the market makes you give up to get one
more ounce of coffee.

<!--cue:predict:line_vs_set-->
<!--cue:budget_set-->
And here is the distinction to hold on to. The line is where income is exactly
spent. But everything *below* it — the whole triangle between the line and the
axes — is affordable too, because there the inequality holds strictly. That
region is the budget set. The line is not the set; the line is the set's edge.
Points outside the triangle are simply not reachable at these prices with this
income.

<!--cue:three_goods-->
It does generalize, by the way. With three goods the picture becomes
three-dimensional, the intercepts are $m/p_1$, $m/p_2$ and $m/p_3$, and the
boundary is no longer a line but a plane. The logic is unchanged; only the
drawing gets harder.

<!--cue:example-->
Let us finish with real numbers. Income is one hundred dollars, coffee costs
three, juice costs one. The juice intercept is one hundred over one, so one
hundred. The coffee intercept is one hundred over three, about thirty-three and
a third — deliberately not a round number, because you should be computing it,
not reading it off the picture. Connect those two points and the slope is minus
three: three ounces of juice per ounce of coffee.

<!--cue:recap-->
To recap. A bundle is a vector of quantities and a point in the commodity
space. It is affordable when total expenditure is at or below income. The
bundles that spend income exactly form the budget line, whose intercepts are
$m/p_1$ and $m/p_2$ and whose slope is $-p_1/p_2$, the relative price. The
region under that line is the budget set — and the line is its boundary, not
the set itself.
```

---

## 4. Flags for Kristian

- **Provenance correction for `content/packs/budget-line/pack.yaml`.** The
  header comment there says your original example used a different pair of goods
  and that you asked for coffee/orange juice as a substitute (2026-08-10). The
  video contradicts that: **coffee and orange juice are your own goods**, used
  throughout this lecture from 01:41 onward, and $m = 100$, $p_1 = 3$, $p_2 = 1$
  is your own worked example at 23:07. The pack currently under-attributes you.
  Someone should correct that note — I have not touched the pack, since it is
  outside this task's claim.
- **A slip in the worked example.** At 23:57 you say the horizontal intercept
  "is equal 200/3" while writing and saying $100/3$ either side of it. The
  written screen is correct; only the spoken number is wrong.
- **The picture arrives at minute 13.** Eleven minutes of vector and arithmetic
  work happen before the commodity space is drawn. The regenerated script above
  keeps your order, but this is the strongest candidate in Module 1 for
  resequencing if you want the geometry earlier.
- **The keystone screen (#19, ~20:40) is worth reproducing exactly.** Set,
  boundary, both intercepts, slope, and the ✓/✗ marks all coexist there. That
  single frame is a better summary than any of the deck slides.
