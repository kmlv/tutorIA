# M2 · L1 — Preferences, Part 1

| | |
|---|---|
| **Source** | YuJa `v=1348880` |
| **Runtime** | 17:30 (1050 s) |
| **Format** | reveal.js deck (`S3_Preferences_Ch3`) + iPad handwriting + Desmos widget |
| **Screens captured** | 16 settled states from 22 detected cuts |

---

## 1. Synthesis

Where the course stops describing constraints and starts describing wants.
Kristian opens with the framing that preferences are "in a sense, consumers'
brains" — the whole apparatus of desires, intentions, and satisfaction — and
assumes the consumer knows how each option affects their well-being and can
pick the best available one.

**Three representations, in ascending order of usefulness.** He builds up to
utility rather than starting there:

1. **Arrows** over three fruits (apple, banana, mango). He shows several
   consumers with different arrow patterns, then the important one: a consumer
   who prefers apple ≻ banana, mango ≻ banana, but banana ≻ mango. That
   consumer has no single best option — **cyclic, intransitive, inconsistent**
   preferences. The failure case is introduced *before* the axiom that rules it
   out, which is the right order.
2. **Rank order** — banana first, mango third, apple fifth.
3. **Satisfaction levels** — banana 10, mango 8, apple 6. Flagged as the
   representation the course will actually use, later called utility.

**Notation.** Three symbols: strict preference $x \succ y$, weak preference
$x \succsim y$ ("at least as preferred as"), and indifference $x \sim y$.

**Three assumptions, each with a concrete test.**

- **Completeness** — the consumer can always answer a preference question.
  He anticipates the student objection ("that sounds very broad, I don't see how
  it could fail") and answers it with the burritos-versus-pizza case: replying
  *"I don't know"* — not "I'm indifferent" — is exactly what a violation looks
  like. That distinction between indifference and inability to answer is the
  sharpest point in the video.
- **Transitivity** — a consistency assumption, ruling out cycles. Worked by
  hand with x = iPhone, y = Samsung Galaxy, z = Nokia 900.
- **Monotonicity / more is better** — $(5.01, 20) \succ (5, 20)$, one hundredth
  of an ounce of coffee being enough. Then the part that earns its screen time:
  using a Desmos plot with points a–e, he asks three comparison questions and
  the third answer is **"we don't know."** Monotonicity ranks D vs C (more of
  both) and E vs C (more of one, same of the other), but says nothing about
  B vs C, where one good goes up and the other goes down. He states the
  limitation directly: "monotonicity does not solve all the ranking of
  preferences."

That last move — an assumption presented together with what it *cannot* do — is
the pedagogical spine of the video and is preserved in the rewrite below.

---

## 2. Screens

Slide text is exact, from `S3_Preferences_Ch3.md`.

| # | Time | Surface | On screen |
|---|---|---|---|
| 1 | 00:20 | Deck | **Preferences** — Intermediate Microeconomics (Econ 100A), UCSC |
| 2 | 00:40 | Deck | **Rationality in Economics - Behavioral Postulates** — the decision maker knows what they like and chooses their most preferred available alternative; to say anything about behavior we must model preferences |
| 3 | 01:20 | Deck | **Basics of Preferences Relations** — "John: apple better than Mango, apple better than banana, mango better than banana", with the arrow diagram `FruitPreferences1` |
| 4 | 02:10 | Deck | **Basics of Preferences Relations** — several named consumers (Alí, Bob, Carlos … John … Wei), `FruitPreferences2`; includes the cyclic consumer |
| 5 | 03:30 | Deck | **Basics of Preferences Relations** — preferences as a personal ranking, and as a personal assignment of satisfaction level (**utility**), `FruitPreferences3` |
| 6 | 04:40 | Deck | **Preference Relations** — the three symbols: strict $x \succ y$, weak $x \succsim y$, indifference $x \sim y$, each highlighted in turn as he names it |
| 7 | 06:20 | Deck | **Assumptions on Preference Relations (1): Completeness** — "For any two bundles x and y it is always possible to make the statement that either $x \succsim y$ or $y \succsim x$", second line boxed |
| 8 | 08:40 | Deck | **Assumptions on Preference Relations (2): Transitivity** — if x at least as preferred as y, and y at least as preferred as z, then x at least as preferred as z; "That is, if $x \succsim y$ and $y \succsim z$ implies $x \succsim z$" |
| 9 | 10:30 | iPad | Blank grid page (transition) |
| 10 | 11:10 | iPad | Handwritten: **2) transitivity** — $x$: iPhone · $y$: Samsung G · $z$: Nokia 900 |
| 11 | 11:50 | iPad | Added: $x \succsim y$ and $y \succsim z$ |
| 12 | 12:20 | iPad | Added: *so it must be that* |
| 13 | 12:50 | iPad | Completed: $x \succsim z$, and below it **transitivity holds** |
| 14 | 13:30 | Deck | **Assumption on Preferences (3): More is better (monotonicity)** — "All else the same, more of a 'good' commodity is better than less", with $(5.01, 20) \succ (5, 20)$ boxed, and an embedded Desmos plot: axes Good 1 / Good 2, a **green** quadrant (strictly better) and a **red** quadrant (strictly worse) anchored at a point, with labelled points a, b, c, d, e |
| 15 | 15:10 | Deck | Same widget, D vs C and E vs C being compared against the green region |
| 16 | 16:30 | Deck | Same widget, B vs C — the pair the green and red regions do **not** cover |

