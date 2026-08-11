# A chatbot is not a tutor

Talk source. 15 minutes. Audience: teaching colleagues and people who decide what
software enters a course.

Format: one `## SLIDE` block per slide. The `<!--visual ... -->` comment holds the slide
HTML; everything else in the block is the narration, spoken in order. `build_deck.py`
turns this file into `deck.html` plus the narration file fed to `audioexplain`.

**Provenance of every number on these slides.** The source is
`docs/sources/IA_generativa_aprendizaje_informe_completo.pdf`, which Kristian produced in
a ChatGPT conversation. Because it came from a language model, none of it went on a slide
until it was checked against primary sources:

- Bastani et al., Tutor CoPilot, Eedi/LearnLM and the Khan A/B results were verified in
  task T-002 — see `coord/work/claude/T-002-carril-C-tutores-llm-juez.md`.
- The meta-analysis, the GenAI-vs-adaptive differential, Kestin, Nigeria, Sierra Leone,
  Mindspark, Robinson, Rori and ASSISTments were verified by `fable` in task T-006 — see
  `coord/work/fable/T-006-verificacion-cifras.md`, which carries the page-level URL for
  each one.

Three of fable's findings are already applied here: Nigeria's English effect is 0.23 SD
(not 0.24, which is why the talk quotes only the 0.31 composite); Robinson's usage figure
is "1 to 4 minutes", not 4.4; and Sierra Leone's 0.380 ToT is not quoted at all, only the
0.258 ITT. Do not add a number to a slide without adding it to one of those two files
first.

---

## SLIDE 1 — Title

<!--visual
<div class="title-slide">
  <h1>A chatbot is not a tutor</h1>
  <p class="sub">What the evidence says about AI and learning — and what to ask for
  before one enters your course</p>
  <p class="meta">Evidence cutoff: August 2026</p>
</div>
-->

I want to start with an experiment that should make all of us a little uncomfortable.

Then I will give you the honest number for whether any of this works.

And I will finish with the questions I would ask before letting one of these tools near
my students.

## SLIDE 1b — Where this comes from

<!--visual
<h2>Where this talk comes from</h2>
<div class="pipeline">
  <div class="step"><b>1 · Draft</b><span>A research report I generated in a
    conversation with a language model</span></div>
  <div class="step"><b>2 · Check</b><span>9 headline figures re-checked against the
    original papers &nbsp;·&nbsp; <b>8 held, 1 was wrong</b></span></div>
  <div class="step"><b>3 · Map</b><span>An earlier review of this literature from three
    angles: tutoring systems, interfaces and authoring, deployed LLM tutors</span></div>
  <div class="step"><b>4 · This talk</b><span>Every slide labels which of the three it
    is showing you</span></div>
</div>
<p class="note">Every claim on these slides carries one of four labels:</p>
<div class="eyebrow-row">
  <span class="prov prov-e">Evidence <span class="src">· author, year</span></span>
  <span class="prov prov-s">Our synthesis <span class="src">· based on A + B</span></span>
  <span class="prov prov-r">Our recommendation</span>
  <span class="prov prov-p">Our project <span class="src">· not yet evaluated</span></span>
</div>
<div class="provbar"><b>Taxonomy:</b> <span class="chain">designed by codex ·
provenance audit of all slides in coord/work/codex/T-006-procedencia.md</span></div>
-->

Before any of the evidence, thirty seconds on where this talk comes from, because you
should be able to tell my sources apart from my opinions.

It started as a research report I generated in a conversation with a language model.

That is a perfectly good way to start and a terrible way to finish, so nothing from it
went onto a slide until it had been checked against the original paper.

Nine headline figures were re-checked that way. Eight held.

One was wrong, and I will show you that one later, because correcting it turned out to
make the argument better rather than weaker.

Underneath that sits an earlier review of this same literature from three separate
angles: the intelligent tutoring tradition, the interface and authoring side, and the
language-model tutors that are actually deployed today.

So from here on, every claim on these slides carries one of four labels.

Evidence, with the author and the year, means somebody measured it.

Our synthesis means we built the conclusion by comparing sources. The citation proves the
inputs, not the conclusion.

Our recommendation means it is a judgement about what you should do, and no experiment
established it.

And our project means it is a fact about the thing we are building, which is not the same
as a result.

The middle two are the ones you should argue with, and I have tried to make them easy to
find rather than easy to miss.

## SLIDE 2 — The experiment

<!--visual
<h2>One experiment, three groups</h2>
<div class="arms">
  <div class="arm"><span class="arm-n">1</span><b>Unrestricted chat</b>
    <span>practice with a standard assistant</span></div>
  <div class="arm"><span class="arm-n">2</span><b>Tutored version</b>
    <span>same model, safeguards: hints, never the answer</span></div>
  <div class="arm"><span class="arm-n">3</span><b>Control</b>
    <span>practice with no technology</span></div>
