# T-006 — Sistema de procedencia y auditoría del talk

**Autor de esta auditoría:** Codex  
**Alcance:** `docs/talk/talk.en.md`, 15 slides, leído sin editar  
**Corte:** 2026-08-11  
**Criterio:** separar lo que una fuente observó de lo que nuestro proceso infirió y de
lo que decidimos hacer. Una cita no convierte una inferencia en resultado del paper.

## Dictamen

El deck no necesita cuatro categorías mutuamente excluyentes. Necesita **dos ejes
independientes en el registro** y una **codificación colapsada de cuatro rótulos en
pantalla**.

Los dos ejes son:

1. **Operación epistemológica:** medición/descripción; interpretación o síntesis;
   recomendación/decisión; hecho de nuestro proyecto.
2. **Cadena de producción:** fuente primaria → informe inicial de Kristian con ChatGPT →
   verificación o investigación de nuestro equipo → selección/redacción del talk.

Esto resuelve el caso difícil: “los efectos grandes son recetas” es una **síntesis
nuestra** sobre mediciones ajenas. Su origen remoto son cuatro estudios, pero ningún
paper produjo esa frase ni validó la receta como conjunto. Un único campo “fuente:
papers” sería cierto y engañoso a la vez.

El deck actual tiene siete blockers de procedencia/autoridad, agrupados en seis frentes:
dos generalizaciones en slides 4 y 8; tres afirmaciones empíricas sin base suficiente
en slides 10 y 11; y una
atribución causal excesiva más un hecho de implementación no acreditado en slide 14.
Las cifras centrales sí sobreviven: la verificación de fable es sólida y los matices
numéricos están incorporados.

## 1. Sistema propuesto

### 1.1 Registro canónico: dos ejes, no una taxonomía plana

Cada afirmación sustantiva debería tener estos campos en la fuente del deck:

| Campo | Valores | Para qué sirve |
|---|---|---|
| `claim_kind` | `evidence`, `synthesis`, `recommendation`, `project_fact` | Dice qué acto estamos realizando. |
| `primary_sources` | ids citables o `none` | Identifica quién produjo la evidencia original. |
| `process_stage` | `input_report`, `T-006_verified`, `T-002_researched`, `talk_synthesis` | Hace visible cómo llegó al deck. Puede haber varios. |
| `process_owner` | Kristian+ChatGPT, fable, claude, codex, agy | Contesta “quién investigó/verificó/sintetizó qué”. |
| `scope` | población, contraste, outcome, horizonte | Impide despegar un efecto de su diseño. |
| `status` | `verified`, `qualified`, `unverified`, `our_judgment` | Evita que una cita decorativa eleve la autoridad. |

`process_owner` no reemplaza al autor científico. “Verificado por fable” significa que
fable contrastó la cifra; **no** que fable produjo el hallazgo. “Síntesis de claude”
significa que claude hizo la reducción o inferencia; **no** que la literatura la
estableció.

### 1.2 Lo que ve la audiencia: cuatro rótulos

No mostraría los dos ejes completos junto a cada frase. Los colapsaría así:

- **EVIDENCE · Autor, año** — medición o descripción atribuible directamente a una
  fuente. Si la fuente es de producto/proveedor, el rótulo lo dice.
- **OUR SYNTHESIS · based on A + B + C** — interpretación que construimos al comparar
  fuentes. La cita prueba los insumos, no la conclusión.
- **OUR RECOMMENDATION** — criterio normativo, checklist, regla de compra o decisión de
  diseño. Puede añadir “informed by…” sin fingir derivación lógica.
- **OUR PROJECT · not yet evaluated** — hecho o decisión de tutorIA. Distingue estado
  del proyecto de efecto demostrado.

No crearía un quinto rótulo “our process”. La verificación es una propiedad de la
cadena, no una clase de afirmación. Se muestra en la línea de procedencia y en la ficha
de método.

### 1.3 Granularidad y peso visual