---

## 3. Regenerated script

```markdown
# Preferences: What the Consumer Wants

<!--cue:framing-->
Until now we have only described what a consumer *can* do — the budget set.
Nothing about what they would like to do. Preferences are how we model that. It
is a broad word, covering desires, intentions, and how satisfied a person ends
up. We make one working assumption: the consumer knows how each option would
affect their well-being, and can pick the best one available to them.

<!--cue:arrows-->
Start small. Three fruits: apple, banana, mango. One consumer says apple beats
banana, apple beats mango, and mango beats banana. Draw an arrow for each
comparison and you have described that person completely. Somebody else may
have arrows pointing the other way, and that is fine — different people,
different preferences.

<!--cue:predict:cycle-->
<!--cue:cycle-->
But now here is a consumer worth pausing on. Apple beats banana. Mango beats
banana. And banana beats mango. Try to name their favourite fruit. You cannot —
whichever one you pick, something beats it. The arrows go in a circle. We call
those preferences cyclic, or intransitive, and we will shortly assume them
away. Notice the order of events: we met the problem first, so the assumption
that follows has something to do.

<!--cue:representations-->
Arrows are not the only way. You could rank the options — banana first, mango
third, apple fifth. Or you could attach numbers to them: banana gets a ten,
mango an eight, apple a six. That last one is where this course is going. We
will call those numbers utility.

<!--cue:notation-->
Three symbols before we go further. $x \succ y$ means x is *strictly* more
preferred than y. $x \succsim y$, with the extra squiggle underneath, means x is
*at least as* preferred as y — that is the weak version, and it leaves room for
a tie. And $x \sim y$ means x and y are equally preferred: indifference.

<!--cue:completeness-->
Now three assumptions. The first is completeness: the consumer can always
answer a preference question. Do you prefer an iPhone or a Samsung Galaxy?
Apple or banana? Completeness says an answer always exists — either
$x \succsim y$, or $y \succsim x$, or the two are indifferent.

<!--cue:completeness_fail-->
Students usually push back here: that sounds so broad it could never fail. So
let me show you a failure. I ask whether you prefer two burritos or two slices
of pizza, and you say — *"I don't know."* Not "they're about the same." Not "I
lean pizza." Genuinely: I do not know how to answer that. If that is true, you
have violated completeness. Indifference is an answer; being unable to answer is
not. That is the whole distinction.

<!--cue:transitivity-->
Second: transitivity. This is the consistency assumption, and it is the one that
kills the cycle we saw. Take three options, $x$, $y$ and $z$. If $x \succsim y$,
and $y \succsim z$, then it must be that $x \succsim z$. Concretely: if you
weakly prefer the iPhone to the Samsung Galaxy, and the Samsung Galaxy to the
Nokia 900, then you must weakly prefer the iPhone to the Nokia 900. If that
holds for every triple, transitivity holds, and there is always a best option to
be found.

<!--cue:monotonicity-->
Third: monotonicity, or more simply, more is better. Hold everything else fixed
and give the consumer more of one good; that bundle is strictly preferred. And
"more" can be tiny — five ounces of coffee and twenty of juice, against
five-point-oh-one and twenty. That hundredth of an ounce is enough:
$(5.01, 20) \succ (5, 20)$.

<!--cue:predict:mono_compare-->
<!--cue:mono_works-->
Picture a bundle and put it at the centre. Everything up and to the right of it
has more of both goods, so all of that is strictly better — call it the green
region. Everything down and to the left has less of both, so it is strictly
worse — the red region. Bundle D is up and to the right of C, so D wins. Bundle
E has the same amount of good two as C but more of good one, so E wins too.

<!--cue:mono_limit-->
Now compare B and C, where B has more of one good and less of the other. What
does monotonicity say? Nothing. It has no answer. B is in neither the green
region nor the red one, and this assumption simply does not rank it. That is
worth stating plainly: more-is-better settles only the comparisons where one
bundle dominates the other. Every interesting trade-off is left open — and
filling that gap is what indifference curves are for.

<!--cue:recap-->
To recap. Preferences can be shown as arrows, as a ranking, or as satisfaction
numbers, and we will use the numbers. We write strict preference, weak
preference, and indifference with three different symbols. Completeness says an
answer always exists — "I don't know" is the violation, not "I'm indifferent."
Transitivity rules out cycles and guarantees a best option. And monotonicity
says more is better, but only ranks bundles where one has more of everything.
```

---

## 4. Flags for Kristian

- **The completeness counterexample is excellent and rare.** Most treatments
  state completeness and move on; you anticipate the objection and answer it
  with burritos-vs-pizza, distinguishing "I don't know" from indifference. Kept
  verbatim in spirit above.
- **Stating what monotonicity cannot do is the best beat in the video** and it
  motivates indifference curves for free. Preserved as `cue:mono_limit`.
- **One item on the deck is never covered in any Module 2 video:** the home
  exercise *"Can two distinct indifference curves cross each other?"* It sits in
  `S3_Preferences_Ch3.md` between the goods/bads/neutrals slide and convexity.
  Worth confirming whether it was covered in section rather than on video.
- **Reflexivity is commented out in the deck source** (`S3`, lines 74-78) and
  never mentioned aloud. Deliberate simplification, presumably — noting it so
  the regenerated material does not silently reintroduce it.
