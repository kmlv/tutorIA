I want to start with an experiment that should make all of us a little uncomfortable.

Then I will give you the honest number for whether any of this works.

And I will finish with the questions I would ask before letting one of these tools near my students.

Before any of the evidence, thirty seconds on where this talk comes from, because you should be able to tell my sources apart from my opinions.

It started as a research report I generated in a conversation with a language model.

That is a perfectly good way to start and a terrible way to finish, so nothing from it went onto a slide until it had been checked against the original paper.

Nine headline figures were re-checked that way. Eight held.

One was wrong, and I will show you that one later, because correcting it turned out to make the argument better rather than weaker.

Underneath that sits an earlier review of this same literature from three separate angles: the intelligent tutoring tradition, the interface and authoring side, and the language-model tutors that are actually deployed today.

So from here on, every claim on these slides carries one of four labels.

Evidence, with the author and the year, means somebody measured it.

Our synthesis means we built the conclusion by comparing sources. The citation proves the inputs, not the conclusion.

Our recommendation means it is a judgement about what you should do, and no experiment established it.

And our project means it is a fact about the thing we are building, which is not the same as a result.

The middle two are the ones you should argue with, and I have tried to make them easy to find rather than easy to miss.

Before the result, the question they set out to answer, in their words: how generative AI affects learning — how humans acquire new skills as they perform tasks.

Notice that the question is about acquisition, not about performance. That is what makes the design work.

Nearly a thousand high school mathematics students were randomly assigned to three groups.

The first group practised with an ordinary chat assistant, with no restrictions.

The second group practised with the same underlying model, but wrapped in safeguards. It was built to give hints and withhold the answer.

The third group practised the way students have always practised, with no technology at all.

Then the researchers took the assistance away, and gave all three groups the same exam.

Hold on to that last step, because it is the entire design. The measurement happens after the help is gone.

During the practice sessions, the unrestricted group performed forty-eight per cent better than the control group.

On the exam, without the tool, the same students performed seventeen per cent worse than the control group.

Now look at the tutored version, the one built carefully, with safeguards.

During practice it did even better. A hundred and twenty-seven per cent above control.

And on the exam it came out level with the control group. No better, no worse.

So the careful design succeeded at something real. It removed the damage. What it did not do was produce any measurable learning advantage of its own.

I want to be careful about what this does and does not show.

It is not evidence that artificial intelligence damages learning in general. The second group is the proof that it does not have to.

It is evidence about measurement, and that makes it more useful, not less.

The moment that looked most like success — a student solving more problems, faster, with help available — was the moment that told us least about whether anything had been learned.

And here is the practical consequence for anyone choosing software. If you evaluate a tool by watching students use it, that can lead you to prefer the tools that do the most work for them.

I am not claiming that is what buyers systematically do — nobody has measured that. I am claiming this experiment shows the metric is capable of inverting the ranking.

Which is enough reason to be a little suspicious of a demonstration that feels wonderful.

And the same for the meta-analysis, because its question tells you what it can settle.

They note that experimental estimates vary widely in magnitude and even in sign, and that the existing syntheses all predate generative AI.

So what they built is a common frame: old-style adaptive platforms and new generative tools, under the same inclusion criteria, on the same effect-size scale.

That is what makes the next two slides possible, and it is also the reason they can compare the generations at all.

So, does any of it work? Yes, on average, modestly, and the honest number is not thrilling.

The most recent meta-analysis pools a hundred and ninety-one effect estimates from fourteen randomised trials across ten economies.

The average effect on learning is about an eighth of a standard deviation. Plus zero point one two five.

The subset that is specifically artificial intelligence tutoring or instruction sits at roughly the same value.

That is a genuine effect, and it sits above the median for education interventions measured in real classrooms. It is worth having.

It is also not a transformation of education, and anyone selling you one is running ahead of the evidence.

And since I am going to spend the rest of this talk being demanding, let me be fair for a moment about what this technology genuinely does well.

It is available at eleven at night, which no tutor of mine ever was.

It is endlessly patient, and it does not sigh when a student asks the same question for the third time.

It will explain the same idea in four different ways, in the student's own language, at whatever reading level they need.

Those are real gains in access, and for some students access is the whole problem.

