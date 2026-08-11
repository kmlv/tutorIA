I want to start with an experiment that should make all of us a little uncomfortable.

Then I will give you the honest number for whether any of this works.

And I will finish with the questions I would ask before letting one of these tools near my students.

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

And here is the practical consequence for anyone choosing software. If you evaluate a tool by watching students use it, you will systematically prefer the tools that do the most work for them.

The better the demonstration feels, the more suspicious you should be.

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

And trials that simply gave students access to an AI reading tutor found essentially nothing.

Same broad technology. Completely different outcomes. So the interesting question is not whether AI works. It is what distinguishes the top row from the bottom one.

Look at what produced the large effects and the same pattern appears every time.

The physics result used lessons designed by subject experts, with worked solutions prepared in advance, and a sequence the platform imposed from outside the model.

That detail deserves a moment. The researchers reported that the prompt alone could not hold the teaching sequence reliably, so they moved the sequence out of the prompt and into the software around it.

The Nigerian programme was after-school sessions, with additional instructional time, teachers present, and students working in pairs.

Sierra Leone was ordinary classes, led by teachers who set the objectives.

Every large effect in this literature is a package: verified content, an enforced sequence, protected time, and people.

Which means copying the brand does not reproduce the treatment. And copying the prompt does not reproduce it either.

The most useful result in this area is a null one, and it is the least discussed.

Two randomised trials gave primary school students access to an AI reading tutor, and added human support on top.

Engagement rose by between seventy-one and eighty per cent.

That is the number that would appear in the slide deck. Now here is the same result in absolute terms.

Average use went up by one to four minutes per week.

And reading did not improve at all.

I find this the most clarifying pair of numbers in the whole literature, because both are true and they tell opposite stories.

A relative increase in engagement of eighty per cent sounds like adoption. One to four minutes a week is not a dose of anything.

So keep this one in your pocket for the next time someone proposes buying licences for everybody. A system nobody opens has no effect, and take-up is not an implementation detail. It is part of the treatment, and it has to be planned and measured like one.

If the effects come from packages, it is worth asking what a package actually contains.

The conversation is the surface. It is the part you see in a demonstration, and it is the easiest part to build.

Underneath, a serious system needs a map of the subject, with prerequisites and worked solutions.

It needs a structured estimate of what this particular student knows. Not a conversation history — an actual state, that can be inspected.

That distinction is worth making concrete, because it is where most products quietly fail.

A chat history says: this student asked about the budget constraint twice and seemed confused.

A learner model says: this student can compute the slope, cannot interpret it as an opportunity cost, has not demonstrated the feasible set at all, and the last two pieces of evidence came with hints, so they do not count.

The first is a transcript. The second is something a teacher can read, disagree with, and correct.

It needs an explicit policy for what to do next, and a reason for choosing it.

It needs tools that calculate and verify, sitting outside the model that does the talking.

It needs limits on what it is willing to reveal, and support that withdraws as the student improves.

And it needs a teacher who can see what it believes and overrule it, plus a way of measuring itself that is not its own opinion.

The word personalized is doing a great deal of unearned work in this field, so it helps to break it into four levels.

Level one changes presentation: tone, language, length, reading level.

Level two changes the interaction: which example, which hint, which question comes next in this turn.

Most products stop there, and both levels are genuinely useful for access.

Level three chooses the next action based on a diagnosis of what this student got wrong, and why.

Level four maintains a trajectory across sessions, tracking prerequisites, forgetting and transfer.

Three and four are where the learning effects live, and they remain rare.

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

Let me close by applying this to my own work, because it is easy to give this talk and then not follow it.

We are building a small interactive tutor for intermediate microeconomics. Narrated explanation, a budget line the student can drag, ungraded questions, and a component that diagnoses misconceptions by name.

Reading this evidence changed three decisions.

The first: the tutor interrupts at points designed into the script, instead of waiting behind an open chat window. The largest deployed AI tutor in the world reports that most of its students simply never used the chat, and is now being rebuilt to be visible during the task.

The second: evidence obtained with help does not count towards mastery. If a student takes a hint, that attempt no longer counts, and we ask a fresh question instead. That rule comes straight from the tutoring systems of the nineteen-nineties, and the first experiment I showed you is the modern proof that it still matters.

The third, and the one I am least comfortable with: an unassisted check at the end of each concept. No grade, never presented to the student as an assessment, feeding only the instructor's diagnosis.

We added it for one reason. Without it, a tutor that produced exactly the result of that first experiment would look, in our own data, identical to an excellent one.

And to be honest about where we are: none of that is a result yet. It is a set of design decisions that follow from other people's evidence.

We have not run a trial. We do not know whether our tutor teaches anything.

What I can tell you is that we built the instrument that would let us find out, before we built the thing it measures — and I would ask the same of anyone selling to us.

If you take one sentence away from this, I would like it to be this one.

The decisive advance is not a system that sounds more like a teacher.

It is a system that can tell you what it believes the student knows, why it chose the next step, when it ought to stay quiet, and — without being the judge of its own work — whether the student actually learned.

Thank you.