La unidad correcta es **la afirmación**, no la slide. Pero no pondría un badge por
oración. Agruparía afirmaciones contiguas que comparten naturaleza y fuente en un
**claim block**. En este deck la unidad natural ya existe: una fila de tabla, un número
con su descripción, un estrato del stack o un ítem de lista.

Diseño visual recomendado:

- Eyebrow de 12–14 px sobre el claim block: `EVIDENCE`, `OUR SYNTHESIS`, etc. El tipo
  se reconoce por texto e icono, nunca sólo por color.
- Fuente corta pegada al dato: `Bastani et al. 2025`, no un `[3]` huérfano.
- Franja inferior discreta, de una línea: `Primary source → verified in T-006 (fable)`.
  En slides con varias fuentes, hasta cuatro claves; las referencias completas viven en
  el panel de referencias/transcript del deck.
- El contenido sigue dominando. Procedencia en gris de alto contraste; `OUR SYNTHESIS`
  y `OUR RECOMMENDATION` con un contorno suave. No usar semáforo de “calidad”: una
  recomendación no es evidencia de baja calidad, es otro tipo de acto.

Marcar toda una slide es admisible sólo en 1, 4, 10, 11, 12, 13 y 15, donde domina un
acto. En 3, 5, 7, 8 y 14 hay mezcla interna y el rótulo por slide mentiría.

### 1.4 ¿Aparecen los agentes?

Sí, pero en la **ficha de método y en la cadena de verificación**, no como coautores de
los resultados científicos ni como una firma repetida en cada slide.

Texto transparente propuesto para una ficha accesible desde la slide 1 y repetida al
final:

> Research workflow: source report developed by Kristian with ChatGPT; numerical
> claims checked against primary sources by fable (T-006); prior-art research by
> codex, claude and agy (T-002); talk selection and synthesis by claude; provenance
> audit by codex. Kristian is the principal and presenter.

No lo reduciría a “our review”: ocultaría precisamente el proceso que Kristian quiere
que se vea. Tampoco escribiría “Codex found X” al lado de un efecto: el efecto lo
encontraron los autores del paper; Codex/Claude/fable localizaron, verificaron o
sintetizaron.

### 1.5 La cadena Robinson: no necesita otra slide

La slide 9 ya es el lugar correcto. Añadiría allí un pequeño **correction trail**:

`ChatGPT source report: 4.4 min → primary abstract: 1–4 min → corrected after fable
verification (T-006)`

Es una demostración concreta del método y fortalece el argumento de la slide: el número
absoluto importa. No merece una slide 16; eso desviaría el talk desde aprendizaje hacia
nuestro workflow. Sí merece permanecer en el transcript y en las notas de referencias.

### 1.6 Referencias completas sin saturar el escenario

Cada slide debe poder abrir una ficha de fuentes mediante un control discreto y teclado.
La ficha contiene cita completa, enlace, pregunta/contraste del estudio, caveat y cadena
de verificación. El escenario muestra autor-año y el claim kind; el transcript exportado
preserva la ficha. Así la procedencia funciona a tres distancias: a tres metros se ve el
tipo de afirmación; sentado se ve autor-año; al inspeccionar se obtiene la cadena
completa.

## 2. Clave de fuentes exactas usada en la auditoría

