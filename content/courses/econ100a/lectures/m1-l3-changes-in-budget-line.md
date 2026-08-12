# M1 · L3 — Changes in the Budget Line

| | |
|---|---|
| **Source** | YuJa `v=1348480` · Canvas module item 2032603 |
| **Runtime** | 12:43 (762 s) |
| **Format** | Three-way mix: iPad handwriting · reveal.js deck (`S2_Budget_Constraint_Ch2`) · live EconGraphs widget |
| **Notebook** | "Budget Constraints - part 2", dated Jun 14 2020 |
| **Screens captured** | 15 settled states from 18 detected cuts |

---

## 1. Synthesis

The comparative-statics lecture: the budget line is already built, now what
moves it. It is organized as one argument applied twice, then verified live.

**The argument.** Both intercepts are $m/p_1$ and $m/p_2$. Income sits in the
*numerator* of both; each price sits in the *denominator* of one. Every result
in the video is read off that fact rather than derived again:

- **Income rises.** $m$ is in both numerators, so both intercepts rise, so the
  line shifts out. Parallel, because the slope $-p_1/p_2$ contains no $m$ at
  all. Income falls: the same in reverse.
- **A price falls.** $p_1$ is in one denominator only. $m/p_1$ rises; $m/p_2$
  is untouched because $p_1$ does not appear in it. So the line *pivots* about
  the good-2 intercept rather than shifting.

**The verification.** He then opens an EconGraphs widget with live sliders for
$m$, $p_1$, $p_2$ and drags each one, reading the recomputed intercepts off the
axes as they move. This is the part a static rewrite would lose: the claim is
made on the iPad, then *demonstrated* on a control the student can also touch.

**One genuine teaching move worth keeping.** Before showing what a change in
$p_2$ does, he stops: *"Maybe pause the video and think about it."* He gives
the student the $p_1$ case, then asks them to derive the $p_2$ case themselves
by symmetry, and only then confirms it. That is a prediction prompt in the
tutorIA sense, already present in the original.

He closes by connecting the geometry to welfare — a bigger budget set means
more affordable bundles, so higher income is better for the consumer — while
explicitly flagging that preferences have not been introduced yet, so the
argument is deliberately informal.

---

## 2. Screens

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:26 | iPad | Notebook header *Budget Constraints - part 2 · Jun 14, 2020*. In blue: **Changes in income and prices** |
| 2 | 01:11 | iPad | Same title, settled |
| 3 | 01:20 | Deck | **Introducing EconGraphs** — "Budget Constraint" widget, $p_1x_1+p_2x_2=m$, sliders at $m=120$, $p_1=4.00$, $p_2=3.50$ |
| 4 | 01:23 | iPad | Empty axes: $x_2$ vertical, $x_1$ horizontal |
| 5 | 02:33 | iPad | Green budget line drawn; intercepts $m/p_2$ (vertical) and $m/p_1$ (horizontal) circled in orange highlighter; in green at top right: $m' > m$ |
| 6 | 03:30 | iPad | Second, outer line added with intercepts $m'/p_2$ and $m'/p_1$; green arrow pointing outward between the two lines |
| 7 | 03:36 | iPad | New page, orange title: **Changes in Prices** |
| 8 | 04:35 | iPad | Title + axes + one green line, intercepts $m/p_2$ and $m/p_1$; in green: $p_1' < p_1$ and $p_1 \downarrow$ |
| 9 | 05:27 | iPad | Pivot drawn: original line to $m/p_1$, new flatter line out to $m/p_1'$, both from the *same* vertical intercept $m/p_2$ |
| 10 | 05:46 | iPad | Same, with a curved green arrow marking the outward rotation |
| 11 | 06:51 | EconGraphs | Live widget, $m=96$, $p_1=4.25$, $p_2=3.25$ — sliders being dragged |
| 12 | 07:54 | EconGraphs | $m=116$ highlighted in yellow; recomputed intercepts highlighted: $m/p_2=36$, $m/p_1=27$ |
| 13 | 08:58 | Deck | **Income Increases** — three bullets: increases shift outward in a parallel manner, enlarging the budget set and improving choice; decreases shift inward, shrinking it; *"Which one is 'good' for consumer?"* |
| 14 | 10:41 | Deck | **$p_1$ increases** — four bullets: $p_1 \to p_1'$; constraint pivots, slope steepens from $-p_1/p_2$ to $-p_1'/p_2$; increasing one price pivots the constraint inward; some old choices are lost, so the consumer could be worse off |
| 15 | 12:40 | Deck | Final slide held to close |

