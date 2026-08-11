This is a census, not a review of evidence.

A system does not need a randomised trial to be here. What it needs is a mechanism worth stealing.

I looked at four families, kept twenty systems, and read each one with a single question: what does it do inside that we could use?

Four lanes, run in parallel and kept disjoint so nothing was researched twice.

The entry rule was mechanism sophistication, not scale. A product with a hundred million users and a trivial mechanism does not make the cut. A small project with one excellent engineering idea does.

Twenty-six screenshots, taken with a headless browser and deep links that land inside the mechanism rather than on the marketing page.

One limit I want to state at the top: no accounts were created and nothing was logged into. Everything behind a registration wall is described from the vendor's own documentation, not from what I saw on screen.

Here is the finding that dominates the whole census, and it was not what I expected.

The systems with the deepest engineering are not generative.

MATHia, ALEKS, the Desmos Computation Layer, PhET, Polypad, CODAP, NetLogo, Smart Sparrow. Not one of them uses generative AI in its pedagogical core.

And this is not a case of them being late. The next slide is the one that proves it.

CENTURY did adopt generative AI. And they put it deliberately outside the decision path.

They use it to generate printable worksheets. Their own documentation admits mathematics is excluded, for reliability.

Meanwhile the Recommended Path — the thing that decides what the student studies next — does not touch it.

So the split the serious systems chose in twenty twenty-six is: generative at the surface, deterministic at the decision.

I will come back at the end to what that means for us, because our judge sits on the decision side.

Four patterns turned up across the lanes. This is the first and the most useful.

The AI picks from a closed menu. It does not invent the pedagogical move.

Amira chooses among roughly sixty micro-interventions written by reading scientists. Tutor CoPilot has seven strategies. Khanmigo injects hints and a worked solution written by hand for that specific exercise. In the Eedi trial, a human approves every message before it is sent. In SchoolAI, the teacher fixes the boundaries before the student even enters.

Five systems that did not copy each other. The generative freedom is used to deliver the intervention, never to choose it.

Pattern two, and it is the cleanest convergence in the whole inventory.

Teacher authority is an architectural layer, not a reports page.

In CENTURY the model's prediction does not execute directly. It passes through policy rules, and what the teacher pins takes precedence and stays visible in the trace.

ALEKS lets the instructor request a knowledge check for one specific student. MATHia's risk alert shows the signals that triggered it, not just the alert. Smart Sparrow versions its authored rules with a preview before publishing. Cognii keeps a literal replay of any exchange so the teacher can review it.

For us that changes something concrete, and I will come back to it.

Pattern three comes from the manipulables lane, and it reframed how I read all of them.

The sophistication is in the constraint engine, not the drawing.

Every first-division manipulable removes one specific kind of friction, so the student's attention lands on the relationship being taught instead of on the interface.

Polypad absorbs motor friction: the pieces snap because they know, semantically, what they are. CODAP absorbs "which row is this point", by sharing one selection across table, map and plot. Observable absorbs the question of whether you ran the cells in order. PhET absorbs "what am I allowed to do here".

None of that is visible as a feature. All of it is why they feel good.

Pattern four, and it is the census's only real answer to the question of what concept number twenty costs.

The authoring model decides whether the system scales.

PhET is closed and very expensive. Each simulation needs a software team, an instructional designer, and weeks of testing with actual students. There is no visual authoring tool.

Desmos is hybrid, and it is the only model here that solves both sides. Expensive official content, plus an activity builder with a real scripting layer, open and free to any teacher.

And in the adaptive tutors, the teacher can sequence but cannot edit the knowledge model that governs the adaptation. That is a ceiling worth noticing before adopting one.

Now the four families, and the systems themselves.

First, manipulables and simulations. Six systems, none of which uses generative AI, and all of which are heavier in engineering than they look.

What you are seeing is PhET's graphing lines simulation, reached with a deep link that goes straight into the manipulable. The landing page only shows a menu.

Look at what it does: the equation and the graph are coupled. Change the fraction in the equation and the line moves; drag the point and the equation updates. That coupling is the whole lesson, and it is exactly the thing we are building for the budget line.

PhET, from the University of Colorado, is the reference point for the whole family.

Two mechanisms worth taking. The first is implicit scaffolding: they restrict the degrees of freedom so that the productive action is visually obvious, and the student needs no instructions.

The second is the one I did not know about. They maintain a parallel tree in the document that mirrors the visual scene. That is what gives them screen reader navigation and sonification of physical values.

Accessibility is not bolted on at PhET. It is the reason the architecture looks the way it does. And it is the direct prior art for the textual alternative to a manipulable graph that our own accessibility decision requires.

Desmos is the one I would study hardest if we only had time for one.

The Computation Layer is a reactive, purely functional scripting language. Every component on screen exposes what they call sinks and sources, and the author wires the output of one into the input of another. No loops, no mutable state to get wrong.

That is the abstraction that lets a teacher who does not program build something with the same interactivity as the in-house team.

And two classroom mechanisms worth copying on their own: pacing, which holds students on a given screen, and anonymize, which lets a teacher project the class's answers without exposing anybody.