| ID | Fuente exacta y función en nuestro proceso |
|---|---|
| **BAS** | Bastani, H. et al. (2025), *Generative AI without guardrails can harm learning: Evidence from high school mathematics*, PNAS; verificación y diseño en `coord/work/claude/T-002-carril-C-tutores-llm-juez.md`, “Bastani et al.”, URL primaria allí. |
| **BUR** | Burneo, A., Dinarte-Diaz, L., Lopez, C. y Molina, E. (2026), *Can EdTech Close Learning Gaps? Global Evidence from Digital Interventions*, World Bank WDR 2026 background paper; cifras y URLs primarias en `coord/work/fable/T-006-verificacion-cifras.md`, filas a–b. |
| **KES** | Kestin, G. et al. (2025), *AI tutoring outperforms in-class active learning: an RCT introducing a novel research-based design in an authentic educational setting*, *Scientific Reports* 15:17458; `T-006-verificacion-cifras.md`, fila c. |
| **NIG** | De Simone, M. E. et al. (2025), *From Chalkboards to Chatbots: Evaluating the Impact of Generative AI on Learning Outcomes in Nigeria*, World Bank Policy Research Working Paper 11125; `T-006-verificacion-cifras.md`, fila d. |
| **SLE** | LearnLM Team, Google DeepMind y Fab AI (2026), *Teaching with Gemini: Measuring the impact of Guided Learning on student mathematics progress in Sierra Leone*, technical/provider report; `T-006-verificacion-cifras.md`, fila e. |
| **ROB** | Robinson, C. D., Gormley, D., Ribeiro, A. T. y Loeb, S. (2026), *Access is Not Enough: Human Support Improves Engagement with AI Tutoring*, EdWorkingPaper 26-1451; `T-006-verificacion-cifras.md`, fila g. |
| **REP** | `docs/sources/IA_generativa_aprendizaje_informe_completo.pdf`, informe producido por Kristian con ChatGPT; especialmente §§1.2–1.4, 3, 6–10 y Apéndice B. Es fuente de síntesis inicial, no sustituto de las fuentes primarias. |
| **A** | `coord/work/codex/T-002-carril-A-motor-mastery.md`, especialmente fichas ASSISTments/gaming, Hallazgos B–C y §4; investigación de codex con fuentes primarias enumeradas en §5. |
| **C** | `coord/work/claude/T-002-carril-C-tutores-llm-juez.md`, fichas Khanmigo, LearnLM, Tutor CoPilot y Bastani; investigación de claude con fuentes primarias por ficha. |
| **SYN2** | `docs/RESEARCH-PRIOR-ART.md`, síntesis de T-002; especialmente §§1–2, D-1 y §5 bis. Distingue explícitamente paper, propuesta de agente y síntesis del redactor. |

## 3. Auditoría por afirmación sustantiva

Leyenda de categoría: **E** evidencia/descripcion atribuible; **S** síntesis o
interpretación nuestra; **R** recomendación/decisión; **P** hecho de nuestro proyecto.
`[blocker]` significa que la formulación actual aparenta más autoridad que su fuente o
que no hay soporte suficiente en el material auditado.

### Slide 1 — Title

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| “A chatbot is not a tutor.” | S | Tesis editorial de claude, respaldada conceptualmente por REP §§1–3; ningún paper establece esa identidad verbal. Rotular `OUR SYNTHESIS`. |
| La evidencia permite preguntar qué exigir antes de incorporar IA a un curso. | R | Agenda de decisión condensada de REP §10. Rotular `OUR RECOMMENDATION`, no “what the evidence says” sin separar la recomendación. |
| Corte de evidencia: agosto de 2026. | P | Fecha del informe REP y del workflow T-006; añadir ficha de método con responsables. |

### Slide 2 — The experiment

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Cerca de 1.000 estudiantes de secundaria, tres grupos aleatorizados. | E | BAS; C, ficha Bastani. Más preciso: asignación clusterizada por aula, no individual. |
| GPT Base era asistencia sin restricciones; GPT Tutor usaba la misma base con solución canónica, errores comunes, hints y answer withholding; control sin GPT. | E | BAS; C, ficha Bastani. “Same model” es defendible como contraste del estudio, pero “never the answer” describe la política, no cumplimiento perfecto. |
| Práctica asistida seguida por examen común sin herramienta. | E | BAS; C, ficha Bastani. El examen fue inmediatamente posterior y emparejado 1:1 con problemas casi idénticos; conviene mostrar ese alcance. |
| “The measurement happens after the help is gone.” | S | Interpretación fiel de BAS, redactada por claude. Puede vivir bajo el bloque E como interpretación, o rotularse `OUR SYNTHESIS`. |