</div>
<p class="note">≈1,000 high-school mathematics students, randomly assigned.
Practice <b>with</b> the tool. Then the tool is removed and everyone sits the same exam.</p>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Bastani et al. 2025, PNAS</span></span> <span class="chain">Primary source → researched in T-002 (claude) → cited here</span></div>
-->

Nearly a thousand high school mathematics students were randomly assigned to three
groups.

The first group practised with an ordinary chat assistant, with no restrictions.

The second group practised with the same underlying model, but wrapped in safeguards.
It was built to give hints and withhold the answer.

The third group practised the way students have always practised, with no technology at
all.

Then the researchers took the assistance away, and gave all three groups the same exam.

Hold on to that last step, because it is the entire design. The measurement happens
after the help is gone.

## SLIDE 3 — The result

<!--visual
<h2>What happened</h2>
<table class="results">
  <tr><th></th><th>During practice<br><span>with the tool</span></th>
      <th>On the exam<br><span>without it</span></th></tr>
  <tr><td><b>Unrestricted chat</b></td>
      <td class="up">+48%</td><td class="down">−17%</td></tr>
  <tr><td><b>Tutored, with safeguards</b></td>
      <td class="up">+127%</td><td class="flat">≈ control</td></tr>
</table>
<p class="note">Both relative to the control group. Safeguards removed the harm.
They did not produce an advantage.</p>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Bastani et al. 2025, PNAS</span></span> <span class="chain">Primary source → verified in T-002 (claude)</span></div>
-->

During the practice sessions, the unrestricted group performed forty-eight per cent
better than the control group.

On the exam, without the tool, the same students performed seventeen per cent worse than
the control group.

Now look at the tutored version, the one built carefully, with safeguards.

During practice it did even better. A hundred and twenty-seven per cent above control.

And on the exam it came out level with the control group. No better, no worse.

So the careful design succeeded at something real. It removed the damage. What it did
not do was produce any measurable learning advantage of its own.

## SLIDE 4 — The lesson

<!--visual
<div class="big-idea">
  <p class="kicker">The lesson</p>
  <h2>Performance <em>with</em> the tool is not learning.</h2>
  <p class="sub">The number that looked most like success was the number that predicted
  it least.</p>
</div>
<div class="provbar"><span class="prov prov-s">Our synthesis <span class="src">· based on Bastani + the ITS literature</span></span> <span class="chain">No paper states this in these words; the inference is mine</span></div>
-->

I want to be careful about what this does and does not show.

It is not evidence that artificial intelligence damages learning in general. The second
group is the proof that it does not have to.

It is evidence about measurement, and that makes it more useful, not less.

The moment that looked most like success — a student solving more problems, faster, with
help available — was the moment that told us least about whether anything had been
learned.

And here is the practical consequence for anyone choosing software. If you evaluate a
tool by watching students use it, that can lead you to prefer the tools that do the most
work for them.

I am not claiming that is what buyers systematically do — nobody has measured that. I am
claiming this experiment shows the metric is capable of inverting the ranking.

Which is enough reason to be a little suspicious of a demonstration that feels
wonderful.

## SLIDE 5 — So does it work?

<!--visual
<h2>So does it work?</h2>
<div class="stat-row">
  <div class="stat"><span class="stat-n">+0.125</span><span class="stat-u">SD</span>
    <span class="stat-l">average effect on learning<br>vs traditional instruction</span></div>
  <div class="stat"><span class="stat-n">14</span>
    <span class="stat-l">randomised trials<br>191 effect sizes, 10 economies</span></div>
  <div class="stat"><span class="stat-n">+0.12</span><span class="stat-u">SD</span>
    <span class="stat-l">the AI tutoring<br>and instruction subset</span></div>
</div>
<p class="note">A real effect. Above the median for field interventions in education.
Not a revolution. <b>Read the base honestly:</b> a World Bank working paper, not yet
peer-reviewed; 14 studies; no included study from a low-income country.</p>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Burneo et al. 2026, World Bank</span></span> <span class="chain">Working paper, not peer-reviewed → verified in T-006 (fable) · the “not a revolution” judgement is mine</span></div>
-->

So, does any of it work? Yes, on average, modestly, and the honest number is not
thrilling.

The most recent meta-analysis pools a hundred and ninety-one effect estimates from
fourteen randomised trials across ten economies.

The average effect on learning is about an eighth of a standard deviation. Plus zero
point one two five.

The subset that is specifically artificial intelligence tutoring or instruction sits at
roughly the same value.

That is a genuine effect, and it sits above the median for education interventions
measured in real classrooms. It is worth having.

It is also not a transformation of education, and anyone selling you one is running
ahead of the evidence.

And since I am going to spend the rest of this talk being demanding, let me be fair for
a moment about what this technology genuinely does well.

It is available at eleven at night, which no tutor of mine ever was.

It is endlessly patient, and it does not sigh when a student asks the same question for
the third time.

It will explain the same idea in four different ways, in the student's own language, at
whatever reading level they need.

Those are real gains in access, and for some students access is the whole problem.

My argument is not that this is worthless. It is that access and availability are not the
same thing as instruction, and the evidence only rewards us when we build the second one
on top of the first.