**Note.** The handwritten pages carry the *derivation*; the deck slides carry
the *summary statements*; EconGraphs carries the *demonstration*. Screens 5-10
and 13-14 are the same two results told twice in different registers.

---

## 3. Regenerated script

```markdown
# What Moves the Budget Line

<!--cue:intercepts_recall-->
We already have the line. Two intercepts, and everything today comes from
looking at them closely. Spend everything on good one and you get $m/p_1$.
Spend everything on good two and you get $m/p_2$. Look at where each letter
sits: income is on top in both of them. Each price is on the bottom of exactly
one. Hold on to that, because it decides every result that follows.

<!--cue:predict:income_shift-->
<!--cue:income_up-->
Income rises from $m$ to $m'$. Income is in the numerator of both intercepts,
so both of them get bigger, and the line moves outward. But notice what did
*not* happen: it did not tilt. The slope is $-p_1/p_2$, and there is no $m$
anywhere in it. Prices did not change, so the rate at which the market lets you
trade one good for the other did not change either. The line shifts, parallel,
and your budget set gets strictly bigger.

<!--cue:income_down-->
Income falls, and the same sentence runs backwards: both intercepts shrink, the
line moves inward, still parallel, and the set of bundles you can reach gets
smaller.

<!--cue:price_down-->
Now change a price instead. Let the price of good one fall, from $p_1$ to a
smaller $p_1'$. A smaller denominator makes a bigger ratio, so the good-one
intercept $m/p_1$ moves out. And the other intercept? Look for $p_1$ in
$m/p_2$. It is not there. Neither your income nor the price of good two
changed, so that endpoint cannot move. One end fixed, the other end sliding
outward: the line does not shift, it pivots.

<!--cue:predict:p2_change-->
<!--cue:p2_change-->
Here is the one I want you to do yourself. You have just seen what a change in
the price of good one does — it swings the horizontal intercept. So pause, and
work out what a change in the price of good two does before I say it.
...It is the mirror image. $p_2$ sits under the *vertical* intercept, so that
is the end that moves. Raise $p_2$ and the vertical intercept drops; lower it
and the vertical intercept climbs. Same logic, flipped axis.

<!--cue:econgraphs_live-->
And you do not have to take any of this on faith. Take the three numbers —
income, the price of good one, the price of good two — and move them one at a
time. Push income up and watch both intercepts climb together while the tilt
stays exactly where it was. Push a single price and watch one end stay nailed
down while the other one swings.

<!--cue:checkpoint:cp1-->
Say it back before we finish, because this is the distinction that slips.
Income shifts; a price pivots. Why does the vertical intercept refuse to move
when the price that changed was $p_1$?

<!--cue:welfare-->
One last thing, and I will keep it informal because we have not met preferences
yet. When income goes up, the budget set gets bigger — every bundle you could
afford before, you can still afford, plus more. That is a safe thing to call
better for the consumer. Run it the other way: when a price rises, the line
pivots inward and some bundles that used to be available are gone. Choices were
lost, so the consumer can end up worse off. We will make that precise once we
can say what the consumer actually wants.

<!--cue:recap-->
To recap. Income lives in the numerator of both intercepts, so changing it
moves both and the line shifts, parallel, with the slope untouched. Each price
lives in the denominator of one intercept only, so changing it moves one end
and the line pivots around the other. Bigger budget set, more choices; smaller
budget set, choices lost.
```

---

## 4. Flags for Kristian

- **The best moment in the lecture is already yours.** *"Maybe pause the video
  and think about it"* at 08:44, before the $p_2$ case, is exactly the
  prediction beat tutorIA builds around. Preserved above as
  `cue:predict:p2_change`.
- **The EconGraphs segment does not survive a text rewrite.** Screens 11-12 are
  live slider manipulation; a regenerated script can describe it, but the
  pedagogical value is in the student moving the control. Worth deciding whether
  the tutorIA version reproduces the widget or drops the beat.
- **Two verbal slips in the captions.** At 06:20, "around 100 … I couldn't get
  it 100, but I get it 104" while the on-screen widget reads other values — he
  is narrating a slider he cannot land exactly, which is fine live but confusing
  in a transcript. At 07:57 "if we reduce the budget line, it would reduce price
  one" is a reversal of what he means (reduce $p_1$, the line rotates out).
- **Wording drift worth a decision.** He says the line "shifts rightwards"
  (02:23) and "rotates outwards" (05:34), while the deck says "shifts outward"
  and "pivots". tutorIA's existing `budget-line` pack standardizes on
  *shift* / *pivot*. The regenerated script above follows the pack.
