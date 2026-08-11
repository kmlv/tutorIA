# T-006 — Research questions and citable references

- **Agent:** fable
- **Date:** 2026-08-11 (UTC)
- **Web access:** YES (WebFetch + WebSearch; primary PDFs downloaded and read page by page)
- **Stance:** default NOT-VERIFIABLE. Every research question below is quoted verbatim from
  the paper's abstract or introduction, seen directly. Where I could not see the words, I
  say so instead of paraphrasing from memory.
- **Scope note:** Bastani, Tutor CoPilot and Eedi/LearnLM numbers come from
  `coord/work/claude/T-002-carril-C-tutores-llm-juez.md` per the lead's instruction and were
  not re-verified; for those three I fetched only their abstracts to quote the research
  questions.

## Part 1 — One card per study, question first

Reading key for every card: **RQ** = the question the paper asked, in the paper's words.
**Contrast** = what the effect is measured against — the thing that gets lost when an
effect size is quoted alone. **Licenses / Does not license** = what a careful speaker may
and may not conclude.

---

### 1. Bastani et al. — the harm experiment (talk slides 2–4)

- **RQ (abstract, verbatim):** "A key question is how generative AI affects *learning* —
  namely, how humans acquire new skills as they perform tasks. … To understand the
  differential impact of tool design on learning, we deploy two generative AI tutors: one
  that mimics a standard ChatGPT interface ('GPT Base') and one with prompts designed to
  safeguard learning ('GPT Tutor')."
- **Contrast:** three arms — GPT Base vs GPT Tutor vs **practice with no technology**. The
  teacher's lecture and the final unassisted exam are identical across arms; only the
  practice block differs. Each exam problem is paired 1:1 with a near-identical practice
  problem (T-002).
- **Design:** ~1,000 high-school math students, Türkiye; practice-with-tool then
  unassisted exam immediately after; 2,848 student-session observations, clustered by
  classroom (T-002).
- **Licenses:** assisted performance and unassisted learning are empirically decoupled and
  can move in opposite directions (+48%/+127% during practice; −17%/≈0 on the exam).
  Guardrails removed the harm.
- **Does NOT license:** "AI damages learning in general" (GPT Tutor arm is the
  counterexample), nor "a safeguarded chatbot teaches" (its unassisted effect was ≈0, not
  positive). Outcome is immediate, one school, one course.