## SLIDE 6 — The number nobody quotes

<!--visual
<div class="big-idea">
  <p class="kicker">The number that never appears in a pitch</p>
  <h2>Generative AI vs the previous generation of adaptive tutors</h2>
  <div class="stat-inline"><span class="stat-n">0.022</span><span class="stat-u">SD</span>
    <span class="stat-l">estimated difference &nbsp;·&nbsp; standard error <b>0.075</b>
    &nbsp;·&nbsp; CI [−0.15, 0.19]</span></div>
  <p class="sub">Not evidence of equivalence. Absence of a demonstrated advantage.</p>
  <p class="note">The authors' own words: the interval <em>“bounds the difference between
  generations rather than resolving it”</em> — and “the experimental record to date shows
  no advantage for the newer technology.”</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Burneo et al. 2026 — authors’ own wording</span></span> <span class="chain">Primary source → verified in T-006 (fable) · “still the benchmark” is my reading</span></div>
-->

Here is the number that almost never appears in a product presentation.

When you compare generative systems against the previous generation of adaptive tutoring
software — the kind that existed well before large language models — the estimated
difference is about two hundredths of a standard deviation.

The standard error on that estimate is more than three times the estimate itself.

I want to state that carefully, because it is easy to overclaim in either direction.

This is not proof that the two are equivalent. The evidence base is simply not yet able
to rank the generations.

But it does mean something concrete for a purchasing decision. The older, less
conversational, less impressive-looking technology is still the benchmark, and it has not
been beaten.

## SLIDE 7 — The average hides the lesson

<!--visual
<h2>The average is the least interesting part</h2>
<table class="results wide">
  <tr><th>Study</th><th>Effect</th><th>What was actually deployed</th></tr>
  <tr><td>University physics, crossover</td><td class="up">≈ +0.63 SD</td>
      <td>expert-written lessons, verified solutions, sequence enforced by the platform</td></tr>
  <tr><td>Nigeria, after-school</td><td class="up">≈ +0.31 SD</td>
      <td>AI + extra time + teachers present + students working in pairs</td></tr>
  <tr><td>Sierra Leone, school-scale</td><td class="up">+0.258 SD</td>
      <td>teacher-led classes; teachers set the objectives</td></tr>
  <tr><td>AI reading tutor + a human<br>to drive engagement</td><td class="flat">≈ 0</td>
      <td><b>both arms had the platform</b>; what was randomised was adding a person whose
      job was engagement, not teaching</td></tr>
</table>
<p class="note">Read each honestly: the physics result is two lessons with an immediate
test at one elite university; Nigeria lost 569 of 1,328 students before the final test;
Sierra Leone is a provider report, not peer-reviewed.</p>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Kestin 2025 · De Simone 2025 · LearnLM/Fab AI 2026 · Robinson 2026</span></span> <span class="chain">All four verified in T-006 (fable) · Sierra Leone is a provider report</span></div>
-->

The average is the least interesting part of that meta-analysis, because the spread
around it is enormous.

A crossover study in university physics found about six tenths of a standard deviation.

An after-school programme in Nigeria found about three tenths.

A school-scale deployment in Sierra Leone found a quarter of a standard deviation.

And a pair of trials on an AI reading tutor found essentially nothing on reading.

That last row needs a caveat, and I would rather give it to you than have you find it
afterwards. In those trials both groups already had the platform. What was randomised was
adding a human being whose job was to keep students engaged with it. So the null is about
the human support, not about access itself.

Same broad technology. Completely different outcomes. So the interesting question is not
whether AI works. It is what distinguishes the top row from the bottom one.

## SLIDE 8 — Effects are recipes

<!--visual
<div class="big-idea">
  <h2>Across these cases, the large effects look like <em>recipes</em>,
  not properties of the model.</h2>
  <ul class="clean">
    <li>Content written and checked by subject experts</li>
    <li>A sequence the platform enforces from <b>outside</b> the model</li>
    <li>Extra time that was actually scheduled</li>
    <li>A teacher or facilitator in the room</li>
  </ul>
  <p class="sub">Copying the brand does not reproduce the treatment.
  Neither does copying the prompt.</p>
</div>
<div class="provbar"><span class="prov prov-s">Our synthesis <span class="src">· based on Kestin + Nigeria + Sierra Leone</span></span> <span class="chain">The ingredients are measured; that they form a necessary recipe is not</span></div>
-->

Look at what was actually deployed in these four cases, and a pattern appears.

The physics result used lessons designed by subject experts, with worked solutions
prepared in advance, and a sequence the platform imposed from outside the model.

That detail deserves a moment. The researchers reported that the prompt alone could not
hold the teaching sequence reliably, so they moved the sequence out of the prompt and
into the software around it.

The Nigerian programme was after-school sessions, with additional instructional time,
teachers present, and students working in pairs.

Sierra Leone was ordinary classes, led by teachers who set the objectives.

Across these high-effect cases, what was tested is a package: verified content, an
enforced sequence, protected time, and people.