### Slide 3 — The result

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| GPT Base: +48% durante práctica y −17% en examen sin IA, ambos respecto del control. | E | BAS; C, ficha Bastani. |
| GPT Tutor: +127% durante práctica y aproximadamente control en examen. | E | BAS; C, ficha Bastani; efecto de examen −0.004, sin diferencia clara. |
| Los guardrails eliminaron el daño en ese experimento, pero no produjeron ventaja autónoma medible. | E/S | Es la lectura causal autorizada por BAS y formulada así en C. Mantener “en ese experimento”; no generalizar a todo guardrail. |

### Slide 4 — The lesson

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Rendimiento con la herramienta no equivale a aprendizaje. | S | Síntesis convergente de BAS + A (evidencia asistida y gaming), explicitada en SYN2 §1. La versión exacta y más defendible es: “no basta para demostrar aprendizaje independiente”. |
| El estudio no prueba que la IA dañe el aprendizaje en general. | S | Límite correcto de BAS; GPT Tutor muestra que el daño no es inevitable en ese contexto. |
| Observar uso/productividad asistida dice poco sobre aprendizaje autónomo. | S | BAS + SYN2 §1. “Dice menos” es retórica razonable; evitar “nada”, corrección ya registrada en SYN2. |
| **[blocker]** Si se evalúa un producto observando a estudiantes usarlo, se preferirá *sistemáticamente* el que haga más trabajo por ellos. | S | BAS demuestra que métricas asistidas pueden invertir el ranking en un experimento; no demuestra una preferencia sistemática universal de compradores. Cambiar por “can make us prefer…” y rotular `OUR SYNTHESIS`. |
| Cuanto mejor se siente la demo, más sospechosa debe ser. | R | Aforismo de claude, no resultado. Rotular `OUR RECOMMENDATION` o presentarlo claramente como heurística. |

### Slide 5 — So does it work?

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| 191 efectos, 14 RCT, 10 economías; efecto medio +0.125 DE vs instrucción tradicional. | E | BUR; fable fila a. Working paper, no peer review. |
| Subgrupo de tutoría/instrucción IA: +0.12 DE. | E | BUR; fable fila a. Los propios autores tratan subgrupos como sugestivos, no concluyentes. |
| El efecto está por encima de la mediana de intervenciones educativas de campo. | E | BUR/REP §6.1; conservar el referente exacto y no traducirlo a “gran efecto”. |
| “A real effect… not a revolution/transformation.” | S | Valoración de magnitud de claude sobre BUR. Rotular `OUR SYNTHESIS`; “revolution” no es categoría estadística. |
| Ningún estudio incluido es de país de bajos ingresos. | E | BUR; fable §1 y §2. |
| Disponibilidad nocturna, paciencia, múltiples explicaciones, idioma y nivel de lectura. | E/S | Capacidades técnicas generales descritas en REP §§2.2 y 3.6; no son outcomes causales. Rotular `CAPABILITY`, o integrarlas bajo `OUR SYNTHESIS` sin llamarlas “gains” medidos. |
| Para algunos estudiantes, acceso es todo el problema. | S | Juicio plausible pero no demostrado por las fuentes auditadas. No blocker si se presenta como reconocimiento del ponente, no como hallazgo. |

### Slide 6 — The number nobody quotes

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Diferencial GenAI vs tecnología adaptativa previa 0.022 DE; EE 0.075; IC [−0.15, 0.19]. | E | BUR; fable fila b. |
| No prueba equivalencia; el intervalo acota la diferencia sin resolverla. | E | BUR, palabras de los autores verificadas por fable. La cita breve del deck está bien atribuida. |
| El registro experimental no muestra ventaja de la generación nueva. | E | BUR; fable fila b. Debe conservar “to date” y el alcance de la base. |
| El adaptativo anterior sigue siendo benchmark de compra y no ha sido superado. | S/R | Primera parte: síntesis razonable de BUR + benchmarks pre-LLM en REP §5.2. Segunda: decir “no ha demostrado ser superado en esta base”, no una negación universal. Rotular `OUR SYNTHESIS` y luego `OUR RECOMMENDATION`. |