My argument is not that this is worthless. It is that access and availability are not the same thing as instruction, and the evidence only rewards us when we build the second one on top of the first.

Here is the number that almost never appears in a product presentation.

When you compare generative systems against the previous generation of adaptive tutoring software — the kind that existed well before large language models — the estimated difference is about two hundredths of a standard deviation.

The standard error on that estimate is more than three times the estimate itself.

I want to state that carefully, because it is easy to overclaim in either direction.

This is not proof that the two are equivalent. The evidence base is simply not yet able to rank the generations.

But it does mean something concrete for a purchasing decision. The older, less conversational, less impressive-looking technology is still the benchmark, and it has not been beaten.

The average is the least interesting part of that meta-analysis, because the spread around it is enormous.

A crossover study in university physics found about six tenths of a standard deviation.

An after-school programme in Nigeria found about three tenths.

A school-scale deployment in Sierra Leone found a quarter of a standard deviation.

And a pair of trials on an AI reading tutor found essentially nothing on reading.

That last row needs a caveat, and I would rather give it to you than have you find it afterwards. In those trials both groups already had the platform. What was randomised was adding a human being whose job was to keep students engaged with it. So the null is about the human support, not about access itself.

Same broad technology. Completely different outcomes. So the interesting question is not whether AI works. It is what distinguishes the top row from the bottom one.

It is worth putting the three questions side by side, because they are not the same question and the effect sizes are not comparable in the way a table makes them look.

Kestin asked whether an AI tutor beats an active learning classroom when the material is identical. Not AI against nothing, and not AI against a lecture — AI against the best thing we already know how to do. That is the hardest comparison in the set, and it is why that number is striking.

Nigeria asked whether generative AI can help with large learning deficits and scarce teaching resources. Their control group received no intervention at all. So the three tenths is the effect of the entire after-school package, not of the model inside it.

Sierra Leone asked something different again: how does teacher-led integration of the tool into maths classes affect outcomes. Both arms had the same teacher training. The question there is about integration, not about the app.

Three questions, three contrasts, one table. That is exactly how a literature gets misread.

Look at what was actually deployed in these four cases, and a pattern appears.

The physics result used lessons designed by subject experts, with worked solutions prepared in advance, and a sequence the platform imposed from outside the model.

That detail deserves a moment. The researchers reported that the prompt alone could not hold the teaching sequence reliably, so they moved the sequence out of the prompt and into the software around it.

The Nigerian programme was after-school sessions, with additional instructional time, teachers present, and students working in pairs.

Sierra Leone was ordinary classes, led by teachers who set the objectives.

Across these high-effect cases, what was tested is a package: verified content, an enforced sequence, protected time, and people.

I want to be careful here, because this is my reading and not a finding. Nobody has tested whether those four ingredients are each necessary, and Sierra Leone does not contain all of them.

What I am confident saying is the negative version. Copying the brand does not reproduce the treatment. And copying the prompt does not reproduce it either.

And this one I want to give you carefully, because an earlier version of this talk got it wrong, and it is the kind of wrong that gets found in the question session rather than in the preparation.

What they tested was an in-person tutor whose role was to support engagement with an AI literacy tutor — explicitly not to deliver instruction.

Both groups had the platform. What was randomised was the human being.

So this study cannot tell you what happens when you compare access against nothing, because there is no arm without the AI.

The most useful result in this area is a null one, and it is the least discussed.

Two randomised trials, around three hundred and fifty primary school children. Both groups had the AI reading tutor. The thing being tested was adding a person whose job was to keep them using it.

Engagement rose by between seventy-one and eighty per cent.

That is the number that goes in the deck. Now the same result in absolute terms.

Average use went up by one to four minutes per week.

And reading did not improve at all.

I find this the most clarifying pair of numbers in the whole literature, because both are true and they tell opposite stories.

A relative rise in engagement of eighty per cent sounds like adoption. One to four minutes a week is not a dose of anything.

There is one more number here, and I want to label it carefully because it is descriptive rather than randomised. In the arm that had the platform and no human support, nearly half the students never opened it at all, and those who did averaged two to five minutes a week.