I want to be careful here, because this is my reading and not a finding. Nobody has
tested whether those four ingredients are each necessary, and Sierra Leone does not
contain all of them.

What I am confident saying is the negative version. Copying the brand does not reproduce
the treatment. And copying the prompt does not reproduce it either.

## SLIDE 9 — The null result that matters most

<!--visual
<h2>The metric that moved, and the one that didn't</h2>
<p class="lede">Two RCTs, ≈350 primary students. <b>Both arms had the AI tutor.</b> What
was randomised: adding an in-person tutor whose role was engagement, not instruction.</p>
<div class="stat-row">
  <div class="stat"><span class="stat-n">+71–80%</span>
    <span class="stat-l">engagement<br><b>the number that goes in the deck</b></span></div>
  <div class="stat"><span class="stat-n">+1 to 4</span>
    <span class="stat-l">minutes of actual use<br>per week &nbsp;·&nbsp; <b>the real dose</b></span></div>
  <div class="stat"><span class="stat-n">0</span>
    <span class="stat-l">improvement<br>in reading</span></div>
</div>
<p class="note">Descriptive, not randomised: in the access-only arm nearly half never
opened the platform, and those who did averaged 2–5 minutes a week.
<b>A percentage is not minutes.</b></p>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Robinson et al. 2026</span></span> <span class="chain">Correction trail: source report said 4.4 min → primary abstract says 1–4 → corrected after verification in T-006 (fable)</span></div>
-->

The most useful result in this area is a null one, and it is the least discussed.

Two randomised trials, around three hundred and fifty primary school children. Both
groups had the AI reading tutor. The thing being tested was adding a person whose job was
to keep them using it.

Engagement rose by between seventy-one and eighty per cent.

That is the number that goes in the deck. Now the same result in absolute terms.

Average use went up by one to four minutes per week.

And reading did not improve at all.

I find this the most clarifying pair of numbers in the whole literature, because both are
true and they tell opposite stories.

A relative rise in engagement of eighty per cent sounds like adoption. One to four
minutes a week is not a dose of anything.

There is one more number here, and I want to label it carefully because it is descriptive
rather than randomised. In the arm that had the platform and no human support, nearly half
the students never opened it at all, and those who did averaged two to five minutes a
week.

So keep this one in your pocket for the next time someone proposes buying licences for
everybody. Take-up is not an implementation detail. It is part of the treatment, and it
has to be planned and measured like one.

## SLIDE 10 — What is under the conversation

<!--visual
<h2>The conversation is the surface</h2>
<div class="stack">
  <div class="layer surface">Conversation and interface</div>
  <div class="layer">Guardrails — attempt before hint, no answer on demand, fading</div>
  <div class="layer">Tools and verification — calculation and facts <b>outside</b> the model</div>
  <div class="layer">Pedagogical policy — what to do next, and why</div>
  <div class="layer">Learner model — a structured estimate, not a chat history</div>
  <div class="layer">Domain model — concepts, prerequisites, worked solutions</div>
  <div class="layer base">Human orchestration and independent measurement</div>
</div>
<div class="provbar"><span class="prov prov-s">Our synthesis <span class="src">· design framework, condensed from the source report §3</span></span> <span class="chain">A recommended architecture, not a measured effect</span></div>
-->

If the effects come from packages, it is worth asking what a package actually contains.

The conversation is the surface. It is the part you see in a demonstration, and usually
the only part a demonstration shows.

Underneath, a serious system needs a map of the subject, with prerequisites and worked
solutions.

It needs a structured estimate of what this particular student knows. Not a
conversation history — an actual state, that can be inspected.

That distinction is worth making concrete, because it is where most products quietly
fail.

A chat history says: this student asked about the budget constraint twice and seemed
confused.

A learner model, in the system we are building, could instead say: this student can
compute the slope, cannot interpret it as an opportunity cost, has not demonstrated the
feasible set at all, and the last two pieces of evidence came with hints, so they do not
count.

The first is a transcript. The second is something a teacher can read, disagree with, and
correct.

It needs an explicit policy for what to do next, and a reason for choosing it.

It needs tools that calculate and verify, sitting outside the model that does the
talking.

It needs limits on what it is willing to reveal, and support that withdraws as the
student improves.

And it needs a teacher who can see what it believes and overrule it, plus a way of
measuring itself that is not its own opinion.

## SLIDE 11 — Four levels of personalization

<!--visual
<h2>Four levels of "personalized"</h2>
<ol class="levels">
  <li><b>Presentation</b> — tone, language, length, readability
      <span class="tag common">common</span></li>
  <li><b>Interaction</b> — the example, the hint, the next question in this turn
      <span class="tag common">common</span></li>
  <li><b>Pedagogical decision</b> — the next action, chosen from a diagnosis
      <span class="tag rare">evidence thin</span></li>
  <li><b>Trajectory</b> — across sessions: prerequisites, forgetting, transfer
      <span class="tag rare">evidence thin</span></li>
