<!-- Generado por un panel de diseno: 4 propuestas independientes, cada una juzgada
por 3 lectores con criterios distintos (validez del estadistico, experiencia del alumno,
construible sobre lo que existe), y una sintesis desde la ganadora injertando lo que los
jueces marcaron como rescatable de las perdedoras.
Ranking: RAP 5.7 · Recipe-Trap 5.0 · Cold Open 4.7 · Handoff 4.3 sobre 10.

REVISADO POR CLAUDE contra el repo. Dos afirmaciones del documento sobre el codigo:
  - "remediation_for elige la sonda alfabeticamente y puede quedar fuera de la sub-skill"
    -> FALSA. `state.compute` ya filtra con `set(s.misconceptions)`, asi que la sonda
    siempre pertenece a la sub-skill. El filtro on-target que propone es correcto para
    ELEGIR EL NUDGE de RNP, no para arreglar la remediacion, que no esta rota.
  - "_fill_templates no sustituye en `opciones`" -> CIERTA. No era un fallo vivo (ninguna
    opcion usaba plantilla) pero si una trampa. Ya cerrada: el loader sustituye tambien
    en `opciones` y el validador rechaza cualquier plantilla desconocida.

NO IMPLEMENTADO todavia. Esto es la especificacion, no el codigo. -->

# D-1 SPEC — Randomized Nudge Pairing (RNP)

Grounded against the repo at `/Users/klopezva/GithubRepos/tutorIA` on branch `Kristian1`. Every file path and code claim below was checked.

---

## 1. The decision

We build **RNP**: the tutor volunteers a short conceptual nudge before exactly one item of every matched pair of practice items, the order within the pair is decided by a seeded coin flip, and the whole assignment (seed, order, both item ids) is written to the append-only event log. Nothing is added at the end of the lesson, nothing is withheld, the chat dock stays live and identical in both conditions, and no new item is ever presented to the student. We **reject** the three losing designs outright: Recipe-Trap's `probes.yaml` (its axis-swap probe requires surgery on `budget_graph.ts` / `manip.ts` / `ledger/goods.ts` and its closing beat is two un-remediated failures immediately before the close screen), Cold Open's next-session ritual (there is exactly one pack on disk, so the serving half cannot be exercised at all, and it withdraws the chat, which is the loudest possible test cue), and The Handoff's re-parameterised transfer example (`_fill_templates` in `app/server/core/content/loader.py:82` substitutes **numbers only, into `enunciado` and `key_points` only** — it never touches `opciones`, and `bien_1`/`bien_2` are never substituted anywhere, so "the bank is already parameterised" is false for 16 of 21 items). We also reject RAP's own headline: `carry` is demoted from estimand to diagnostic, and the `mastery_may_be_scaffold_carried` flag is **cut entirely** — its `OR p_solo < 0.5` branch is a regression-to-the-mean detector reading raw accuracy conditional on a streak selected for success, and at 3-4 pairs it would fire on noise into an instructor's queue. What we promote instead is the estimand the judges found hiding inside the block structure: **whether help transferred to an item the tutor did not touch**, identified by the randomized position of the solo item within its pair.

Two hard rules govern everything below. **It is not an exam**: no new items, no closing phase, no withheld help, no changed feedback, no score shown, no words for test/check/assessment anywhere in the student-facing strings. **It does not feed mastery**: the readout is a pure downstream function of the log, imported by nothing in `state.py` or `select.py`'s scoring path, and it writes no `flags` row. There is exactly one channel through which RNP touches the mastery record — push rows are logged `con_andamiaje = 1`, which is honest logging of real assistance, not a leak — and §2 gives the proof that it cannot make mastery unreachable.

---

## 2. The mechanism

### What the student experiences

During practice, the tutor sometimes says one sentence before the question and sometimes goes straight to the question. That is the entire difference. The chat is open in both cases, remediation fires normally after a wrong answer in both cases, feedback is byte-identical in both cases, and nothing is appended to the end of the lesson. There is no banner, no label, no announcement, no debrief. A student who dislikes the nudge can ignore it; a student who wants more can open the chat, in either condition.