So keep this one in your pocket for the next time someone proposes buying licences for everybody. Take-up is not an implementation detail. It is part of the treatment, and it has to be planned and measured like one.

If the effects come from packages, it is worth asking what a package actually contains.

The conversation is the surface. It is the part you see in a demonstration, and usually the only part a demonstration shows.

Underneath, a serious system needs a map of the subject, with prerequisites and worked solutions.

It needs a structured estimate of what this particular student knows. Not a conversation history — an actual state, that can be inspected.

That distinction is worth making concrete, because it is where most products quietly fail.

A chat history says: this student asked about the budget constraint twice and seemed confused.

A learner model, in the system we are building, could instead say: this student can compute the slope, cannot interpret it as an opportunity cost, has not demonstrated the feasible set at all, and the last two pieces of evidence came with hints, so they do not count.

The first is a transcript. The second is something a teacher can read, disagree with, and correct.

It needs an explicit policy for what to do next, and a reason for choosing it.

It needs tools that calculate and verify, sitting outside the model that does the talking.

It needs limits on what it is willing to reveal, and support that withdraws as the student improves.

And it needs a teacher who can see what it believes and overrule it, plus a way of measuring itself that is not its own opinion.

The word personalized is doing a great deal of unearned work in this field, so it helps to break it into four levels.

Level one changes presentation: tone, language, length, reading level.

Level two changes the interaction: which example, which hint, which question comes next in this turn.

Many of the products you will be shown stop there, and both levels are genuinely useful for access.

Level three chooses the next action based on a diagnosis of what this student got wrong, and why.

Level four maintains a trajectory across sessions, tracking prerequisites, forgetting and transfer.

Three and four are what this framework treats as genuine pedagogical adaptation. I should be careful about how I put the next part: the public causal evidence does not isolate those levels and tell us the effects live there. It is thinner than that.

The test I find most useful is this. A system that remembers your name, adopts a warm tone, and rephrases the same content can feel deeply personal while estimating nothing at all about what you know.

So here is what I would ask for, and it fits on a single slide.

Start with one question, because it separates a real system from a good demonstration.

Show me the student model before and after three answers. Tell me what changed, and why it changed.

If the answer is a longer chat history, you are looking at level two dressed as level four.

Then five checks.

Is the curriculum traceable to sources you authorised, rather than to the open web.

Can a teacher see the estimated state, and correct it when it is wrong.

Is there an explicit help policy — an attempt required before a hint, no answer on demand, and support that fades as the student improves.

Are calculation and fact-checking done by tools outside the language model, rather than by the model marking its own arithmetic.

And is there evidence on a population like yours, on an outcome like yours, measured without the tool in the room.

If you only have two minutes with a vendor, there is a faster probe. Sit down in front of the system and ask it, plainly, to just give you the answer.

Then ask again, and be a little rude about it.

What you are testing is whether the refusal is a policy or a personality. A policy holds on the third request. A personality folds, and every one of your students will find that out before the end of the first week.

And on that last point, the measurement rule is short enough to remember on the way out.

The primary outcome should be an independent test, taken without the system present, and ideally after a delay of days or weeks.

Everything else — satisfaction, engagement, problems completed per hour, next-question accuracy — measures productivity while assisted.

Those are worth tracking. I track them. They are simply not the outcome, and the first experiment I showed you is what happens when they are treated as one.

And count real minutes of use, by student. Not licences issued, not accounts created.

I want to end the evidence part with the three questions that nobody has answered, because for this audience they are more useful than the answers we do have.

Each one had to clear a bar: no study in the record answers it, an answer would change what you do next semester, and I can tell you why it has not been asked.

Question one. Does the model add anything beyond the package it ships in?

Every large positive effect in this literature is a bundle. The AI, plus extra scheduled time, plus structure, plus adult attention — measured against a control group that got no extra anything.

In Nigeria the control received no intervention at all, while the treatment group got eighteen extra hours of supervised sessions. In Ghana it was two extra half-hour sessions a week on top of normal class.

So nobody has run the arm that would settle it: same extra time, same structure, same adult supervision, and no AI.

And notice why this matters for your budget. If most of that third of a standard deviation comes from the scheduled, supervised practice block, then you can run that block without buying anything at all. If it comes from the software, the licence is the cheapest ingredient in the recipe.