</ol>
<p class="note big">Remembering your name is not the same as estimating what you know.</p>
<div class="provbar"><span class="prov prov-s">Our framework <span class="src">· our taxonomy, not a validated one</span></span> <span class="chain">Public causal evidence does not isolate levels 3–4; the split is ours</span></div>
-->

The word personalized is doing a great deal of unearned work in this field, so it helps
to break it into four levels.

Level one changes presentation: tone, language, length, reading level.

Level two changes the interaction: which example, which hint, which question comes next
in this turn.

Many of the products you will be shown stop there, and both levels are genuinely useful
for access.

Level three chooses the next action based on a diagnosis of what this student got wrong,
and why.

Level four maintains a trajectory across sessions, tracking prerequisites, forgetting and
transfer.

Three and four are what this framework treats as genuine pedagogical adaptation. I should
be careful about how I put the next part: the public causal evidence does not isolate
those levels and tell us the effects live there. It is thinner than that.

The test I find most useful is this. A system that remembers your name, adopts a warm
tone, and rephrases the same content can feel deeply personal while estimating nothing at
all about what you know.

## SLIDE 12 — What to ask for

<!--visual
<div class="big-idea">
  <p class="kicker">The one question that separates a system from a demo</p>
  <h2>"Show me the learner model before and after three answers.<br>
  What changed, and why?"</h2>
</div>
<ol class="checks">
  <li>Curriculum traceable to sources you authorised</li>
  <li>A student state the teacher can see — and correct when it is wrong</li>
  <li>An explicit help policy: attempt before hint, no answer on demand, support that fades</li>
  <li>Calculation and fact-checking done by tools, outside the language model</li>
  <li>Evidence on your population, on your outcome, measured without the tool present</li>
</ol>
<div class="provbar"><span class="prov prov-r">Our recommendation <span class="src">· my 5-point shortlist, condensed from the report’s 10 requirements</span></span> <span class="chain">Normative. No experiment established this list</span></div>
-->

So here is what I would ask for, and it fits on a single slide.

Start with one question, because it separates a real system from a good demonstration.

Show me the student model before and after three answers. Tell me what changed, and why
it changed.

If the answer is a longer chat history, you are looking at level two dressed as level
four.

Then five checks.

Is the curriculum traceable to sources you authorised, rather than to the open web.

Can a teacher see the estimated state, and correct it when it is wrong.

Is there an explicit help policy — an attempt required before a hint, no answer on
demand, and support that fades as the student improves.

Are calculation and fact-checking done by tools outside the language model, rather than
by the model marking its own arithmetic.

And is there evidence on a population like yours, on an outcome like yours, measured
without the tool in the room.

If you only have two minutes with a vendor, there is a faster probe. Sit down in front of
the system and ask it, plainly, to just give you the answer.

Then ask again, and be a little rude about it.

What you are testing is whether the refusal is a policy or a personality. A policy holds
on the third request. A personality folds, and every one of your students will find that
out before the end of the first week.

## SLIDE 13 — How to measure

<!--visual
<div class="big-idea">
  <p class="kicker">The measurement rule</p>
  <h2>Independent test. No AI present. Ideally after a delay.</h2>
  <p class="sub">Everything else — satisfaction, engagement, problems per hour — measures
  productivity. Worth tracking. Not the outcome.</p>
  <p class="note big">And count real minutes of use. A licence is not a dose.</p>
</div>
<div class="provbar"><span class="prov prov-r">Our measurement rule <span class="src">· informed by Bastani + the evaluation framework</span></span> <span class="chain">A standard we recommend, not an estimate</span></div>
-->

And on that last point, the measurement rule is short enough to remember on the way out.

The primary outcome should be an independent test, taken without the system present, and
ideally after a delay of days or weeks.

Everything else — satisfaction, engagement, problems completed per hour, next-question
accuracy — measures productivity while assisted.

Those are worth tracking. I track them. They are simply not the outcome, and the first
experiment I showed you is what happens when they are treated as one.

And count real minutes of use, by student. Not licences issued, not accounts created.

## SLIDE 13b — Three questions nobody has answered

<!--visual
<h2>Three questions nobody has answered</h2>
<p class="lede">Not a wish-list. Each one is unanswered, would change what you do next
semester, and has a reason it has not been asked.</p>
<ol class="questions">
  <li><b>Does the model add anything beyond the package it ships in?</b>
    <span>No trial has an active control: same extra time, same structure, same adult
    supervision, without the AI.</span></li>
  <li><b>Generative or the previous generation — which, for the same content and time?</b>
    <span>The head-to-head trial does not exist. Our headline 0.022 is a cross-study
    comparison, not a race.</span></li>
  <li><b>Is take-up itself the treatment?</b>
    <span>Nobody has held the tool constant and randomised how it enters the classroom.</span></li>
</ol>
<div class="provbar"><span class="prov prov-s">Our synthesis <span class="src">· gaps identified in T-006 (fable)</span></span> <span class="chain">Each gap checked against the studies in the record</span></div>
-->

