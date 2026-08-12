# M1 · L4 — Taxes (and Gifts) in the Budget Constraint

| | |
|---|---|
| **Source** | YuJa `v=1348543` · Canvas module item 2032604 |
| **Runtime** | 20:07 (1207 s) |
| **Format** | Almost entirely iPad handwriting (yellow, green and white ink) |
| **Screens captured** | 26 settled states from 41 detected cuts |

---

## 1. Synthesis

The lecture that stops treating prices and income as given and starts asking
what *policy* does to the constraint. Three parts, of decreasing formality.

**Part 1 — Ad valorem taxes.** A tax charged as a percentage of value. He
anchors it in an arithmetic example before any algebra: a meal costs \$10,
the tax is 5%, so the after-tax payment is $10 \times (1 + 0.05) = 10.5$. That
generalizes to a per-unit after-tax price of $(1+t)p$, with the mapping spelled
out explicitly on screen — 10% means $t = 0.1$, 5% means $t = 0.05$. The
budget line then absorbs the tax as a modified price:

- only good 1 taxed: $p_1(1+t)x_1 + p_2x_2 = m$
- both goods taxed: $p_1(1+t)x_1 + p_2(1+t)x_2 = m$

Geometrically the punchline is that **a tax is just a price increase**. Taxing
one good pivots the constraint inward around the untaxed intercept; taxing both
at the same rate shifts it inward in a parallel manner, "because both intercepts
are changing by the same factor".

**Part 2 — In-kind gifts, worked in full.** The food stamp program, with
$m = 400$, $p_{\text{food}} = 1$, $p_{\text{goods}} = 1$, and a coupon worth
200 units of food that **cannot be sold**. This is the most carefully built
argument in Module 1, and he builds it point by point rather than asserting the
shape. Take point A = (200 food, 200 other goods), affordable before the
program. With a 200-unit food coupon you can now consume B = (400, 200): the
same bundle, displaced 200 units along the food axis. He then generalizes —
"the same logic applies literally to any point" — so the entire original line
translates rightward by 200, *except* that the vertical intercept cannot move,
because coupons buy food and nothing else. The result is the characteristic
**kinked** constraint: flat from (0, 400) to (200, 400), then sloping down to
(600, 0), with a visibly enlarged budget set.

**Part 3 — Three exercises left open, with hints.** Explicitly framed as
homework not to be turned in:

1. A food stamp that **can** be sold — hint given: it becomes equivalent to an
   increase in income.
2. A **bulk discount** — lower per-unit price above a threshold, so the line
   gets *flatter* past the kink.
3. A **discount on the first units** — cheaper early, normal price later, so the
   line starts flatter and becomes *steeper*.

He sketches the shape of (2) and (3) but leaves the algebra to the student.

**Observation.** Parts 1 and 2 are complete and self-contained. Part 3 is
scaffolding for work that never returns in these modules — if the regenerated
material is meant to stand alone, those three cases either need answers or need
to become explicit exercises with checkable solutions.

---

## 2. Screens

| # | Time | On screen |
|---|---|---|
| 1 | 00:30 | Title area, yellow ink: *Ad valorem taxes* |
| 2 | 01:00 | Meal example: *before tax \$10* / *tax 5%* / *after tax \$10.5* |
| 3 | 01:35 | Arithmetic written out: $10 \times (1 + 0.05) = 10.5$ |
| 4 | 02:10 | General form $(1+t)p$, with the mapping beside it: *if 10%, $t = 0.1$* · *if 5%, $t = 0.05$* |
| 5 | 02:50 | Blank page (transition) |
| 6 | 03:10 | Green ink: *if only $x_1$ is taxed* — **BL:** $p_1(1+t)x_1 + p_2x_2 = m$ |
| 7 | 03:40 | Added: *if both $x_1$ and $x_2$ are taxed* — **BL:** $p_1(1+t)x_1 + p_2(1+t)x_2 = m$ |
| 8 | 04:20 | Axes with original budget line; intercepts labelled $m/p_1$ and $m/p_2$ |
| 9 | 05:00 | Tax on good 1 only: new line pivoting inward from the unchanged vertical intercept |
| 10 | 05:40 | Both goods taxed: both intercepts pulled in, new line parallel and inside the original |
| 11 | 06:30 | New page: *Gifts* — the sellable / non-sellable distinction posed |
| 12 | 07:20 | *Example — Food stamp program*: $m = 400$, $p_f = 1$, $p_G = 1$ |
| 13 | 08:10 | Axes labelled **Goods** (vertical) and **Food** (horizontal), both intercepts at 400, original white line drawn |
| 14 | 08:50 | Written at right: **FSC = 200 / food** (food stamp coupon) |
| 15 | 09:40 | Point **A** marked on the original line at (200, 200) |
| 16 | 10:30 | Point **B: (400, 200)** marked, 200 units to the right of A |
| 17 | 11:50 | Green **new budget line** drawn: flat from (0,400) across to (200,400), then sloping down to (600,0) — the kink |
| 18 | 12:40 | Original budget set shaded for comparison |
| 19 | 13:20 | Enlarged budget set fully shaded in green, showing the added region |
| 20 | 14:20 | New page: exercise 1 — the *sellable* coupon, with the hint that it is equivalent to more income |
| 21 | 15:50 | Exercise 2 posed: lower price if you buy in bulk |
| 22 | 16:40 | Exercise 3 posed: lower price on the first units only |
| 23 | 17:40 | Sketch: *lower price if purchase in bulk* — line normal then **flatter** past the threshold |
| 24 | 18:30 | Threshold marked on the bulk-discount sketch |
| 25 | 19:10 | Sketch: *discount for the first 10 units* — **flatter** first, then steeper at the normal price |
| 26 | 19:50 | The 10-unit threshold marked; closing page |