Those are opposite decisions, and today the evidence cannot separate them.

Why has nobody done it? An active control roughly doubles the cost of the study, and it answers a question that neither the vendors nor the implementing researchers are especially motivated to ask. In the meta-analysis I showed you, the researchers themselves implemented sixteen of the nineteen interventions.

Question two. Generative, or the previous generation, for the same content in the same time?

I showed you zero point zero two two earlier, and I owe you a clarification about what kind of number that is. It is a cross-study comparison — different trials, different populations, different subjects, different dosages — not a race between two systems.

The race has never been run. No study randomises students between a pre-language-model adaptive platform and a generative tutor teaching the same curriculum in the same amount of time.

And this is the actual purchasing decision on the table. The older, auditable, cheaper, non-conversational lineage benchmarks between about zero point one eight and zero point three seven of a standard deviation. That is not a weak competitor.

So today the choice between the two generations gets made on the strength of a demonstration, because the head-to-head number does not exist.

It is unanswered because it needs two production-grade systems built on identical content, which is expensive, and because it settles a comparison that no vendor wants to lose.

Question three, and it is the one I would most like someone in this room to answer. Is take-up itself the treatment?

Across these studies, how the tool enters the classroom tracks the outcome almost perfectly. Mandated, teacher-led, scheduled use gives you a quarter to a third of a standard deviation. Optional access gives you almost no use at all.

But that comparison runs across different tools, different subjects and different countries, so the integration mode is confounded with everything else.

Nobody has held the tool constant and randomised the policy: scheduled use inside class, against recommended optional access.

For a department, that is the question with money attached. It tells you whether putting a link in the syllabus is a real intervention or a placebo, and whether the scarce resource you should be protecting is not the software at all, but the timetabled hour in which students are actually required to use it.

It is unanswered partly through a blind spot — the field records usage as an implementation detail rather than designing it as the treatment — and partly because randomising timetable policy inside one school raises fairness objections that an after-school add-on quietly avoids.

And there is a fourth question I will mention only in passing, because it is the one that should embarrass all of us. The proposition that motivates this entire literature is that personalisation can be delivered at a fraction of the cost of human tutoring. Only two of the fourteen studies report per-student costs on a comparable basis. Human tutoring pools at around zero point two nine of a standard deviation, against zero point one two for the AI subgroup. Whether AI wins per dollar — which is the only frame in which a department actually decides — has essentially never been measured next to the effects it is meant to justify.

Let me close by applying this to my own work, because it is easy to give this talk and then not follow it.

We are building a small interactive tutor for intermediate microeconomics. Narrated explanation, a budget line the student can drag, ungraded questions, and a component that diagnoses misconceptions by name.

Reading this evidence changed three decisions.

The first: the tutor interrupts at points designed into the script, instead of waiting behind an open chat window. The largest deployed AI tutor in the world reports that most of its students simply never used the chat, and is now being rebuilt to be visible during the task.

The second: evidence obtained with help does not count towards mastery. If a student takes a hint, that attempt no longer counts, and we ask a fresh question instead.

I should be precise about where that rule comes from, because it would be easy to overclaim. The rule itself comes from the tutoring systems of the nineteen-nineties, where asking for a hint already invalidated the attempt. Bastani does not test that rule. What Bastani supplies is the modern warning that sent us looking for it.

The third, and the one I am least comfortable with: an unassisted check at the end of each concept. No grade, never presented to the student as an assessment, feeding only the instructor's diagnosis.

We added it for one reason. Without it, a tutor that produced exactly the result of that first experiment would look, in our own data, identical to an excellent one.

And to be honest about where we are: none of that is a result yet. It is a set of design decisions that follow from other people's evidence.

We have not run a trial. We do not know whether our tutor teaches anything.

What I can tell you is that we designed the instrument that would let us find out before we finished the thing it measures — and I would ask the same of anyone selling to us.

If you take one sentence away from this, I would like it to be this one.

The decisive advance is not a system that sounds more like a teacher.

It is a system that can tell you what it believes the student knows, why it chose the next step, when it ought to stay quiet, and — without being the judge of its own work — whether the student actually learned.

Thank you.