I want to end the evidence part with the three questions that nobody has answered, because
for this audience they are more useful than the answers we do have.

Each one had to clear a bar: no study in the record answers it, an answer would change
what you do next semester, and I can tell you why it has not been asked.

## SLIDE 13c — Question one: the missing control

<!--visual
<div class="big-idea">
  <p class="kicker">Question one</p>
  <h2>Does the model add anything beyond the package it ships in?</h2>
</div>
<div class="qgrid">
  <div><b>The gap</b><span>Every large positive effect is a bundle — AI <em>plus</em> extra
    scheduled time, structure and adult attention — measured against a control that got no
    extra anything. Nigeria's control received no intervention; treatment got 18 extra hours
    of supervised sessions. Rori added two 30-minute sessions on top of normal class.</span></div>
  <div><b>Why it matters to you</b><span>If most of the gain is the scheduled, supervised
    practice block, you can run that block without buying anything. If it is the AI, the
    licence is the cheapest ingredient. Opposite budget decisions.</span></div>
  <div><b>Why it is unanswered</b><span>An active control roughly doubles cost and answers a
    question neither vendors nor implementing researchers are motivated to ask — in the
    meta-analysis, researchers implemented 16 of 19 interventions.</span></div>
</div>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· De Simone 2025 · Henkel 2024 · Burneo 2026</span></span> <span class="chain">Designs are from the papers; that the gap matters for your budget is my inference</span></div>
-->

Question one. Does the model add anything beyond the package it ships in?

Every large positive effect in this literature is a bundle. The AI, plus extra scheduled
time, plus structure, plus adult attention — measured against a control group that got no
extra anything.

In Nigeria the control received no intervention at all, while the treatment group got
eighteen extra hours of supervised sessions. In Ghana it was two extra half-hour sessions
a week on top of normal class.

So nobody has run the arm that would settle it: same extra time, same structure, same
adult supervision, and no AI.

And notice why this matters for your budget. If most of that third of a standard deviation
comes from the scheduled, supervised practice block, then you can run that block without
buying anything at all. If it comes from the software, the licence is the cheapest
ingredient in the recipe.

Those are opposite decisions, and today the evidence cannot separate them.

Why has nobody done it? An active control roughly doubles the cost of the study, and it
answers a question that neither the vendors nor the implementing researchers are
especially motivated to ask. In the meta-analysis I showed you, the researchers themselves
implemented sixteen of the nineteen interventions.

## SLIDE 13d — Question two: the race that was never run

<!--visual
<div class="big-idea">
  <p class="kicker">Question two</p>
  <h2>Generative, or the previous generation — for the same content, in the same time?</h2>
</div>
<div class="qgrid">
  <div><b>The gap</b><span>No study randomises students between a pre-LLM adaptive platform
    and a generative tutor teaching the same curriculum in the same time. The 0.022 from
    earlier is a <em>cross-study</em> estimate: different trials, populations, subjects and
    dosages.</span></div>
  <div><b>Why it matters to you</b><span>This is the actual procurement decision. The
    auditable, cheaper, non-conversational lineage benchmarks at +0.18 to +0.37 SD. Today
    the choice between them is made on demos.</span></div>
  <div><b>Why it is unanswered</b><span>It needs two production-grade systems on identical
    content, and it settles a comparison no vendor wants to lose. A meta-analysis can only
    synthesise the experiments that exist.</span></div>
</div>
<div class="provbar"><span class="prov prov-e">Evidence <span class="src">· Burneo 2026 · Muralidharan 2019 · Roschelle 2016</span></span> <span class="chain">The absence of a head-to-head trial was established in T-006 (fable)</span></div>
-->

Question two. Generative, or the previous generation, for the same content in the same
time?

I showed you zero point zero two two earlier, and I owe you a clarification about what
kind of number that is. It is a cross-study comparison — different trials, different
populations, different subjects, different dosages — not a race between two systems.

The race has never been run. No study randomises students between a pre-language-model
adaptive platform and a generative tutor teaching the same curriculum in the same amount
of time.

And this is the actual purchasing decision on the table. The older, auditable, cheaper,
non-conversational lineage benchmarks between about zero point one eight and zero point
three seven of a standard deviation. That is not a weak competitor.

So today the choice between the two generations gets made on the strength of a
demonstration, because the head-to-head number does not exist.

It is unanswered because it needs two production-grade systems built on identical content,
which is expensive, and because it settles a comparison that no vendor wants to lose.

## SLIDE 13e — Question three: is take-up the treatment?

<!--visual
<div class="big-idea">
  <p class="kicker">Question three</p>
  <h2>Is take-up itself the treatment?</h2>