**We do not disclose the arms, and we reject the Handoff's up-front disclosure graft.** Disclosure is owed when something is withheld or measured under withdrawn help; here nothing is withheld, no item is scored differently, and telling the student "sometimes I nudge first" would make the nudge salient and change exactly the behaviour we are measuring. The half of that graft that survives is unrelated to D-1 and should ship anyway: the intro should say once that the instructor sees a summary, because that is already true of the whole product.

### What the system does

**Step 1 — Pairing layer.** A new wrapper above `next_question` in `app/server/core/mastery/select.py`. The existing selector keeps its pedagogical logic untouched; the layer only decides whether the item it returned opens or closes a block. When the selector returns a non-remediation item `q1` for sub-skill `s` (`Choice.reason` contains no `R1`–`R4` marker and `remediation_for` returned `None`), and no block is open for `s`, the layer searches for a partner `q2` in `pack.questions` with:

- `q2.subskill_primary == s`
- `q2.grader == q1.grader` (in practice this means both deterministic — see §6)
- `not q2.prediction` and `not q2.andamiaje`
- unseen this session, and `q2.id != q1.id`
- an **on-target nudge exists** for both `q1` and `q2` (step 2)
- preference order: `|tier(q1) − tier(q2)| ≤ 1` first, then `≤ 2`, then any tier; the chosen `Δtier` is logged

If a partner is found, `{q1, q2}` is a **block** with `pair_id = f"{session_id}:{s}:{block_index}"`. If not, `q1` is served with `assist_arm = 'na'`, `pair_id = NULL`, **no nudge**, and it never enters any statistic.

**Step 2 — Which nudge (repairs the off-target-probe fatal).** The probe for an item is chosen by relevance, not alphabetically:

```python
on_target = [m for m in sorted(watches(q))
             if q.subskill_primary in pack.misconception(m).subskills]
```

If `on_target` is empty the item is not pushable and cannot enter a block (this is what excludes `q_eq_numeric`, whose `watches` set is empty, and what stops `q_int_mcq` from being handed BL-M1, the *slope* misconception). **The same two-line filter replaces `sorted(st.active_misconceptions)[0]` in `remediation_for`**, which improves the existing R1 rung for free — that graft ships whether or not RNP does.

**Step 3 — The coin flip.** `rng = random.Random(f"{session_id}|{s}|{block_index}")` picks one of two orderings: `("push","solo")` or `("solo","push")`. Exactly one item of every block is pushed. Blocked rather than free Bernoulli, for two reasons that both bite at this n: free flips can hand four pushes in a row (destroying balance at n_pairs ≈ 3) and can make the mastery criterion's unscaffolded requirement unreachable. The seed string and the resolved order go into the event payload so the assignment is re-derivable by an analyst who was not in the room.

**Step 4 — Serving.** `GET /api/session/{id}/next` returns, alongside the question, `assist: {arm, probe_id, texto}` on push and `assist: {arm: "solo"|"na"}` otherwise. The dock renders `texto` as one tutor line above the item via the existing `dock.decir`, before the input is mounted. On solo and `na` the dock renders nothing extra.

**Step 5 — Answering.** `POST /api/session/{id}/answer` gains `think_ms` (client-measured, render → submit, ~5 lines in `QuestionFlow.ask`; `answers.latency_ms` is judge latency and must not be reused). The endpoint reads the open block from the session's event log, persists `assist_arm`, `pair_id`, `pair_pos`, `probe_id`, `think_ms`, and computes `assist_pulled` server-side. Push rows are recorded with `con_andamiaje = True`.

**Step 6 — Block breakage.** If remediation preempts, or the 12-question budget ends, or the student leaves after `pair_pos = 1`, the orphan is recorded as served and excluded from the paired statistic by the readout's own universe filter. Nothing about the lesson degrades.

### The mastery-reachability proof (repairs the "perturbs the instrument" fatal)