### Slide 7 — The average hides the lesson

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Física universitaria crossover ≈+0.63 DE; contenido experto, soluciones verificadas y secuencia externa. | E | KES; fable fila c y §2. Dos lecciones, Harvard, test inmediato. |
| Nigeria after-school ≈+0.31 DE; IA + tiempo adicional + docentes + pares. | E | NIG; fable fila d y §2. Atrición: 759/1.328 completaron post-test. |
| Sierra Leona +0.258 DE ITT; clases teacher-led y objetivos docentes. | E | SLE; fable fila e y §2. Technical/provider report, 8 semanas, no peer review. |
| Acceso a tutor de lectura ≈0 en reading; licencias/acceso con poca dosis. | E | ROB; fable fila g. Había apoyo humano aleatorizado; el contraste no es literalmente “licences handed out” a secas. |
| Misma tecnología amplia, outcomes muy distintos; la pregunta útil son las condiciones del tratamiento. | S | Síntesis de claude sobre KES+NIG+SLE+ROB, coherente con REP §§6–7. Rotular `OUR SYNTHESIS`. |

### Slide 8 — Effects are recipes

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Kestin usó lecciones de expertos, soluciones preparadas y secuencia impuesta fuera del modelo porque el prompt no la sostenía de forma fiable. | E | KES; REP §§3.4 y 6.3; fable §2. |
| Nigeria incluyó tiempo adicional, profesores y pares. | E | NIG; fable fila d. |
| Sierra Leona fue teacher-led y los docentes fijaron objetivos. | E | SLE; fable fila e/REP §3.8; señalar fuente asociada al proveedor. |
| **[blocker]** “The same pattern appears every time” / “Every large effect … is a package” de cuatro ingredientes. | S | La conclusión compara casos seleccionados; ningún estudio prueba que los cuatro ingredientes sean necesarios ni que aparezcan en *todo* efecto grande. Además, Sierra Leona no comparte literalmente todos los componentes listados. Cambiar por “Across these high-effect cases, the treatment is a package…” y rotular `OUR SYNTHESIS · Kestin + Nigeria + Sierra Leone`. |
| Copiar marca o prompt no reproduce el tratamiento. | S/R | Inferencia de transportabilidad razonable a partir de intervenciones compuestas; no resultado aislado. Rotular `OUR SYNTHESIS`. |

### Slide 9 — The null result that matters most

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Dos RCT, ≈350 alumnos de primaria, acceso a tutor de lectura y apoyo humano. | E | ROB; fable fila g. |
| Engagement +71–80%; uso +1 a 4 minutos/semana; reading sin mejora. | E | ROB; fable fila g. La corrección 4.4→1–4 debe hacerse visible como cadena de verificación. |
| Es el resultado nulo “más útil” y “menos discutido”. | S | Valoración de claude; no medido. Rotular como voz del ponente, no como evidencia. |
| 80% relativo puede sonar a adopción; 1–4 minutos no constituye dosis suficiente. | S | Interpretación de claude, apoyada por el diseño ROB y REP §7.1. No se estimó experimentalmente una dosis umbral, así que evitar “required dose”. |
| Licencia no es dosis; take-up es parte del tratamiento y debe planificarse/medirse. | R | Recomendación derivada de ROB + REP §§7.1 y 9.2. Rotular `OUR RECOMMENDATION`. |

### Slide 10 — What is under the conversation

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Arquitectura en capas: dominio, learner model, policy, tools, guardrails, interfaz, humano y medición. | S/R | Condensación de las ocho capas de REP §3. Es una arquitectura recomendada por el informe, no un efecto causal. Rotular slide completa `OUR SYNTHESIS / DESIGN FRAMEWORK`. |
| **[blocker]** La conversación es la parte más fácil de construir. | S | REP dice que GenAI resuelve gran parte de interfaz/autoría y no el problema central; no compara costos de construcción. T-002 ya corrigió un salto análogo de “costo omitido” a ranking de costos (SYN2 §5 bis). Cambiar por “the most visible layer” o declarar opinión sin ranking. |
| Un historial de chat no es learner model; el estado estructurado debe ser inspeccionable y corregible. | S/R | REP §§2.3, 3.3 y 10. Es definición/criterio de diseño, no resultado experimental. |
| Ejemplo budget constraint: slope sí, oportunidad no, feasible set no, hints no cuentan. | P/R | Ejemplo construido para tutorIA por claude a partir de A/SYN2; no es observación de un estudiante real. Debe decir “for example, a learner model could say…”. |
| Tools externos deben calcular/verificar; docente debe ver y override; medición no puede ser opinión del modelo. | R | REP §§3.5, 3.8, 9–10; prácticas recomendadas. |