</div>
<div class="qgrid">
  <div><b>The gap</b><span>Integration mode tracks outcomes almost perfectly — mandated,
    teacher-led, scheduled use gives +0.26 to +0.31 SD; optional access gives near-zero use.
    But that comparison runs across different tools, subjects and countries, so integration
    is confounded with everything.</span></div>
  <div><b>Why it matters to you</b><span>It answers whether putting a link in the syllabus is
    an intervention or a placebo — and whether the scarce resource to plan for is the tool
    or the protected time in which students must use it.</span></div>
  <div><b>Why it is unanswered</b><span>The field logs usage as an implementation covariate
    instead of designing it as the treatment. And randomising timetable policy inside one
    school raises fairness objections that after-school add-ons quietly avoid.</span></div>
</div>
<div class="provbar"><span class="prov prov-s">Our synthesis <span class="src">· based on Sierra Leone + Nigeria + Robinson</span></span> <span class="chain">Integration mode is confounded across studies — that is the point, not a finding</span></div>
-->

Question three, and it is the one I would most like someone in this room to answer. Is
take-up itself the treatment?

Across these studies, how the tool enters the classroom tracks the outcome almost
perfectly. Mandated, teacher-led, scheduled use gives you a quarter to a third of a
standard deviation. Optional access gives you almost no use at all.

But that comparison runs across different tools, different subjects and different
countries, so the integration mode is confounded with everything else.

Nobody has held the tool constant and randomised the policy: scheduled use inside class,
against recommended optional access.

For a department, that is the question with money attached. It tells you whether putting a
link in the syllabus is a real intervention or a placebo, and whether the scarce resource
you should be protecting is not the software at all, but the timetabled hour in which
students are actually required to use it.

It is unanswered partly through a blind spot — the field records usage as an
implementation detail rather than designing it as the treatment — and partly because
randomising timetable policy inside one school raises fairness objections that an
after-school add-on quietly avoids.

And there is a fourth question I will mention only in passing, because it is the one that
should embarrass all of us. The proposition that motivates this entire literature is that
personalisation can be delivered at a fraction of the cost of human tutoring. Only two of
the fourteen studies report per-student costs on a comparable basis. Human tutoring pools
at around zero point two nine of a standard deviation, against zero point one two for the
AI subgroup. Whether AI wins per dollar — which is the only frame in which a department
actually decides — has essentially never been measured next to the effects it is meant to
justify.

## SLIDE 14 — Applying it to our own work

<!--visual
<h2>What this changed in our own project</h2>
<p class="lede"><b>tutorIA</b> — a small interactive tutor for intermediate
microeconomics: narrated explanation, a manipulable budget line, ungraded questions,
and a judge that diagnoses misconceptions by name.</p>
<ol class="changes">
  <li><b>The tutor interrupts at designed points</b>, instead of waiting at an open chat
  window — the largest deployed AI tutor reports most students simply never used the
  chat.</li>
  <li><b>Evidence obtained with help does not count towards mastery</b> — a hint
  invalidates the attempt, and we re-test with a fresh item.</li>
  <li><b>An unassisted check at the end of each concept</b> — no grade, never shown to
  the student as an assessment, feeding only the instructor's diagnosis.</li>
</ol>
<div class="provbar"><span class="prov prov-p">Our project <span class="src">· evidence-informed decisions, not results</span></span> <span class="chain">tutorIA has not been evaluated. No trial has been run</span></div>
-->

Let me close by applying this to my own work, because it is easy to give this talk and
then not follow it.

We are building a small interactive tutor for intermediate microeconomics. Narrated
explanation, a budget line the student can drag, ungraded questions, and a component that
diagnoses misconceptions by name.

Reading this evidence changed three decisions.

The first: the tutor interrupts at points designed into the script, instead of waiting
behind an open chat window. The largest deployed AI tutor in the world reports that most
of its students simply never used the chat, and is now being rebuilt to be visible during
the task.

The second: evidence obtained with help does not count towards mastery. If a student
takes a hint, that attempt no longer counts, and we ask a fresh question instead.

I should be precise about where that rule comes from, because it would be easy to
overclaim. The rule itself comes from the tutoring systems of the nineteen-nineties,
where asking for a hint already invalidated the attempt. Bastani does not test that rule.
What Bastani supplies is the modern warning that sent us looking for it.

The third, and the one I am least comfortable with: an unassisted check at the end of
each concept. No grade, never presented to the student as an assessment, feeding only the
instructor's diagnosis.

We added it for one reason. Without it, a tutor that produced exactly the result of that
first experiment would look, in our own data, identical to an excellent one.

And to be honest about where we are: none of that is a result yet. It is a set of design
decisions that follow from other people's evidence.

We have not run a trial. We do not know whether our tutor teaches anything.

What I can tell you is that we designed the instrument that would let us find out before
we finished the thing it measures — and I would ask the same of anyone selling to us.

## SLIDE 15 — The line to remember

<!--visual
<div class="closing">
  <h2>The decisive advance is not a system that sounds more like a teacher.</h2>
  <p class="closing-body">It is a system that can say what it believes the student knows,
  why it chose the next step, when it should stay quiet — and, without being the judge of
  its own work, whether the student actually learned.</p>
</div>
<div class="provbar"><span class="prov prov-s">Our conclusion</span> <span class="chain">No paper identifies “the decisive advance”. This one is mine</span></div>
-->