`dominio.sin_andamiaje_min = 1` in `content/packs/budget-line/pack.yaml`: at least one of the three streak answers must be unscaffolded. Push rows are the **only** rows RNP sets `con_andamiaje = 1` on; solo rows, `na` rows and remediation-served rows are all `con_andamiaje = 0`. Blocking makes two pushes adjacent only across a block boundary (`…,push | push,…`) and never three, since a block contains exactly one push and orphans are never pushed. Therefore **every window of three consecutive practice answers contains at least one `con_andamiaje = 0` row**, and the unscaffolded requirement is satisfiable under every assignment the layer can produce. This is a unit test, not an argument.

I accept, rather than paper over, what remains: arm assignment does write into `answers.con_andamiaje`, and RNP sessions therefore produce mastery records that are not strictly comparable to non-RNP sessions. The alternative — logging a nudged answer as unscaffolded — would be a lie in the schema, and excluding push rows from evidence entirely would halve evidence throughput inside a 12-item budget. A nudged correct answer *is* evidence; it is scaffolded evidence, and the criterion already knows how to weigh that.

*(Noted, out of scope: `PracticeLoop.step()` calls `flow.ask(spec, {})` even when it has just rendered `next.socratica`, so `con_andamiaje` is currently never 1 anywhere in the product. RNP will be the first thing that ever sets it. Whether remediation-served items should also set it is a real bug worth fixing — separately, because it changes mastery.)*

---

## 3. The statistic

**Universe.** `shadow = 0` AND `attempt = 1` AND `assist_arm IN ('push','solo')` AND `pair_id` has **both** positions answered. Correct means `score >= 1.0`.

Randomization gives a clean 2×2 — arm crossed with position — and the whole design lives in reading it as four cells rather than as one difference:

| | position 1 (fresh) | position 2 (after partner) |
|---|---|---|
| **solo** | `p(solo@1)` | `p(solo@2)` |
| **push** | `p(push@1)` | `p(push@2)` |

**Primary estimand — TRANSFER.**

```
transfer = p(solo@2) − p(solo@1)
```

Both cells are unassisted items in the same sub-skill; the only difference is that `solo@2` was preceded by a nudged item and `solo@1` was not, and which is which was decided by the coin flip. This is a randomized estimate of whether volunteered help carried to an item the tutor did not touch. It is the closest thing to a tutor-absent measurement obtainable without authoring a single new item, and it is the cell comparison the RAP proposal threw away as a nuisance.

**Secondary — ASSIST LIFT (the demoted `carry`).**

```
assist_lift = p(push@1) − p(solo@1)
```

Position-1 only, so both cells are fresh first-of-block items and neither is contaminated by within-block spillover. This is the immediate effect of one volunteered sentence on correctness. It is **not** evidence about dependence on its own — help that teaches and help that substitutes raise it identically — which is precisely why it is reported only next to `transfer`.

**The joint read, which is the whole point:**

- `assist_lift > 0` and `transfer ≈ 0` → the scaffold-carrying signature: the tutor's prompting produces answers, not understanding.
- `assist_lift > 0` and `transfer > 0` → a tutor doing its job.
- `assist_lift ≈ 0` → the nudge is inert; the finding is about the nudge, not the student.

**Do not compute** the pooled `carry = mean(correct(push) − correct(solo))` over all pairs. Its expectation is (immediate substitution) − (transfer)/2 — a difference of two quantities with opposite signs — so `carry = 0` is predicted both when assistance is irrelevant and when assistance does everything and it sticks for ninety seconds. That is bias in the reassuring direction and more students do not fix it.

**Comparison group and n=1.** There is no between-student comparison group and none is needed: every contrast is within-student and within-sub-skill, with the comparison group generated by the coin flip. The n problem is about cell counts, and it is severe. Bank arithmetic, enumerated against `content/packs/budget-line/questions.yaml`: each of the 6 essential sub-skills has at most 3 items satisfying the partner rule, giving a hard ceiling of **1 pair + 1 permanent orphan per sub-skill**, i.e. ≤ 6 pairs per session and realistically 2-4, since the selector stays on one sub-skill until it is mastered. Four cells, 3 pairs, ≈ 1-2 observations per cell.

So the readout is **gated**, mechanically:

```
if min(n per cell) < 5:  report raw counts only, and the literal string
                         "insufficient data — plumbing check only"
else:                    report transfer and assist_lift, always with n per cell
```

No point estimate is ever rendered below the gate. At one PoC student the gate never opens, and that is the correct behaviour, not a limitation to be worked around. `p_solo`, `p_push` and any Beta-smoothed variant are **not** reported at all — a smoothed probability over 2 observations is a coin flip wearing a posterior's clothes.

**Analysis is intent-to-treat.** A pair counts under its assigned arms even if the student pulled the chat on the solo item. `assist_pulled` is stored so a cohort can compute a compliance version later; it is never used to reclassify a row, because conditioning on a post-randomization variable resurrects exactly the selection confound the design exists to kill.

**Grafted from Recipe-Trap:** store which *predicted wrong answer* was produced, not only correct/incorrect. `answers.misconception_id` already carries this for every deterministic item via `diagnostico_si_falla` and the MCQ option mapping, so the readout reports the error-class distribution per arm at zero marginal cost. If pushed items fail into a *different* misconception than solo items, that is process data the correctness cells cannot show.

**Latency is a stored covariate and never a rule input.** No verdict, flag, or classification is conditioned on `think_ms`. Recipe-Trap's 8000 ms floor is rejected: automatic recipe execution is fast and deliberate confusion is slow, so a latency floor voids true positives while retaining confounds.

---

## 4. Storage

**`answers`** — six columns, all with defaults so existing rows stay readable, all added through the existing `Repo._ensure_column` path in `repo.py:71` (the same path `shadow` and `cost_usd` already took, so no migration framework):

```sql
ALTER TABLE answers ADD COLUMN assist_arm    TEXT    NOT NULL DEFAULT 'na';  -- push|solo|na
ALTER TABLE answers ADD COLUMN pair_id       TEXT;      -- NULL when unpaired
ALTER TABLE answers ADD COLUMN pair_pos      INTEGER;   -- 1 | 2
ALTER TABLE answers ADD COLUMN probe_id      TEXT;      -- misconception id nudged; NULL on solo
ALTER TABLE answers ADD COLUMN assist_pulled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE answers ADD COLUMN think_ms      INTEGER;   -- render→submit; NOT judge latency
CREATE INDEX IF NOT EXISTS idx_answers_pair ON answers(pair_id);
```

`assist_arm` is a column and not a convention inside `raw_answer` for the same documented reason `shadow` is one: the readout must be able to write `WHERE assist_arm = 'solo'` explicitly, and `Repo.evidence()` must be provably unable to see it.

**`chat_messages`** — one column, grafted from The Handoff. `ChatIn` already carries `question_id` (`main.py:182`) and `record_chat` already drops it:

```sql
ALTER TABLE chat_messages ADD COLUMN question_id TEXT;
```

`assist_pulled = 1` iff a `chat_messages` row exists for this session with `role='user'` and this `question_id`. Exact attribution, no time-window heuristics.

**`events`** — three new types, on the existing append-only log:

- `assist_block_opened` — `{pair_id, subskill_id, q1, q2, tier1, tier2, delta_tier, order: ["push","solo"], seed, probe_q1, probe_q2}`. Without the seed and the order, an analyst cannot verify arms were not assigned post hoc. This payload is what makes the whole thing an experiment rather than a story.
- `assist_nudge_shown` — `{pair_id, question_id, probe_id}`.
- `practice.item_shown` — `{question_id, pair_id, assist_arm}`. **`app/web/src/practice/loop.ts` currently emits no events at all** (the narration's `checkpoint.shown` fires only for narration checkpoints), which means practice is the one phase with no shown→answered trace. This event closes that gap and is useful well beyond D-1.

**`flags`** — **nothing is written.** No `transfer_probe_rote`, no `mastery_may_be_scaffold_carried`, no automatic instructor alarm at any n. The readout is one labelled row in the instructor diagnosis and nothing else. Raising a flag on 3 pairs would be raising an alarm on noise, and the instructor's attention is the scarce resource.

**`mastery`, `remediations`, `sessions.outcome`** — untouched. No new table: `assist_readout(pack, rows)` in a new `app/server/core/mastery/assist.py` recomputes from `answers` + `events`, mirroring the "mastery is a pure function of the log" stance of `state.compute`, so revising the statistic re-scores all history.

**Content** — one new required field on each of the 7 entries in `content/packs/budget-line/misconceptions.yaml`:

```yaml
nudge:
  es: "…"
  en: "…"
```

This is the one real content cost, and it exists because the student judge was right: every `socratic_probe` in the catalogue is a *question* written to be asked after a specific wrong answer, and putting one before the student's first attempt delivers an unanswerable interrogation with nowhere to type the reply, under a lead-in that promised a hint. `representacion_alternativa` is an enum (`numerica`/`grafica`/`tabla`) and `caso_numerico` is instructor-facing authoring guidance, so neither is usable either. Seven declarative sentences × two languages is the honest bill.

**Validator rules** in `pipeline/validate_pack.py`, all hard failures:

1. Every misconception has a non-empty `nudge` in both languages.
2. **A nudge contains no digits.** This makes it structurally impossible for a nudge to hand over the answer to the item it precedes, and it is machine-checkable in one line, unlike "reviewer thinks it's fair".
3. A nudge must not contain any of `¿`/`?` — it is a hint, not a question. This is the student-lens fatal turned into CI.
4. For every pushable item, `on_target(q)` is non-empty (otherwise the item is simply not pushable, which is legal, but the validator prints the list so the pairing supply is visible).
5. `assist.py` is imported by nothing under `core/mastery/state.py` or the scoring path of `select.py` — asserted by a test, so the "cannot feed mastery" claim is enforced structurally rather than remembered.

---

## 5. Exact student-facing wording

Only three new strings ship to the student: one lead-in, and the seven catalogue nudges (two shown here as the pattern; the remaining five are written the same way — declarative, on-target, digit-free, no question mark, never naming the error).

**Lead-in, prepended to every push nudge:**

- ES: `"Una pista antes de responder: "`
- EN: `"One hint before you answer: "`

**BL-M1 (BL.SLOPE) `nudge`:**

- ES: `La pendiente es cuánto del bien del eje vertical tienes que soltar para comprar una unidad más del bien del eje horizontal: el precio de uno, medido en unidades del otro.`
- EN: `The slope is how much of the good on the vertical axis you have to give up to buy one more unit of the good on the horizontal axis: the price of one, measured in units of the other.`

Rendered in the dock on a push-arm BL.SLOPE item:

> ES: **"Una pista antes de responder: la pendiente es cuánto del bien del eje vertical tienes que soltar para comprar una unidad más del bien del eje horizontal: el precio de uno, medido en unidades del otro."**
> EN: **"One hint before you answer: the slope is how much of the good on the vertical axis you have to give up to buy one more unit of the good on the horizontal axis: the price of one, measured in units of the other."**

**BL-M3 (BL.CS.P, BL.INT) `nudge`:**

- ES: `Cada intercepto depende de un solo precio: es todo el ingreso gastado en ese bien. Si cambia el precio del otro bien, ese intercepto no tiene por qué moverse.`
- EN: `Each intercept depends on one price only: it is the whole income spent on that good. If the other good's price changes, that intercept has no reason to move.`

**On a solo-arm item and on an `na` item: nothing.** The question appears exactly as it does today.

**Everything else is unchanged, byte for byte.** `QuestionFlow.report()` still says `"Correcto."` / `"Correct."` or the socratic probe; the practice loop still closes with `"Eso es todo por ahora. Buen trabajo."` / `"That's it for now. Nice work."`; the chat composer, its 12-turn counter, and the remediation ladder behave identically in both arms. No student-facing string anywhere contains *prueba, examen, test, check, evaluación, assessment, diagnostic*, or any reference to pairs, arms, conditions, or measurement.

---

## 6. What this cannot tell us

**With one PoC student, it tells us nothing about the student.** The gate in §3 will not open — there will be 2-4 pairs and 1-2 observations per cell — so no estimate is rendered at all. What one run can establish is entirely about the instrument, and that is worth having:

- That the pairing layer serves matched blocks inside a 12-question budget without starving the selector, and that mastery stays reachable under the assignment (the window-of-three proof, verified in a live run rather than only in a test).
- That the arms are recoverable end to end from the log: seed, order, `pair_id`, both `question_id`s, both probes, both outcomes.
- That a declarative, digit-free nudge lands as help rather than as friction — readable qualitatively from `assist_pulled` and `think_ms` on push items, and from asking the student afterwards.
- The actual pair yield, which the bank arithmetic predicts will be thin and which will most likely come in at 2-3. That partial failure *is* the finding, and it is what prices the item-authoring bill before anyone pays it.

**What it cannot tell us, at any n, and where I will not pretend:**

- **Nothing about retention or about performance with the tutor absent.** `transfer` is measured about sixty seconds later with the chat still on screen. It is near transfer, not Bastani's delayed unassisted exam. It is the best available signal without a second session or new items; it is not the same construct, and the instructor diagnosis must say so in the same sentence that reports the number.
- **Nothing about the chat channel**, which is the one the literature actually implicates. The chat is an unrandomized co-intervention present in both arms; `assist_pulled` records it and never adjusts for it.
- **Nothing about judge leniency on open prose.** Under the same-grader-class rule, every `llm` item in the pack (`q_slope_open`, `q_feas_open`, `q_cp2_why_intercept_fixed`) is the only LLM item in its sub-skill and always falls to `assist_arm='na'`. I accept this: D-1 does not measure judge validity, and the shadow-judge bake-off — which already exists and already replays raw answers under new verdict rules — is the mechanism that does. Pretending RNP covers it would be worse than the gap.
- **No per-sub-skill read, ever, at PoC scale.** At most one or two sub-skills will complete a pair.
- **Nothing causal about the tutor's chat behaviour.** The nudge is a static catalogue sentence; a positive `assist_lift` says that sentence helped, not that the LLM tutor is or is not solving.

**When it becomes a real instrument:** ~20 observations per cell, i.e. roughly 10-15 students at 3-4 pairs each, at which point `transfer` is estimable to about ±0.15 and the row-level storage supports a mixed model with student and item random effects without re-running anything. The single-student PoC is worth building solely because it is what makes those observations collectable later at zero additional design cost.

---

## 7. The smallest honest version (two hours)

The log is append-only and complete, so **the statistic can be computed later from data collected now**. That is the cut: build the collection, drop the analysis.

**Ships in two hours:**

1. The six `answers` columns + the index, via `_ensure_column` (~20 min).
2. `chat_messages.question_id` threaded through `record_chat` (~10 min).
3. The pairing layer, minimal: partner = the next unseen same-sub-skill, same-grader, non-prediction item with a non-empty `on_target` set, **any tier**; seeded coin flip; `assist_block_opened` event with seed and order (~35 min).
4. `/next` returns `assist`; the dock renders one line via the existing `dock.decir` (~15 min).
5. `/answer` accepts and persists `assist_arm`, `pair_id`, `pair_pos`, `probe_id`, `think_ms`; sets `con_andamiaje=True` on push (~20 min).
6. Two nudges only — **BL-M1 and BL-M3** — so only BL.SLOPE, BL.CS.P and BL.INT items are pushable; everything else degrades gracefully to `assist_arm='na'` (~15 min of Kristian's time).
7. One test: the window-of-three reachability property (~15 min).

**Dropped, and recoverable later from the same log at zero loss:** `assist.py` and the readout entirely (a SQL query over `answers` + `events` reconstructs all four cells whenever we want them); `assist_pulled` as a stored column (derivable from `chat_messages.question_id` retroactively); the instructor-diagnosis row; the `practice.item_shown` event; the tier-matching preference; the five validator rules; the `assist_nudge_shown` event; the remaining five nudges.

**Not droppable at any budget, because dropping them turns this into something else:** the seed and the resolved order in the event payload (without them the arms are a story, not an experiment); `con_andamiaje=1` on push rows (without it the schema lies); the absence of any `flags` write; and the rule that no nudge contains a digit or a question mark — enforced by eye if the validator is cut, but enforced.

---

## Apéndice — estado de la implementación (2026-08-11)

Construida la **mitad de recogida** del §7. La lectura NO está, a propósito: el log es
append-only y completo, así que las cuatro celdas se reconstruyen después. Recoger tiene
fecha límite; analizar no.

### Lo que existe

`app/server/core/mastery/assist.py` (capa de emparejamiento, moneda con semilla, filtro
on-target), las seis columnas de `answers` y `chat_messages.question_id` vía
`_ensure_column`, los tres tipos de evento, el renderizado de la pista antes de montar la
pregunta, `think_ms` medido en el cliente, dos reglas duras en el validador, y
`tests/test_d1_rnp.py` con las propiedades que sostienen el diseño.

### Dos desviaciones de la especificación, con su motivo

**1. El desempate del selector.** La especificación dice que la capa solo decide si el
ítem que el selector devolvió abre o cierra un bloque, y nada más. Con esa regla al pie de
la letra, **un par abierto casi nunca llegaba a cerrarse** —comprobado recorriendo una
sesión: el bloque abría en `q_cs_p_mcq` y el ítem siguiente era otro— y un par a medias no
aporta ninguna observación, porque las dos celdas exigen las dos posiciones.

`next_question` recibe ahora `preferir`, que gana **empates y solo empates**. El desempate
final de ese selector era el id alfabético, que es arbitrario por construcción: llegados
ahí, la pedagogía ya declaró equivalentes a los candidatos que quedan. La capa sigue sin
poder elegir contenido; solo ordena dos ítems intercambiables.

**2. Un fallo del producto que salió por el camino.** Con el juez en sombra, un ítem
abierto se juzga y se guarda con `shadow = 1`, así que `evidence()` no lo devuelve nunca.
El selector contaba las vistas desde la evidencia, de modo que ese ítem se quedaba en
"visto 0 veces" **para siempre**, ganaba el orden de menos-visto en cada vuelta, y el
alumno recibía la misma pregunta abierta hasta el tope de 40 del bucle de práctica. Y como
tampoco producía evidencia, su sub-skill no alcanzaba dominio jamás: el concepto entero era
inalcanzable. Arreglado separando servir de puntuar (`vistas`). No es de D-1, pero sin
arreglarlo D-1 no se podía ni probar.

### El rendimiento real, medido

**2 pares por sesión**, en `BL.CS.P` y `BL.SLOPE`, con los dos órdenes de la moneda
apareciendo. Es el extremo bajo de lo que el §6 predijo, y con **dos** pistas redactadas de
siete: sin `nudge` no hay ítem empujable, y solo `BL-M1` y `BL-M3` lo tienen. Las otras
cuatro sub-skills esenciales dan cero pares.

Eso es exactamente lo que el §6 llamó "el fracaso parcial que ES el hallazgo": pone precio
a la autoría antes de que nadie la pague. Escribir las cinco pistas que faltan no compra
cinco pares — compra los pares de las sub-skills cuya pareja además comparte clase de
corrector, que hay que contar una por una.

### La lectura, cuando toque

No hace falta código nuevo para empezar. Las cuatro celdas salen de una consulta:

```sql
SELECT assist_arm, pair_pos, COUNT(*) n, AVG(score >= 1.0) p
FROM answers
WHERE shadow = 0 AND attempt = 1 AND assist_arm IN ('push','solo')
  AND pair_id IN (SELECT pair_id FROM answers
                  WHERE pair_id IS NOT NULL AND attempt = 1
                  GROUP BY pair_id HAVING COUNT(DISTINCT pair_pos) = 2)
GROUP BY assist_arm, pair_pos;
```

`transfer = p(solo@2) − p(solo@1)`; `assist_lift = p(push@1) − p(solo@1)`. **La compuerta
del §3 sigue en pie**: por debajo de 5 observaciones por celda no se rinde ningún estimador
puntual, solo los conteos y la cadena literal "datos insuficientes — solo comprobación de
fontanería". Con un alumno la compuerta no se abre, y esa es la conducta correcta.
