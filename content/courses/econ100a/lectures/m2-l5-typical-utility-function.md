# M2 · L5 — Typical Utility Functions

| | |
|---|---|
| **Source** | YuJa `v=1348955` |
| **Runtime** | 14:59 (899 s) |
| **Format** | reveal.js deck (`S4_Utility_Ch4`) + extended iPad derivation |
| **Screens captured** | 28 settled states from 38 detected cuts |

---

## 1. Synthesis

The catalogue lecture: three functional forms that recur for the rest of the
course, each introduced as *form → example → indifference map*. He warns at the
start to watch both "the mathematical as well as the conceptual features".

**Perfect substitutes — $u = \alpha x_1 + \beta x_2$, $\alpha, \beta > 0$.**
Simplest case $\alpha = \beta = 1$, giving $u = x_1 + x_2$. Running the L4
recipe at $u = 5$ and $u = 10$ produces **straight, downward-sloping**
indifference curves. The economic meaning is that the goods trade at a fixed
rate, so the curve never bends.

**Perfect complements — $u = \min\{x_1/\alpha,\; x_2/\beta\}$.** The centrepiece
of the video and by far the longest derivation, because the recipe does *not*
work here — he says so explicitly ("it is not as straightforward to draw
indifference curves as we did before") and builds the shape from first
principles instead. The construction:

1. Explain $\min$ concretely: $\min\{3,5\} = 3$.
2. Rewrite the function piecewise: $u = x_1$ when $x_1$ is the smaller,
   $u = x_2$ when $x_2$ is; ties assigned to the first branch.
3. **Split the commodity space** along the $45°$ line into the region where
   $x_1 < x_2$ and the region where $x_1 > x_2$.
4. In the region where $x_1$ is smaller, only $x_1$ determines utility — so
   changing $x_2$ does nothing and the indifference curve must be **vertical**.
   In the other region, symmetrically, it must be **horizontal**.
5. Join them: L-shaped curves with the corner on the $45°$ line.

He then *verifies* it numerically rather than asserting it. On the $u = 1$
curve: $A = (1,2)$, $B = (1,1)$, $C = (2,1)$, each with $\min = 1$. On the
$u = 3$ curve: $D = (3,3)$ and $F = (7,3)$, each with $\min = 3$ — the second
showing that four extra units of good 1 buy nothing at all.

**Cobb-Douglas — $u = x_1^a x_2^b$, $a, b > 0$.** Three instances:
$x_1^{1/2}x_2^{1/2}$, $x_1x_2^3$ ($a=1, b=3$), $x_1^2x_2^{0.75}$
($a=2, b=0.75$). The indifference map is characterized by contrast: *not*
L-shaped like complements, *not* straight like substitutes, but convex and
smoothly curved.

The three-way visual contrast at the end — straight, L-shaped, curved — is the
takeaway the whole video is built toward.

---

## 2. Screens

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:15 | Deck | **Typical utility fns: _perfect substitutes_** — a consumer who regards the goods as equivalent (or equivalent up to a fixed ratio); examples Coke/Pepsi, agave/sugar |
| 2 | 00:50 | Deck | General form $u = \alpha x_1 + \beta x_2$, $\alpha, \beta > 0$ |
| 3 | 01:30 | iPad | Simplest case written: $u = x_1 + x_2$ |
| 4 | 02:00 | iPad | Commodity space drawn; recipe steps applied |
| 5 | 02:40 | iPad | $u = 5$ → straight line indifference curve drawn |
| 6 | 03:10 | iPad | $u = 10$ → second parallel straight line, farther out |
| 7 | 03:40 | iPad | Both labelled; noted as **linear and downward sloped** |
| 8 | 04:10 | Deck | **Typical utility fns: _perfect complements_** — consumer uses the goods in fixed proportion; only the number of pairs matters |
| 9 | 04:40 | Deck | The $\min$ form, with $\min\{3,5\} = 3$ explained |
| 10 | 05:10 | iPad | Written: **Perfect complements**, $u = \min\{x_1/\alpha,\; x_2/\beta\}$, $\alpha, \beta > 1$ |
| 11 | 05:50 | iPad | Working example simplified to $u = \min\{x_1, x_2\}$ |
| 12 | 06:40 | iPad | Piecewise rewrite: $u = x_1$ if $x_1$ is the min; $u = x_2$ if $x_2$ is |
| 13 | 07:30 | iPad | Commodity space drawn with the $45°$ line |
| 14 | 08:15 | iPad | Space split: region $x_1 > x_2$ and region $x_1 \leq x_2$ labelled |
| 15 | 09:00 | iPad | Vertical segments drawn where $x_1$ is the binding good |
| 16 | 09:40 | iPad | Horizontal segments drawn in the other region → L-shapes complete |
| 17 | 10:10 | iPad | $IC_{u=1}$ and $IC_{u=3}$ labelled |
| 18 | 10:40 | iPad | Points **A** $(1,2)$, **B** $(1,1)$, **C** $(2,1)$ marked on $u = 1$ |
| 19 | 11:20 | iPad | Utility of each verified: $\min$ equals 1 in all three cases |
| 20 | 12:00 | iPad | Point **D** $(3,3)$ marked on $u = 3$ |
| 21 | 12:30 | iPad | Point **F** $(7,3)$ marked — still $u = 3$ |
| 22 | 13:00 | Deck | **Typical utility fns: Cobb-Douglas** — $u = x_1^ax_2^b$, $a, b > 0$ |
| 23 | 13:30 | Deck | Three examples: $x_1^{1/2}x_2^{1/2}$ · $x_1x_2^3$ · $x_1^2x_2^{0.75}$ |
| 24 | 14:10 | Deck | Cobb-Douglas indifference map — convex, smoothly curved |
| 25 | 14:40 | Deck | Contrast stated: not L-shaped, not linear |
| 26-28 | 14:50 | Deck | Closing frames |

---

## 3. Regenerated script

```markdown
# Three Utility Functions You Will Meet Everywhere

<!--cue:substitutes-->
Some goods are, to a particular consumer, simply interchangeable. If you like
Coke and Pepsi exactly the same, all that matters is how many bottles you have
in total — not which label is on them. We call those perfect substitutes, and
they are written $u = \alpha x_1 + \beta x_2$, with both coefficients positive.
Take the simplest case, both equal to one: $u = x_1 + x_2$.

<!--cue:substitutes_draw-->
Run the recipe on it. Set $u = 5$: that is $x_1 + x_2 = 5$, which rearranges to
$x_2 = 5 - x_1$ — a straight line. Set $u = 10$ and you get another straight
line, parallel, farther out. That is the signature of perfect substitutes:
indifference curves that are **straight and downward sloping**, never bending,
because the rate at which you will swap one for the other never changes.

<!--cue:complements-->
Now the opposite temperament. Some goods are only useful together, in a fixed
proportion — think of things that come in pairs. What matters is how many
complete pairs you have. We write that with a minimum function:
$u = \min\{x_1, x_2\}$ in the simplest case. And the min function is exactly
what it sounds like: the minimum of three and five is three.

<!--cue:complements_pieces-->
The recipe from last time will not get us there, so let us build the shape
instead. Read the function piecewise. If $x_1$ is the smaller of the two, then
utility equals $x_1$. If $x_2$ is smaller, utility equals $x_2$.

<!--cue:complements_split-->
So split the commodity space in two along the forty-five degree line. Below it,
$x_1$ is the smaller number. Above it, $x_2$ is.

<!--cue:predict:complement_shape-->
<!--cue:complements_shape-->
Take the region where $x_1$ is smaller. There, utility is $x_1$ and $x_2$ does
not appear at all — so adding more of good two changes nothing. If moving up
does not change utility, then moving up keeps you on the same indifference
curve, which means the curve is **vertical** there. Now the other region, by the
identical argument with the goods swapped: the curve is **horizontal**. Put the
two pieces together and you get an L, with its corner sitting on the
forty-five degree line.

<!--cue:complements_check-->
Let us check it with numbers rather than trust the picture. Take three bundles:
one-and-two, one-and-one, and two-and-one. The minimum of one and two is one.
The minimum of one and one is one. The minimum of two and one is one. All three
give utility one, so all three sit on the same indifference curve — and if you
plot them, they trace an L.

<!--cue:complements_waste-->
Here is the one that makes the point stick. Compare three-and-three with
seven-and-three. The first has utility three. The second? Still three, because
the minimum is still three. You added four whole units of good one and the
consumer is no better off at all. With perfect complements, anything beyond the
matching pair is wasted.

<!--cue:cobbdouglas-->
The third form sits between those extremes, and it is the one we will use most:
Cobb-Douglas, $u = x_1^a x_2^b$ with both exponents positive. Many functions
qualify — $x_1^{1/2}x_2^{1/2}$, or $x_1x_2^3$, or $x_1^2x_2^{0.75}$. They all
share a shape.

<!--cue:contrast-->
And the easiest way to know that shape is by what it is not. It is not L-shaped,
so the goods are not all-or-nothing — extra good one does buy you something. It
is not a straight line, so the trade is not at a fixed rate. It is convex and
smoothly curved: the more of good one you already have, the less good two you
are willing to give up for another unit of it. That bend is the interesting
case, and it is why Cobb-Douglas earns its keep.

<!--cue:recap-->
To recap. Perfect substitutes, $\alpha x_1 + \beta x_2$, give straight
downward-sloping curves — a fixed trade rate. Perfect complements,
$\min\{x_1,x_2\}$, give L-shaped curves with corners on the forty-five degree
line, and anything past the matching pair is wasted. Cobb-Douglas,
$x_1^ax_2^b$, gives smooth convex curves between the two extremes. Learn the
three shapes and you can read a consumer's temperament off a graph.
```

---

## 4. Flags for Kristian

- **The perfect-complements derivation is the strongest piece of teaching in
  Module 2.** You explicitly say the standard recipe will not work, then build
  the L-shape from the piecewise definition by splitting the space — and then
  verify it with five labelled bundles instead of asserting it. It is preserved
  in full above.
- **Point F $(7,3)$ is doing more work than it is credited with.** It is the
  bundle that shows the wasted units, and in the original it goes by in about
  fifteen seconds. Promoted to its own beat (`cue:complements_waste`).
- **Parameter restriction to check.** On screen 10 the general complements form
  is given with $\alpha, \beta > 1$; the deck source says the goods are consumed
  in fixed proportion without that bound, and $\alpha, \beta > 0$ is the usual
  condition. Worth confirming which you intend.
- **Notation drift between videos.** Cobb-Douglas exponents are $a$ and $b$
  here, while perfect substitutes use $\alpha$ and $\beta$, and at 13:50 you
  start to say "alpha" before correcting to "A". Minor, but a regenerated pack
  should pick one convention.