If you take one sentence away from this, I would like it to be this one.

The decisive advance is not a system that sounds more like a teacher.

It is a system that can tell you what it believes the student knows, why it chose the
next step, when it ought to stay quiet, and — without being the judge of its own work —
whether the student actually learned.

Thank you.

## SLIDE A1 — References

<!--visual
<h2>References</h2>
<div class="refs">
<p><b>Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., &amp; Mariman, R.</b> (2025).
Generative AI without guardrails can harm learning: Evidence from high school mathematics.
<i>PNAS</i>, 122(26), e2422633122. doi.org/10.1073/pnas.2422633122</p>
<p><b>Burneo, A., Dinarte-Diaz, L., Lopez, C., &amp; Molina, E.</b> (2026). Can EdTech Close
Learning Gaps? Global Evidence from Digital Interventions. Background paper, <i>World
Development Report 2026</i>, World Bank. Working paper, not peer-reviewed.</p>
<p><b>Kestin, G., Miller, K., Klales, A., Milbourne, T., &amp; Ponti, G.</b> (2025). AI tutoring
outperforms in-class active learning: An RCT introducing a novel research-based design in an
authentic educational setting. <i>Scientific Reports</i>, 15, 17458.
doi.org/10.1038/s41598-025-97652-6</p>
<p><b>De Simone, M., Tiberti, F., Barron Rodriguez, M., Manolio, F., Mosuro, W., &amp;
Dikoru, E. J.</b> (2025). From Chalkboards to Chatbots: Evaluating the Impact of Generative AI
on Learning Outcomes in Nigeria. World Bank Policy Research Working Paper 11125.</p>
<p><b>LearnLM Team, Google &amp; Fab AI</b> (2026). Teaching with Gemini: Measuring the impact
of Guided Learning on student mathematics progress in Sierra Leone. Technical report
(provider-produced, not peer-reviewed).</p>
<p><b>Robinson, C. D., Gormley, D., Trindade Ribeiro, A., &amp; Loeb, S.</b> (2026). Access is
Not Enough: Human Support Improves Engagement with AI Tutoring. EdWorkingPaper 26-1451,
Annenberg Institute, Brown University. doi.org/10.26300/pz7p-p388</p>
<p><b>Muralidharan, K., Singh, A., &amp; Ganimian, A. J.</b> (2019). Disrupting Education?
Experimental Evidence on Technology-Aided Instruction in India. <i>American Economic Review</i>,
109(4), 1426–1460. doi.org/10.1257/aer.20171112</p>
<p><b>Henkel, O., Horne-Robinson, H., Kozhakhmetova, N., &amp; Lee, A.</b> (2024). Effective and
Scalable Math Support: Evidence on the Impact of an AI-Tutor on Math Achievement in Ghana.
arXiv:2402.09809. Preprint.</p>
<p><b>Roschelle, J., Feng, M., Murphy, R. F., &amp; Mason, C. A.</b> (2016). Online Mathematics
Homework Increases Student Achievement. <i>AERA Open</i>, 2(4), 1–12.
doi.org/10.1177/2332858416673968</p>
<p><b>Wang, R. E., Ribeiro, A. T., Robinson, C. D., Loeb, S., &amp; Demszky, D.</b> (2024).
Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise. arXiv:2410.03017.</p>
<p><b>LearnLM Team, Google, &amp; Eedi</b> (2025). AI tutoring can safely and effectively
support students: An exploratory RCT in UK classrooms. arXiv:2512.23633.</p>
</div>
-->

## SLIDE A2 — How this talk was made

<!--visual
<h2>How this talk was made</h2>
<div class="method">
<p>The source report was developed by <b>Kristian with ChatGPT</b>. Because it came from a
language model, no figure reached a slide until it had been checked against the primary
source.</p>
<p class="role">Numerical claims checked against primary sources by <b>fable</b> (task T-006).
Nine headline figures: eight held, one was corrected — Robinson's usage figure is
“1 to 4 minutes”, not 4.4. Nigeria's English effect is 0.23 SD, not 0.24. Sierra Leone is
quoted at its ITT of 0.258, not its ToT.</p>
<p class="role">Research questions, study contrasts and the three open questions compiled by
<b>fable</b> (T-006), who also caught that Robinson randomised <i>added human support</i>, not
access — which corrected two slides.</p>
<p class="role">Prior-art research by <b>codex</b>, <b>claude</b> and <b>agy</b> (task T-002),
across three disjoint lanes: tutoring-system internals, interfaces and authoring, and deployed
LLM tutors.</p>
<p class="role">Provenance taxonomy and the audit of every claim on these slides by
<b>codex</b> (T-006), which raised seven blockers against earlier drafts — all applied.</p>
<p class="role">Talk selection, synthesis and delivery by <b>claude</b> and Kristian.
<b>Kristian is the principal and the presenter.</b></p>
<p>Naming the tools is not a flourish. If a number on a slide is wrong, this is the trail you
would follow to find out why.</p>
</div>
-->