- **Cite:** Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R.
  (2025). Generative AI without guardrails can harm learning: Evidence from high school
  mathematics. *PNAS*, 122(26), e2422633122. https://doi.org/10.1073/pnas.2422633122 ·
  preprint: https://hamsabastani.github.io/education_llm.pdf
  Note: PNAS published a correction (https://doi.org/10.1073/pnas.2518204122); I have not
  read its content — worth one look before the talk if this study stays on slides 2–4.

### 2. Burneo et al. — the meta-analysis (slides 5–6)

- **RQ (abstract, verbatim):** "Adaptive educational technology promises the
  personalization of teaching at a fraction of its cost, but experimental estimates vary
  widely in magnitude and in sign, and existing syntheses predate generative AI. We
  conduct a systematic review and meta-analysis of randomized controlled trials, bringing
  computer-assisted learning platforms and generative AI tools into a common framework
  under common inclusion criteria and on a common effect-size scale."
- **Contrast:** included RCTs must evaluate an adaptive or AI-enabled intervention
  "against a pure control group receiving traditional instruction" (intro, verbatim). The
  GenAI-vs-adaptive differential (0.022 sd, SE 0.075) is a **cross-study moderator**, not
  a head-to-head trial: "the estimated differential is 0.022 sd with a standard error of
  0.075. That interval, spanning [−0.15, 0.19], is wide enough to accommodate an advantage
  as large as the pooled average effect, so it bounds the difference between generations
  rather than resolving it."
- **Design:** 191 effect sizes, 14 RCTs, 10 economies; robust variance estimation
  meta-regression; heterogeneity along seven moderators.
- **Licenses:** +0.125 sd pooled vs traditional instruction; +0.12 sd for the AI
  tutoring/instruction subgroup; "the experimental record to date shows no advantage for
  the newer technology." Also quotable: researchers implemented 16 of 19 interventions,
  none implemented by a government alone, no included study from a low-income country,
  only 2 of 14 report per-student costs; "in one intervention, 0.60 sd separates the
  largest and smallest estimates drawn from a single sample."
- **Does NOT license:** "the generations are equivalent" (the interval bounds, it does not
  resolve); subgroup readings as conclusive (authors: "suggestive rather than
  conclusive"); any claim about low-income settings **from this meta-analysis** (though
  see card 5 — a low-income-country RCT now exists outside it).
- **Cite:** Burneo, A., Dinarte-Diaz, L., Lopez, C., & Molina, E. (2026, August 1). Can
  EdTech Close Learning Gaps? Global Evidence from Digital Interventions. Background paper
  for the *World Development Report 2026*, World Bank. Working paper, not peer-reviewed.
  https://thedocs.worldbank.org/en/doc/2fba81cd6cd60d2f54532fc7062395fb-0050062026/original/Can-EdTech-Close-Learning-Gaps.pdf

### 3. Kestin et al. — AI tutor vs active learning (slides 7–8)

- **RQ (abstract, verbatim):** "Here we report a randomized, controlled trial measuring
  college students' learning and their perceptions when content is presented through an
  AI-powered tutor compared with an active learning class." The intro sharpens it:
  "…measure the difference between 1) how much students learn and 2) students'
  perceptions of the learning experience when identical material is presented through an
  AI tutor compared with an active learning classroom."
- **Contrast:** NOT "AI vs nothing" and NOT "AI vs lecture" — AI tutor vs **in-class
  active learning**, the strongest conventional benchmark, on **identical material** (same
  two lessons). This is what makes +0.63 sd interpretable: the AI arm beat the best
  ordinary practice, in less time (median 49 vs 60 assumed minutes).
- **Design:** N=194 undergraduates, large Harvard physics course, crossover (each student
  experiences both conditions across two lessons), unassisted test immediately after each
  lesson.
- **Licenses:** an expert-designed AI tutor — expert-written lessons, worked solutions,
  sequence enforced outside the model — outperformed active learning on two lessons, with
  the tool absent at test time.
- **Does NOT license:** "a chatbot gives you 0.6 sd." Two lessons, one elite university,
  immediate tests; the 0.73–1.3 range is a ceiling-effect quantile regression, not the
  headline. The recipe (expert content + enforced sequence) is part of the treatment.
- **Cite:** Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). AI
  tutoring outperforms in-class active learning: An RCT introducing a novel research-based
  design in an authentic educational setting. *Scientific Reports*, 15, 17458.
  https://doi.org/10.1038/s41598-025-97652-6

### 4. De Simone et al. — Nigeria after-school (slides 7–8)

- **RQ (abstract + intro, verbatim):** "This study evaluates the impact of a program
  leveraging large language models for virtual tutoring in secondary education in
  Nigeria." Intro: "This paper examines whether generative artificial intelligence,
  specifically large language models (LLMs), can help solve that problem" [large learning
  deficits with scarce teaching resources].
- **Contrast:** the control group "did not receive any intervention but continued their
  regular learning in the classroom" (verbatim). So +0.31 sd is the effect of the **whole
  package** — Copilot/GPT-4 **plus** twelve extra 90-minute teacher-guided sessions in a
  computer lab, working in pairs — against nothing extra, not the effect of the model.
- **Design:** 1,328 randomized (657 T / 671 C), 9 schools, Benin City; 12×90 min over 6
  weeks, after school; English-language outcome plus AI-knowledge and digital-skills
  components in the composite; endline right after. Attrition: 759 of 1,328 took the
  final test.
- **Licenses:** a cheap, structured, teacher-supervised GenAI program can move learning
  (+0.31 sd composite, +0.23 sd English) in a lower-middle-income setting.
- **Does NOT license:** attributing the effect to the AI rather than the added
  instructional time and supervision (no active-control arm); ignoring the heavy
  attrition; "0.24 in English" (it is 0.23).
- **Cite:** De Simone, M., Tiberti, F., Barron Rodriguez, M., Manolio, F., Mosuro, W., &
  Dikoru, E. J. (2025). From Chalkboards to Chatbots: Evaluating the Impact of Generative
  AI on Learning Outcomes in Nigeria. World Bank Policy Research Working Paper 11125.
  https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099548105192529324

### 5. LearnLM Team, Google & Fab AI — Sierra Leone (slides 7–8)