Two more from the same family, both of them constraint engines you can feel.

Polypad's pieces have semantic and topological awareness of each other. Fraction blocks arrange themselves into a circle. Polygons snap along compatible edges. Algebra tiles tip a virtual balance according to the equations they represent. The engine absorbs all the motor friction so the student's attention lands on the mathematical relationship.

CODAP does the same thing for data. One shared selection state across a table, a map and a plot. Drag a box over a cluster of points and the exact rows light up everywhere else. It lets a student reason about a dataset without writing a line of code.

Two reactive engines to close the family.

Observable builds a dependency graph out of your code. In an ordinary notebook the state depends on the arbitrary order in which you ran the cells, which is where hidden errors live. Here, change a variable and everything downstream re-evaluates, like a spreadsheet. That is the right engine for an explorable with no latency.

NetLogo takes a different route. You write the rule for a single wolf, and the engine runs thousands of them and plots the population dynamics live. It collapses the distance between the micro rule and the macro effect, which is a very hard thing to teach any other way.

One honest note on that capture: it is before pressing setup, so the canvas is black.

Second family: the adaptive tutors, and this is the tradition that has been doing our job for thirty years.

MATHia keeps a mastery probability per skill, but the mechanism worth taking is what sits on top. A contextual risk detector that alerts not when the probability is low, but when this student has reached a point where historical cohorts had already mastered that skill. And crucially, the alert shows the teacher the signals that fired it.

ALEKS represents the domain as a family of feasible knowledge states, and teaches at what they call the outer fringe — the topics immediately reachable from where the student actually is. Its knowledge checks can send a topic you had already learned back to practice, which is an honesty most systems avoid.

Cognii is the system in this census closest to what our judge is supposed to do.

It turns a free-text answer into concepts present, concepts absent, and concepts partially expressed. Not into a score. That difference is what generates the coaching response, and the whole exchange stays as auditable evidence a teacher can replay.

If you take one thing from this slide: the unit that feeds mastery should not be "the model said zero point seven two". It should be the list of expected concepts, the list observed, and what is missing.

And I kept Smart Sparrow in even though it is dead and absorbed by Pearson, because its idea is alive: authorable pedagogical rules over rich telemetry, versioned, with a preview before you publish.

Third family: the systems whose reason for existing is generative AI.

Khanmigo is the only one at scale whose internals its own engineers have documented, and there are three pieces worth taking.

First, arithmetic leaves the model. They built a calculator rather than trusting prediction.

Second, they inject authorised context before it answers — the hints and the worked solution that a human wrote for that specific exercise. The model does not improvise the pedagogy of the item; it reads it.

Third, and this is the subtle one: a hidden block where the model enumerates the plausible derivations that could have led the student to what they wrote, before choosing the visible move. Reasoning is private and tool-assisted. Answering is public and socratic.

Two more from that family, with very different mechanisms.

NotebookLM's is the best-resolved anti-hallucination design in the census. It answers only about the sources you upload, and every claim carries a citation that takes you to the exact span in your own document. It is not that the model tries not to hallucinate. It is that the answer is useless unless it can point at the source, and the interface makes that visible.

That is the pattern our judge needs: justify a diagnosis by citing the fragment of the student's answer that supports it.

Amira takes a different route entirely. Its diagnosis comes from a modality that is not written text — it listens to a child read aloud and detects the specific miscue. Then it selects from a library of micro-interventions written by reading scientists. The error is observed, not inferred from a final answer.

The fourth family is the adjacent markets — languages, coding, corporate, professional simulation. Only three slots, and they were chosen on mechanism rather than fame.

Duolingo models recall as a function of time and item difficulty, and keeps its generative features inside a fixed sequence rather than letting them drive it.

Speak treats pronunciation recognition as continuous diagnosis, so the assessment is the activity rather than something bolted on the end.

And SimConverse simulates clinical conversations with structured assessment of professional performance. It got the slot over any large corporate platform, on mechanism alone. That is the criterion working as intended.

So what do we take from all of this. Five things, and I want to be clear that none of them is a finding from a paper. They are my readings of the census.

One. The judge passes through rules before it acts. Copy CENTURY's split: the prediction feeds policy rules, and what the teacher pins takes precedence and stays in the trace.

Two. Store the diagnosis as concepts, not as a score. Expected, observed, missing.

Three. Remediation is a closed menu. The four actions in our brief are the repertoire, and the model selects among them rather than inventing.

Four. Every piece of evidence must be replayable, with the signal that triggered the decision visible to the teacher.

Five. Authoring is the strategic decision, not the renderer.

And I want to end on the uncomfortable one, because it is the reason this census was worth doing.

Our judge sits on the decision side. Which is exactly where this inventory says almost nobody puts a generative model.

That does not make it wrong. It makes it a deliberate departure. The field's answer in twenty twenty-six is generative at the surface, deterministic at the decision.

So if we are going to cross that line, we should cross it knowing that we are crossing it — and we should be the ones who measure whether it worked.