### Slide 11 — Four levels of personalization

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Cuatro niveles: presentación, interacción, decisión pedagógica, trayectoria. | S | Taxonomía/reducción de claude, inspirada en REP §§3.3 y 3.3–3.4 (escalas turno/sesión/curso), no taxonomía validada de un paper. Rotular `OUR FRAMEWORK`. |
| **[blocker]** “Most products stop” en niveles 1–2. | E/S | REP afirma que muchos productos se quedan en personalización superficial, pero el material auditado no contiene censo ni denominador de productos. Cambiar por “many visible products” y tratarlo como observación del review, o aportar inventario. |
| **[blocker]** Niveles 3–4 son “where the learning effects live” y siguen siendo raros. | E/S | La literatura respalda sistemas estructurados y trayectorias como mecanismos plausibles, no localiza causalmente los efectos en esos niveles ni estima rareza. Cambiar por “the levels our framework treats as pedagogical adaptation; public causal evidence remains limited”. |
| Recordar nombre/tono no equivale a estimar conocimiento. | S | Distinción conceptual de REP §§1.2, 2.3, 3.3; defendible como definición. |

### Slide 12 — What to ask for

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| “Show me the learner model before and after three answers…” separa sistema de demo. | R | Pregunta de demo de REP §10.1, seleccionada por claude. “Separa” es heurística, no test validado. Rotular `OUR RECOMMENDATION`. |
| Cinco checks: currículo trazable; estado visible/corregible; help policy; tools externos; evidencia relevante sin herramienta. | R | **Reducción de claude** de los diez requisitos de REP §10 (también §3). Debe declararse: `OUR 5-POINT SHORTLIST · condensed from the report's 10 requirements`. |
| Chat más largo equivale a nivel 2 vestido de 4. | S/R | Aplicación de la taxonomía propia de slide 11; no evidencia. |
| Pedir la respuesta tres veces prueba si la negativa es policy o personality; todos los estudiantes descubrirán una policy débil en una semana. | R | Heurística de stress-test de claude, inspirada en REP §10.1. “Every student / first week” es hipérbole sin fuente; quitar o marcar explícitamente como consejo retórico. |

### Slide 13 — How to measure

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| Outcome primario: prueba independiente sin IA; idealmente demorada. | R/S | Regla de evaluación de REP §9.1–9.2, respaldada por el contraste BAS. Es estándar recomendado por nuestro informe, no una estimación. Rotular `OUR MEASUREMENT RULE · informed by Bastani + evidence framework`. |
| Satisfacción, engagement, problemas/hora y next-question accuracy miden productividad/proceso, no aprendizaje autónomo. | S | REP §§1.2 y 9.3; matizar que pueden ser mecanismos/leading indicators, no que “no son outcomes” en ningún sentido. |
| Contar minutos reales por alumno, no licencias ni cuentas. | R | ROB + REP §§7.1 y 9.2. |