---

## 3. Regenerated script

```markdown
# When Policy Moves the Line: Taxes and Gifts

<!--cue:advalorem-->
Everything so far took prices as given. Now let us change one on purpose. An ad
valorem tax is charged as a percentage of value, so start with a meal that
costs ten dollars and a tax of five percent. Five percent of ten is fifty
cents, so you hand over ten dollars fifty. Written as one step, that is ten
times one-point-zero-five.

<!--cue:tax_general-->
Generalize it and the after-tax price per unit is $(1+t)$ times $p$. Be careful
with $t$: a ten percent tax means $t = 0.1$, a five percent tax means
$t = 0.05$. It is the decimal, not the percentage.

<!--cue:tax_one_good-->
Now put that into the budget line. If only good one is taxed, the price it
faces is no longer $p_1$ but $p_1(1+t)$, so the constraint reads
$p_1(1+t)x_1 + p_2x_2 = m$. And notice what we have actually done — we have not
invented a new object. A tax on a good is a price increase on that good.

<!--cue:predict:tax_geometry-->
<!--cue:tax_one_pivot-->
So you already know what it does to the picture. Say it before I do. A higher
effective price on good one means the good-one intercept moves in, while the
good-two intercept — which contains no $p_1$ — cannot move at all. The line
pivots inward around the untaxed intercept, and the budget set shrinks.

<!--cue:tax_both-->
Tax both goods at the same rate and the constraint becomes
$p_1(1+t)x_1 + p_2(1+t)x_2 = m$. Now both intercepts shrink by the same factor,
so the line does not pivot — it shifts inward, parallel. Both prices rose
together, so the rate at which you trade one for the other never changed.

<!--cue:gift_setup-->
Now the other direction: someone gives you something. It matters enormously
whether you are allowed to sell the gift, so let us do the case where you
cannot. A food stamp program. Your income is four hundred dollars, food costs
one dollar a unit, other goods cost one dollar a unit. Both intercepts sit at
four hundred, and that is your line before the program.

<!--cue:gift_pointA-->
Now you receive a coupon worth two hundred units of food, and it cannot be sold
or converted to cash. Rather than guess the new shape, take one point. Say you
were consuming two hundred units of food and two hundred of other goods — call
it point A, and check that it costs exactly four hundred, so it was affordable.

<!--cue:gift_pointB-->
With the coupon, you can still buy that same bundle with your own money, and
then add two hundred units of food on top of it for free. So you can now reach
four hundred food and two hundred other goods. That is point B, and it is
exactly point A pushed two hundred units to the right.

<!--cue:gift_general-->
And nothing about A was special. Every bundle on the old line can be pushed two
hundred units along the food axis in exactly the same way. So the whole line
translates rightward — with one exception, and it is the important one.

<!--cue:predict:gift_kink-->
<!--cue:gift_kink-->
The exception is the top end. If you spend all four hundred dollars on other
goods, the coupon still cannot help you buy more of them, because it only buys
food. So the vertical intercept stays exactly at four hundred. What you get is a
line with a flat stretch: from zero to two hundred units of food you stay at
four hundred units of other goods, because that food is coming from the coupon
and costs you nothing. Past two hundred, you are paying for food yourself and
the line slopes down as before, out to six hundred. That corner is the kink, and
it is there precisely because the gift is in kind.

<!--cue:gift_set-->
Compare the two budget sets and you can see the whole effect of the program: a
band of new bundles has been added along the food dimension, and none has been
taken away.

<!--cue:checkpoint:cp1-->
Here is the one to sit with. If the coupon *could* be sold at face value, the
kink disappears and the line just shifts out in parallel. Why? What does being
able to sell it turn the gift into?

<!--cue:exercises-->
Two more shapes worth deriving yourself, because both come from the same trick
of asking what the price is over each stretch. First, a bulk discount: you pay
full price up to some threshold, then a lower price beyond it. Lower price
means flatter, so the line bends and gets flatter past the threshold. Second,
the reverse: a discount on the first few units only. Cheaper early, so the line
starts flatter and then steepens once the normal price kicks in.

<!--cue:recap-->
To recap. An ad valorem tax multiplies a price by $(1+t)$, so it is a price
increase in disguise: tax one good and the line pivots inward around the other
intercept, tax both equally and it shifts inward in parallel. An in-kind gift
you cannot sell translates the line along that good's axis but leaves the other
intercept fixed, which is what produces the kink. A gift you *can* sell is just
extra income, and the kink goes away.
```

---

## 4. Flags for Kristian

- **The food stamp derivation is the strongest teaching in Module 1.** You build
  the kink from a single point rather than asserting the shape, and you say out
  loud that the logic applies to any point. That construction is preserved above
  and is worth reusing as the template for other kinked-constraint cases.
- **Three exercises are set and never answered.** Sellable coupon, bulk
  discount, first-units discount. You give the shapes and a hint for the first,
  but no worked solution exists in Modules 1-2. If this material becomes
  standalone tutorIA content, these need either solutions or an explicit "answer
  in the next unit" pointer.
- **A number worth double-checking on screen 17.** With $m = 400$ and
  $p_f = 1$, the post-coupon horizontal intercept is 600 (400 bought plus 200
  free). The drawn line is consistent with that, and your narration at 11:58
  audibly self-corrects the placement of the endpoint mid-drawing.
- **Terminology drift.** The transcript has "value constraint" for "budget
  constraint" (00:48 in L3, and once here) — a caption-vendor mishearing, not
  something you said wrong. Worth a caption fix if these tracks are reused.