- **RQ (report, verbatim — it has an explicit "Research question" section):** "How does
  the teacher-led integration of Gemini's Guided Learning feature into mathematics classes
  in Sierra Leone junior secondary schools affect student learning outcomes?"
- **Contrast:** within each school and grade, half of the classrooms integrated Guided
  Learning into half their weekly lessons; control classrooms were instructed "to continue
  with standard mathematics instruction (i.e., without incorporating the Gemini app into
  their lessons)" (verbatim). Same teacher training in both arms. So the contrast is
  *lesson redesign around Gemini* vs *business-as-usual lessons* — at constant total math
  time, unlike Nigeria.
- **Design:** preregistered (AEARCTR-0016651), N=1,763 students, grades 7–8, 48 classrooms
  in 12 schools, Port Loko District; classroom-level clustered randomization; 8 weeks
  (12 requested hours); independent IRT-scored assessments by Oxford MeasurEd, examiner
  blind to assignment.
- **Licenses:** ITT +0.258 sd (95% CI [0.027, 0.488], p=0.029). **Update to my first
  pass:** the ToT +0.380 sd (p=0.029) IS textual in the May-2026 report — I have now seen
  it — so the talk may cite it if labeled as treatment-on-the-treated for students
  reaching the 12-hour threshold (69.0% did). Uptake itself is a result: 69% vs the ~5%
  voluntary take-up the report cites as typical for such tools.
- **Does NOT license:** treating it as peer-reviewed (it is a provider report, © Google,
  authors include the vendor); ignoring that students with stronger baselines gained more
  (+0.195 sd per baseline sd — textual); model changed mid-trial (Gemini 2.5 Pro → 3.0
  Pro).
- **Cite:** LearnLM Team, Google & Fab AI (2026, May 15). Teaching with Gemini: Measuring
  the impact of Guided Learning on student mathematics progress in Sierra Leone. Technical
  report. https://storage.googleapis.com/deepmind-media/LearnLM/learnLM_sierraleone_may26.pdf
  · summary: https://deepmind.google/blog/measuring-the-impact-of-learning-with-ai-in-sierra-leone-and-beyond/

### 6. Robinson et al. — the take-up null (slides 7 and 9) — ⚠ read the contrast carefully

- **RQ (intro, verbatim):** "This study examines a model near the midpoint of this
  spectrum: an engaged, in-person human tutor whose role is to support student engagement
  with an AI literacy tutor, not to deliver direct instruction."
- **Contrast:** **both arms had access to the AI platform.** Students were "assigned to
  use an AI literacy platform independently or with an in-person tutor focused on
  engagement, not direct instruction" (abstract, verbatim). The randomized null is on
  *adding human engagement support*, not on *access vs no access*. The famous
  access-is-not-enough finding — "nearly half of students in the control group never used
  the platform, and those who did averaged only 2-5 minutes per week" — is a
  **descriptive** fact about the access-only arm, not a randomized comparison against a
  no-AI group.
- **Design:** two RCTs, ~350 elementary students (per the NSSA study record; the abstract
  gives no N), dedicated session time; outcomes: platform usage, engagement, reading
  achievement.
- **Licenses:** human support raised usage by 1 to 4 minutes/week and engagement by
  71–80%, "the intervention did not improve reading achievement" (verbatim); relative
  percentages can advertise what absolute minutes expose.
- **Does NOT license:** "access to an AI tutor produced zero learning" as an experimental
  result — this design cannot estimate access-vs-nothing on achievement, because there is
  no no-AI arm. [suggestion] for claude: slide 7's row "Access to a reading tutor ≈ 0" and
  slide 9's framing lean on the randomized null, which is about *added human support*; one
  clause ("both groups had licences; the trial tested support on top") makes both slides
  exact.
- **Cite:** Robinson, C. D., Gormley, D., Trindade Ribeiro, A., & Loeb, S. (2026). Access
  is Not Enough: Human Support Improves Engagement with AI Tutoring. EdWorkingPaper
  No. 26-1451, Annenberg Institute at Brown University. Version June 2026.
  https://doi.org/10.26300/pz7p-p388 · PDF: https://nssa.stanford.edu/sites/default/files/ai26-1451.pdf

### 7. Muralidharan, Singh & Ganimian — Mindspark, the pre-LLM benchmark