### Slide 14 — Applying it to our own work

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| tutorIA es tutor interactivo de micro con narración, gráfico manipulable, preguntas no calificadas y diagnóstico por misconception. | P | Descripción del proyecto por claude. Rotular `OUR PROJECT · design/implementation status as of Aug 2026`; no es evidencia de aprendizaje. |
| Decisión 1: checkpoints diseñados en vez de chat abierto. | R/P | Decisión propia respaldada por Khanmigo: C, ficha Khanmigo; SYN2 §2. Sal Khan dijo que para muchos fue “non-event / didn't use it much” y se reporta rediseño visible. No usar el 15%, que T-002 no verificó. Presentar “evidence-informed design decision”, no consecuencia necesaria. |
| Decisión 2: evidencia con ayuda no cuenta; hint invalida y se re-testa con ítem fresco. | R/P | ASSISTments invalida una oportunidad con hint para streak de mastery; A/SYN2 §1. Extenderlo a toda evidencia asistida y exigir ítem isomorfo fresco es **propuesta de codex**, informada por gaming, no conducta medida de Cognitive Tutor. |
| **[blocker]** Bastani es “modern proof” de que la regla exacta de invalidar hint y re-test sigue importando. | S | BAS muestra que desempeño asistido puede no transferir y que guardrails evitaron daño; no ensaya la regla de mastery, invalidación de hint ni fresh-item retest. Cambiar por “Bastani supplies the modern warning; classic ITS policy and our synthesis supply the rule.” |
| Decisión 3: chequeo no asistido, sin nota, invisible como assessment, sólo para diagnóstico docente. | R/P | Propuesta de síntesis de claude en SYN2 D-1, basada en convergencia BAS + A. Ningún paper validó este paquete exacto. Debe rotular `OUR DESIGN DECISION · based on two evidence strands`. |
| Sin ese chequeo, un tutor que replicara GPT Base parecería excelente en telemetría asistida. | S | Inferencia de SYN2 §1 sobre el diseño del PoC; fuerte y transparente si se marca `OUR SYNTHESIS`, no como hallazgo de BAS sobre tutorIA. |
| No hay trial ni conocimiento de si tutorIA enseña. | P | Declaración de estado del proyecto; forma correcta y necesaria. |
| **[blocker]** “We built the instrument that would let us find out.” | P | El material autorizado describe la decisión/propuesta, pero no contiene prueba de que el instrumento esté implementado y validado. Antes de hablar, enlazar evidencia de implementación/test o cambiar a “we designed/are building the instrument”. No audité T-005/T-010 por límite expreso. |

### Slide 15 — The line to remember

| Afirmación | Cat. | Fuente exacta / juicio |
|---|---:|---|
| El avance decisivo no es sonar como docente, sino explicitar estado, siguiente paso, límites y medición independiente. | S/R | Conclusión/manifesto de claude que condensa REP §§2–3 y 9–10. Ningún paper identifica “the decisive advance”. Rotular `OUR CONCLUSION`, con las fuentes del marco debajo. |

## 4. Cambios prioritarios para aplicar al deck

1. **Slide 1:** añadir ficha de método accesible y créditos de roles; no ocultar que el
   informe inicial nació con ChatGPT ni que otros modelos participaron.
2. **Slides 2–3, 5–7, 9:** pegar autor-año a cada resultado y mostrar verificador en la
   franja inferior. Mantener diseño, contraste y caveat, no sólo efecto.
3. **Slides 4, 8, 10–13, 15:** rotular explícitamente síntesis/framework/recomendación.
   Las citas acreditan insumos, no convierten el marco en hallazgo publicado.
4. **Slide 9:** mostrar la cadena de corrección `4.4 → 1–4` y el responsable de la
   verificación. Es el ejemplo que hace tangible el proceso.
5. **Slide 12:** declarar que las cinco exigencias son la shortlist de claude a partir de
   los diez requisitos del informe.
6. **Slide 14:** titular `OUR PROJECT — evidence-informed decisions, not results`; separar
   en cada ítem **evidencia**, **síntesis del equipo** y **decisión de tutorIA**. No decir
   “built” sin prueba de implementación.
7. Resolver los seis grupos de blockers antes de presentar: slide 4 (generalización),
   slide 8 (universalidad), slide 10 (ranking de costo), slide 11 (dos claims empíricos),
   slide 14 (atribución causal y estado de implementación).

## 5. La frase que debe gobernar la edición

**Citar el paper contesta “de dónde vienen los insumos”; rotular el acto contesta “quién
está haciendo esta afirmación”. El deck necesita ambas respuestas.**