- **RQ (abstract, verbatim):** "We study the impact of a personalized technology-aided
  after-school instruction program in middle-school grades in urban India using a lottery
  that provided winners with free access to the program."
- **Contrast:** lottery winners (free access to the after-school Mindspark program) vs
  lottery losers (no access, regular schooling). Again a package: the program bundles
  adaptive software with scheduled after-school sessions.
- **Design:** middle-school students, urban India (Delhi); 4.5 months; independent math
  and Hindi tests. IV estimate: 90 days of attendance → +0.6 sd math.
- **Licenses:** +0.37 sd math, +0.23 sd Hindi in 4.5 months from **pre-LLM** adaptive
  technology — the benchmark the generative generation has not demonstrably beaten
  (card 2). Similar absolute gains for all, larger relative gains for weaker students.
- **Does NOT license:** anything about generative AI — there is no LLM here. That is
  precisely its role in the talk.
- **Cite:** Muralidharan, K., Singh, A., & Ganimian, A. J. (2019). Disrupting Education?
  Experimental Evidence on Technology-Aided Instruction in India. *American Economic
  Review*, 109(4), 1426–1460. https://doi.org/10.1257/aer.20171112

### 8. Henkel et al. — Rori in Ghana

- **RQ (abstract, verbatim):** "This study evaluates the impact of Rori, an AI powered
  conversational math tutor accessible via WhatsApp, on the math performance of
  approximately 1,000 students in grades 3-9 across 11 schools in Ghana."
- **Contrast:** "the students in the control group continued their regular math
  instruction, while students in the treatment group engaged with Rori, for two 30-minute
  sessions per week over 8 months **in addition to** regular math instruction" (verbatim;
  emphasis mine — extra time again).
- **Design:** ~1,000 students, 11 schools, **assignment at school level** (very few
  clusters); 8 months; math growth scores.
- **Licenses:** d=0.36–0.37, statistically significant, on basic phones over low-bandwidth
  networks — the access story matters for LMICs. Authors' own caveat, verbatim: "the
  results should be interpreted judiciously, as they only report on year 1."
- **Does NOT license:** treating it as confirmatory — preprint, school-level assignment
  with 11 units, added instructional time uncontrolled.
- **Cite:** Henkel, O., Horne-Robinson, H., Kozhakhmetova, N., & Lee, A. (2024). Effective
  and Scalable Math Support: Evidence on the Impact of an AI-Tutor on Math Achievement in
  Ghana. arXiv:2402.09809. https://arxiv.org/abs/2402.09809

### 9. Roschelle et al. — ASSISTments, the other pre-LLM benchmark

- **RQ (Research Design section, verbatim — the paper states it as a question):** "Do
  students in schools that use ASSISTments for mathematics homework learn more than
  students in schools who do homework without ASSISTments?"
- **Contrast:** schools randomized to ASSISTments (online homework with immediate feedback
  + teacher training) vs "a business-as-usual condition" — existing homework practices.
  The treatment explicitly includes teacher professional development, not just software.
- **Design:** 2,850 seventh-graders, 43 schools, Maine, one full school year; outcome:
  end-of-year standardized mathematics assessment.
- **Licenses:** g=0.18 at state scale over a full year, from formative-assessment
  technology with teacher training; students with low prior achievement benefited most.
- **Does NOT license:** claims about chatbots (no LLM); the effect includes the teacher
  training; Maine's one-laptop-per-student policy is part of the context.
- **Cite:** Roschelle, J., Feng, M., Murphy, R. F., & Mason, C. A. (2016). Online
  Mathematics Homework Increases Student Achievement. *AERA Open*, 2(4), 1–12.
  https://doi.org/10.1177/2332858416673968 · PDF: https://files.eric.ed.gov/fulltext/EJ1194398.pdf

### 10. Wang et al. — Tutor CoPilot (numbers from T-002, not re-verified)

- **RQ (abstract, verbatim):** "…in education, training novice educators with expert
  guidance is important for effectiveness but expensive, creating significant barriers to
  improving education quality at scale. … We introduce Tutor CoPilot, a novel Human-AI
  approach that leverages a model of expert thinking to provide expert-like guidance to
  tutors as they tutor." The question is whether AI can scale *expert guidance to human
  tutors* — the LLM never talks to the student.
- **Contrast:** tutors randomized to access vs no access to Tutor CoPilot; students of
  those tutors compared on passing the platform's exit ticket.
- **Design:** preregistered (OSF); 900 tutors, ~1,800 K-12 students (abstract; T-002's
  detailed count: 1,787), Title I schools, grades 3–8; ITT on exit-ticket pass.
- **Licenses:** +4 p.p. ITT (62%→66%) on the proximal outcome; helps the
  lowest-rated tutors most; a closed menu of 7 human-chosen strategies is a workable
  human-AI division of labor.
- **Does NOT license:** learning gains — per T-002, the distal standardized test was null;
  the significant effect is on the platform's own progression gate.
- **Cite:** Wang, R. E., Ribeiro, A. T., Robinson, C. D., Loeb, S., & Demszky, D. (2024).
  Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise. arXiv:2410.03017.
  https://arxiv.org/abs/2410.03017 · preregistration: https://osf.io/8d6ha

### 11. LearnLM Team & Eedi — supervised AI tutoring RCT (numbers from T-002, not re-verified)

- **RQ (abstract, verbatim):** "One-to-one tutoring is widely considered the gold standard
  for personalized education, yet it remains prohibitively expensive to scale. To evaluate
  whether generative AI might help expand access to this resource, we conducted an
  exploratory randomized controlled trial (RCT) with N = 165 students across five UK
  secondary schools."
- **Contrast:** two-level design — students randomized to static support (pre-written
  hints) vs live 1:1 chat tutoring; within tutoring, sessions randomized to *human tutor
  alone* vs *LearnLM drafting every message under human supervision*, "with the remit to
  revise each message it drafted until they would be satisfied sending it themselves"
  (verbatim). The AI-vs-human comparison is supervised-AI vs human, never autonomous-AI
  vs human.
- **Design:** N=165, Years 9–10 (ages 13–15), five UK schools, May–June 2025, Eedi
  mathematics platform; outcomes: immediate remediation and novel-problem success.
- **Licenses:** supervised LearnLM matched human tutors (remediation 93.0% vs 91.2%,
  overlapping CIs — T-002 calls it a tie); tutors approved 76.4% of drafts with zero or
  minimal edits; abstract highlights +5.5 p.p. on novel problems (66.2% vs 60.7%).
- **Does NOT license:** autonomous AI tutoring efficacy (a human vetted every message);
  confirmatory claims — the authors label it exploratory, N=165, and author list includes
  the vendor (Google) and the platform (Eedi).
- **Cite:** LearnLM Team, Google, & Eedi (2025). AI tutoring can safely and effectively
  support students: An exploratory RCT in UK classrooms. arXiv:2512.23633.
  https://arxiv.org/abs/2512.23633

---

## Part 2 — The questions nobody has answered

Criterion applied: a question earns a slot only if (a) no study in the record above
answers it, (b) an answer would change what a professor does next semester, and (c) I can
say *why* it is unanswered. "We need more longitudinal studies" does not qualify.

### Q1. Does the model add anything beyond the package it ships in?

**The gap.** Every large positive effect in this record is a bundle — AI **plus** extra
scheduled time, structure, and adult attention — measured against a control that got no
extra anything. Nigeria's control "did not receive any intervention" while treatment got
18 extra hours of supervised lab sessions. Rori added two 30-minute sessions "in addition
to regular math instruction." Mindspark was an entire after-school program vs no program.
**No trial has an active-control arm: same extra time, same structure, same adult
supervision, no AI.** The closest exceptions prove the point: Kestin's control IS active
(same material, comparable time) — and that equal-footing design has only ever run for
two lessons; Sierra Leone holds total class time constant but redesigns the lesson around
the app, so pedagogy and tool move together.

**Why it would change a professor's next semester.** If most of the +0.3 sd comes from
the scheduled, supervised practice block, a professor can run that block without buying
anything. If it comes from the AI, the license is the cheapest ingredient. These lead to
opposite budget decisions, and today the evidence cannot separate them.

**Why unanswered.** An active-control arm roughly doubles implementation cost and answers
a question neither vendors nor implementing researchers are motivated to ask — per
Burneo, researchers were involved in implementing 16 of the 19 interventions reviewed.
The question is well-posed; it is simply unbought.

### Q2. Generative vs previous-generation adaptive, same content, same time — the direct trial does not exist

**The gap.** The talk's headline number (0.022 sd, SE 0.075) is a *cross-study* moderator
estimate: it compares different trials with different populations, subjects, and dosages,
and its interval "bounds the difference between generations rather than resolving it"
(Burneo, verbatim). **No study randomizes students between a pre-LLM adaptive platform
and a generative tutor delivering the same curriculum in the same time.** As long as that
trial does not exist, the generation question is empirically open in both directions.

**Why it would change a professor's next semester.** This is the actual procurement
decision on the table: license the auditable, cheaper, non-conversational adaptive system
(the Mindspark/ASSISTments lineage, benchmark +0.18 to +0.37 sd) or the chatbot. Today
that choice is made on demos, because the head-to-head number does not exist.

**Why unanswered.** It requires two production-grade systems built on identical content —
expensive, and it adjudicates a comparison no vendor wants to lose. Meta-analysts can
only synthesize what exists (Burneo fixed the synthesis, not the missing experiment).

### Q3. Is take-up a treatment? Nobody has randomized *how* the same tool enters the classroom

**The gap.** Across studies, integration mode tracks outcomes almost perfectly: mandated,
teacher-led, scheduled use yields +0.26 to +0.31 sd and 69% uptake (Sierra Leone,
Nigeria); optional access yields near-zero use — half of Robinson's access-only arm never
opened the platform; the typical voluntary take-up rate the Sierra Leone report cites is
~5%. But that comparison runs **across different tools, subjects and countries** —
integration mode is confounded with everything. Robinson is the nearest randomized
attempt, and it randomized the wrong lever for our question (adding human engagement
support moved usage 1–4 min/week, reading not at all). **No trial holds the tool constant
and randomizes the integration policy: scheduled in-class use vs recommended optional
access.**

**Why it would change a professor's next semester.** It answers whether "I put a link in
the syllabus" is a real intervention or a placebo, and whether the scarce resource to
plan is not the tool but the protected, scheduled time in which students must use it. It
also tells administrators whether buying licenses without timetable changes is spending
zero, which the descriptive evidence strongly suggests but no experiment has shown.

**Why unanswered.** Partly a blind spot: the field logs usage as an implementation
covariate instead of designing it as the treatment. Partly practical: randomizing
schedule policy inside one school raises fairness and logistics objections that
after-school add-ons conveniently avoid.

### Q4 (brief). The cost question the whole literature claims as its motivation

Only 2 of 14 studies report per-student costs on a comparable basis. Burneo, verbatim:
"the proposition that motivates the entire literature, that personalization can be
delivered at a fraction of the cost of human tutoring, has almost never been measured
alongside the effects it is meant to justify." Human tutoring pools ~0.288 sd (Nickow et
al., as cited in Burneo) vs 0.12 sd for the AI subgroup: whether AI wins *per dollar* —
the only frame in which a department actually decides — is unmeasured. Unanswered because
cost accounting is unglamorous and researcher-run pilots have no market prices.

### Considered and set aside

- **Retention after weeks/months without the tool** — real gap (every outcome above is
  immediate or end-of-program) but it is the classic wish-list item; it sharpens into Q1:
  an active-control design with a delayed test answers both.
- **"Nothing from low-income countries"** — true of the meta-analysis's inclusion set,
  verbatim, but Sierra Leone (low-income) now has a preregistered RCT, so the flat claim
  is no longer safe outside the sentence about Burneo's sample.

## Deltas vs my first pass (for claude)

1. **Sierra Leone ToT +0.380 is textual** in the May-2026 report (abstract and Dosage
   section, p=0.029). My first pass marked it unverified; that is now resolved. The talk
   may cite it *as ToT at the 12-hour threshold, provider report* — or keep only the ITT,
   which remains the conservative choice.
2. **[suggestion] Robinson framing (slides 7 and 9):** both arms had platform access; the
   randomized null is about added human support, and the "access ≈ 0" story is descriptive
   (control-arm usage), not experimental. One clause fixes it — see card 6.
3. **Bastani now cites cleanly:** PNAS 122(26) e2422633122 (2025), instead of the personal
   -site PDF; a published correction exists that I have not read.
4. **Eedi/LearnLM RCT is citable:** arXiv:2512.23633 (Dec 2025) — the thing T-002
   described now has a stable identifier.
5. **Tutor CoPilot N:** the abstract says ~1,800 students; T-002's 1,787 is the detailed
   count. Either is defensible; do not mix them on one slide.
