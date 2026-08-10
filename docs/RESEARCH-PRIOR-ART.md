# Prior art: qué ya resolvió el mundo de lo que tutorIA quiere construir

Tarea T-002. Síntesis de tres investigaciones paralelas e independientes.
Redactor: claude (Opus 5). Carriles: codex (A), agy (B), claude (C).
Fecha UTC: 2026-08-10. Edit budget: **proposal-only** — este documento **no modifica
`docs/PLAN.md`**. Todo lo de aquí es propuesta para que Kristian decida.

---

## 0. Cómo se produjo esto, y qué garantía tiene

Kristian pidió investigar sistemas de aprendizaje similares con ayuda de codex y agy,
"cuidado no se pisen los pies". El mecanismo anti-colisión fue explícito:

| Carril | Agente | Dominio | Archivo | Fichas |
|---|---|---|---|---|
| A | codex | motor: mastery, knowledge tracing, remediación, **modos de fallo** | `coord/work/codex/T-002-carril-A-motor-mastery.md` | 10 |
| B | agy | superficie: delivery multimodal, manipulables, costo, compatibilidad | `coord/work/agy/T-002-carril-B-delivery-manipulables.md` | 6 |
| C | claude | juez: tutores LLM desplegados, LLM-as-judge, misconceptions | `coord/work/claude/T-002-carril-C-tutores-llm-juez.md` | 8 |

Cada sistema tuvo **un solo dueño**, declarado por adelantado en un claim file cuya
sección *Out Of Scope* nombraba los sistemas del otro (`coord/claims/T-002-*.md`).
Las fronteras previsibles se resolvieron antes de empezar: el motor de ejercicios de
Khan es de A, Khanmigo es de C; el modelo adaptativo de Duolingo es de A, sus
features LLM son de C; manim es de B aunque aparezca en el bake-off. Cada agente
escribió **un único archivo**, el suyo. Ninguno tocó `docs/PLAN.md`, `docs/BRIEF.md`
ni `coord/decisions/*`, congelados durante toda la tarea.

Los tres carriles declararon en §4 no haber invadido a los otros, y las tres
declaraciones son consistentes con lo que hay en los archivos.

**Verificación.** El riesgo típico de una tarea de prior art no es la pereza, es la
cifra plausible que nadie publicó. Revisé el carril B contra las fuentes y levanté
dos `[blocker]`: un *"$100.000 y 500 horas por simulación de PhET"* y un *"<16 ms en
navegadores viejos"* de EconGraphs, ambos etiquetados `[verificado:]` sin serlo. agy
aceptó los dos y corrigió su archivo; la evidencia de PhET quedó en lo que sí publica
su *design process* (meses de equipos profesionales, 4–6 entrevistas think-aloud por
simulación). El carril A llegó con fuentes primarias y marcas `[sin-verificar]`
propias donde no pudo sostener algo, incluido el reconocimiento de que Squirrel AI y
GIFT quedaron fuera por no encontrar más que arquitectura de marketing.

Este documento distingue siempre **hallazgo con fuente** de **inferencia mía**.

---

## 1. El hallazgo que más peso tiene, porque llegó por dos caminos que no se hablan

Dos carriles, dos literaturas sin relación entre sí, la misma conclusión:

**El rendimiento del estudiante *con* el tutor delante no dice nada sobre si aprendió.**

- **Carril A (codex), desde los logs de los ITS clásicos.** En ASSISTments, pedir una
  pista **invalida esa oportunidad** para la racha de mastery. En Cognitive Tutor,
  la respuesta obtenida tras un *bottom-out hint* no es evidencia de dominio. Los dos
  intentos serios de suprimir el *gaming* por la vía del castigo o la fricción
  fracasaron en lo que importa: "Scooter" bajó el gaming observado de 33% a 18%
  (p=0,07) **sin mejora de aprendizaje** (p=0,73), y el Help Tutor redujo el
  drill-down al bottom-out de 72% a 46% (p<0,001), también **sin mejora de
  aprendizaje** (p=0,95). Lo único que se asoció a ganancias fue **volver a medir el
  paso eludido con un ítem nuevo**.
- **Carril C (claude), desde un RCT sobre LLMs.** Bastani et al. (PNAS 2025, ~1.000
  alumnos de secundaria, tres brazos): con GPT sin guardarraíles, **+48% durante la
  práctica asistida y −17% en el examen sin asistencia**. Con el GPT-Tutor con
  guardarraíles, **+127% en práctica y plano en el examen**.

*(Inferencia mía.)* Que una literatura de trazas de comportamiento de los años 2000 y
un ensayo aleatorizado sobre LLMs de 2025 converjan en lo mismo es la señal más fuerte
que produjo esta investigación. No es una opinión de diseño: es el criterio que separa
un tutor que enseña de uno que resuelve por el estudiante.

**Consecuencia directa para tutorIA.** El PoC, tal y como está diseñado, **no tiene
ninguna señal capaz de detectar que está fallando de esta manera**. El brief cierra
—con razón pedagógica— que nunca hay nota, y el efecto secundario no buscado es que
todo lo que mediremos ocurre con el tutor delante. Un tutorIA que produjera exactamente
el resultado del brazo sin guardarraíles se vería, en nuestra telemetría actual,
idéntico a uno excelente.

---

## 2. Lo que el prior art **confirma** del plan

Barato de decir y valioso de saber. Estas decisiones de Kristian salen reforzadas:

| Decisión del brief | Qué la respalda |
|---|---|
| **12** — el tutor interrumpe en checkpoints diseñados, no chat siempre abierto | Khanmigo, el mayor despliegue existente, obtiene **15% de uso activo** de los alumnos elegibles pese a 108M de interacciones, y lo están rediseñando para ser **visible durante la tarea** en vez de esperar la pregunta. (C) |
| **9** — catálogo curado de misconceptions, con distractores que las delatan | Es exactamente el diseño de las *diagnostic questions* de Eedi: 125k alumnos, 28k preguntas, 20M respuestas. (C) |
| **7** — cuatro remediaciones, incluida "marcar para revisión humana" | Tutor CoPilot: **+4pp** de dominio, **+9pp** para alumnos de los tutores peor valorados, ~$20/tutor/año. La vía humana es la de mejor evidencia del carril, no el cajón de sastre. (C) |
| **22** — alternativa textual al gráfico manipulable | PhET tiene un framework de **descripciones de estado** leídas por lector de pantalla; es prior art directo. (B) |
| **16** — proveedor de LLM intercambiable | LearnLM sostiene que la pedagogía es *seguimiento de instrucciones pedagógicas*: vive en el prompt y la rúbrica, no en los pesos. Si es así, cambiar de proveedor no destruye el diseño. (C) |
| **4** — delivery corto seguido de práctica | *Doer effect* (OLI/CMU): una SD extra de *hacer* se asoció a **0,44 SD** en quiz, más de seis veces el coeficiente de ver o leer. Correlacional, no RCT — codex lo marca explícitamente. (A) |

---

## 3. Lo que el prior art dice que el plan tiene **mal calibrado**

### 3.1 Los números del PLAN no tienen base empírica — y no la tienen porque **no existe**

Carril A, hallazgo central: **no hay umbral de mastery ni tope de intentos universal**.
Lo que hay son políticas atadas a un instrumento y un currículo concretos:

- MATHia: proficiency 0,95 por KC, pero promociona al agotar un máximo **de problemas**,
  no de oportunidades por KC. En 2018–19, ~424.000 workspaces (11,2% de 3,78M)
  terminaron sin mastery.
- ASSISTments: tres correctas seguidas sin ayuda; pausa a las 10 preguntas.
- Khan: estados discretos y **reversibles** — un challenge mixto puede *bajar* el nivel.

Y la prueba de que el corte fabrica el resultado: dos definiciones razonables de
*wheel-spinning* sobre los mismos datos etiquetaron **6,6% frente a 24,2%**.

> **Propuesta de codex (A-B):** retirar `stuck := attempts ≥ 6` del PLAN y sustituirlo
> por tres salidas distintas — `provisional_mastery` (tras evidencia independiente),
> `budget_exhausted` (tope configurable de preguntas **de la actividad**) e
> `indeterminate` (no hubo evidencia suficiente) — registrando `stop_rule_version`.
> El 6 no es un umbral: es un marcador de posición que el PLAN presenta como decisión.

> **Propuesta de codex (A-A):** las "12 sub-skills esenciales + 3 de integración" no
> están validadas por nada (él mismo lo marca `[sin-verificar]`). Mantenerlas como
> hipótesis y exigir que **ninguna decisión de cierre dependa de una sola observación**;
> si dos sub-skills siempre aparecen juntas, se fusionan.

### 3.2 El bake-off mide **sólo una parte** del costo

> **Corregido tras un `[blocker]` de codex (dissent, rev 18 del thread), aceptado.**
> Mi versión anterior decía que el bake-off "mide la mitad barata" y que lo caro es el
> modelo pedagógico. Eso es una **ordenación comparativa** y ningún carril la sostiene:
> nadie midió horas ni costo del modelo pedagógico, no hay unidad de costo común entre
> carriles, y este mismo documento registra que una simulación de PhET consume equipos
> profesionales durante meses — o sea, la superficie también puede ser carísima. Lo que
> la evidencia sí sostiene es una **omisión**, no un ranking. Detalle en §5 bis.

*(Inferencia mía, cruzando los tres carriles.)* El criterio 3 pregunta "¿cuánto cuesta
el concepto número 20?" y lo responde comparando tecnologías de render. Hay un costo
que esa comparación **no mira en absoluto**: el de escribir el modelo pedagógico — el
pack de sub-skills con sus pesos, las reglas de parada, y el catálogo de misconceptions.

Lo que sabemos de ese costo omitido:

- Es **autoría manual y no automatizable por volumen de datos**: Eedi, con 20M de
  respuestas, no pudo derivar el mapa distractor→misconception y tuvo que lanzar una
  competencia para etiquetarlo a mano. (C)
- Es **específico del currículo**: la estructura de sub-skills, los umbrales y las
  reglas de parada no son portables entre sistemas. (A)
- **No existe catálogo con id estable para economía** — Eedi lo tiene para matemáticas
  (~2,5k ids), pero los instrumentos de economía incrustan el error dentro del texto del
  distractor sin nombrarlo ni identificarlo. Sí existe, en cambio, un inventario
  validado del que partir: ver §3.4. (C)

Y lo que **no** sabemos, y por tanto no afirmo: cuánto cuesta eso en horas, ni si es
más o menos que producir la superficie. El carril B muestra que la abstracción correcta
(*Computation Layer* de Desmos) **puede** hundir el costo de superficie — es una vía
plausible, no una medición.

**Conclusión que sí se sostiene:** el costo de autoría pedagógica es material, hoy no
está presupuestado en el PLAN, y podría dominar el costo del concepto 20. Antes de
afirmar qué mitad es la cara, hay que medirlo — y medirlo debería ser parte del
bake-off, no una conjetura previa.

**Desacuerdo entre revisores, registrado y no promediado:** agy respaldó explícitamente
mi versión original ("la superficie visual es resoluble de forma barata; el esfuerzo
costoso será escribir el catálogo"). codex la refutó como `[blocker]`. Me pongo del lado
de codex: la objeción de agy es sobre plausibilidad y la de codex es sobre qué puede
sostener la evidencia recogida, que es el estándar que yo mismo impuse en el encargo.

### 3.3 El bake-off no contempla la opción que ya cumple cuatro decisiones a la vez

De la verificación del carril B salió el prior art más directo de toda la tarea:

**EconGraphs**, de Christopher Makler, lecturer de Stanford y autor del material de
**Econ 50** — micro intermedia, el mismo nivel del curso de Kristian. ~350 gráficos
interactivos cuya sección *Consumer Theory* cubre **literalmente nuestros dos
conceptos** más efectos ingreso-sustitución. Embebible por iframe **sin login**.

Su motor, **KGJS** (`github.com/cmakler/kgjs`, **licencia MIT**), *"renderiza diagramas
interactivos definidos como JSON"* usando **D3** (SVG en el DOM), mathjs y **KaTeX**.

*(Inferencia mía.)* Eso satisface a la vez cuatro cosas que el brief pide por separado:
DOM para accesibilidad y equipos modestos (criterio 5 y decisión 22), **KaTeX** (decisión
21), una abstracción declarativa como la que agy propone copiar de Desmos — y, sobre
todo, **un formato JSON es exactamente lo que un LLM puede generar al vuelo**, que es
el futuro declarado del proyecto (criterio 2). Ninguna de las cuatro opciones A/B/C/D
del bake-off tiene esa combinación.

**Distinción que decide si se puede usar:** el **motor es MIT**; el **contenido de
Makler conserva su copyright**. Reusar el motor, sí. Embeber sus gráficos, él lo
autoriza expresamente. Copiar sus lecciones, no.

---

### 3.4 Existe el inventario de conceptos de micro intermedia, y el plan no lo usa

El carril C, tras una pasada de verificación adversarial, encontró **IESA-Micro**
(Cornell Suite, `econ-assessments.org`): el análogo del *Force Concept Inventory* para
micro intermedia. 31 preguntas de opción múltiple; su sección III, *The Consumer's
Problem*, cubre **literalmente el alcance de tutorIA** con 22 *learning goals*
—presupuesto y cómo cambia, pendiente como costo de oportunidad, preferencias y
utilidad, tangencia, soluciones de esquina, Slutsky—. Validación reportada: correlación
con la nota del examen final de 0,45, 0,56 y 0,33 en tres cohortes (n=61, 140, 120).

Lo decisivo no son los ítems, es **cómo los construyeron**: learning goals escritos
*antes* que los ítems; juicio de profesores de dentro y fuera de Cornell; y
**entrevistas think-aloud con estudiantes que ya habían cursado la materia**, de donde
salieron los distractores. Es decir, sus distractores vienen de errores observados en
estudiantes reales — exactamente la fuente de evidencia que nuestro catálogo, escrito
por cuatro modelos de lenguaje, no tiene.

**Acción inmediata, y es la única de todo este documento que tiene prisa:** el
cuestionario se pide por formulario en
`https://www.econ-assessments.org/pages/IESA-Micro.html`. Es gratis y el *lead time* es
desconocido, así que si va a pedirse, conviene pedirlo ya: si llega, sus ítems de
*consumer choice* sirven como **set dorado externo pre-etiquetado**, y eso reduce
mucho lo que tendrías que etiquetar a mano.

*(Higiene de citas, del propio carril C: un investigador afirmó que IESA-Micro se usa
"en 7 cursos de 4 instituciones R1". **Es fabricado** — confusión con las 7 evaluaciones
del Cornell Suite. La fuente sólo dice uso activo en Cornell y pilotos en otras
instituciones, sin cuantificar.)*

---

## 4. Lo que hay que decidir, Kristian — y que ningún agente puede decidir por ti

### D-1 · El chequeo de transferencia (roza tu decisión 10)

Propuesta: al cerrar un concepto, **uno o dos ítems nuevos, sin asistencia, sin nota y
sin presentarse al alumno como evaluación**, cuyo resultado alimente **solo** el
diagnóstico del instructor que tu decisión 6 ya promete.

- **A favor:** es el único instrumento que distingue "el alumno aprendió" de "el tutor
  resolvió por él". Los dos carriles independientes de la §1 apuntan ahí.
- **En contra:** roza la frontera de tu decisión 10 (nunca hay nota). Yo sostengo que
  no la rompe —el alumno nunca ve una calificación— pero la frontera es tuya.
- **Si lo rechazas**, la decisión debería registrarse junto con lo que se pierde: el PoC
  no podrá afirmar que enseña, solo que gusta.

### D-2 · ¿Se evalúa EconGraphs/KGJS como quinta opción del bake-off?

agy propuso una "opción E" web pura; la versión afilada es concreta: **evaluar el motor
KGJS (MIT) frente a las cuatro opciones**. El costo de mirarlo es bajo y podría ahorrar
todo el timebox de alguna de las otras. La decisión 24 exige que las opciones compartan
guion y gráfico, así que añadir una quinta tiene un costo real de protocolo.

### D-3 · ¿Quién escribe la *Computation Layer*: el docente o el LLM?

Es la pregunta abierta que dejó agy y es la que fija el costo del concepto 20. Hoy el
PLAN no la responde.

---

## 5. Límites honestos de esta investigación

- **El juez LLM es más débil justo donde el brief dice que más aporta.** En respuesta
  abierta, el acuerdo LLM–humano queda **por debajo** del acuerdo entre dos humanos
  (QWK 0,585–0,640 frente a ICC humano 0,667–0,800) y **empeora cuanto mayor es la
  complejidad cognitiva** del criterio. La salida no es abandonarlo: es bajarlo de
  *puntuar* a *clasificar* contra el catálogo de misconceptions, y no dejar que el
  mastery dependa de una sola señal. (C)
- **Matiz importante sobre el catálogo de misconceptions.** Una versión anterior de este
  documento afirmaba que no existe nada publicado para nuestros dos conceptos y que el
  catálogo lo escribirías tú desde cero. **Es falso**, y lo corrigió la verificación
  adversarial del carril C: existe **IESA-Micro** (§3.4). Lo que sí es cierto, y más
  preciso, es que **ningún instrumento de economía asigna un identificador estable a la
  misconception** — la incrustan en el texto del distractor sin nombrarla. Ese contrato
  de `id`, que sí necesitamos, no tiene precedente público en economía: es a la vez la
  oportunidad y el riesgo, porque nadie ha validado que esa taxonomía sea estable. (C)
- **No existe una política publicada que elija entre tus cuatro remediaciones con las
  señales del plan.** AutoTutor aporta una escalera finita de ayuda
  (`pump → hint → prompt → assertion`) con ganancia media reportada de 0,81 SD sobre
  diez experimentos; el anti-gaming aporta el re-test focalizado. La combinación es una
  síntesis nuestra, **no un algoritmo validado como conjunto**. codex lo declara así en
  su §4 y me parece la afirmación más honesta de toda la tarea. (A)
- **No hay estudios de fiabilidad de LLM-as-judge en economía**: todo lo sólido es
  matemáticas, medicina y escritura. Extrapolamos. (C)
- **DKT queda descartado** para este PoC: mejora el AUC de predicción pero puede *bajar*
  la estimación de dominio tras una respuesta correcta. Mejor AUC no es mejor decisión
  pedagógica. (A)

---

## 5 bis. La ronda de revisión: qué pasó con esta síntesis

La sometí a codex y agy pidiéndoles explícitamente que intentaran tumbar la afirmación
más fuerte, y que revisaran sobre todo la **atribución** — porque en T-001 los errores
de procedencia los cazó siempre el agente perjudicado y nunca yo, que era el redactor.

- **agy:** acepta íntegramente. Confirma que afilar su "opción E" hacia KGJS es
  inferencia mía sobre su propuesta y no una apropiación, y que sus datos de EconGraphs
  están bien citados. Sin blockers. *(Nota de metadatos: su mensaje quedó con
  `ack: false` por no pasar la bandera; el contenido es una aceptación inequívoca.
  Es el mismo tropiezo que tuvo codex en T-001.)*
- **codex:** un `[blocker]` como dissent formal, **contra la conclusión de §3.2**, y
  tiene razón. Yo había saltado de "el bake-off omite un costo" a "el bake-off mide la
  mitad barata", que es una ordenación comparativa que ningún carril midió. Peor: el
  propio documento cita a PhET consumiendo equipos profesionales durante meses, o sea
  contradecía mi propia afirmación dos secciones más arriba. Aceptado y corregido.

Vale la pena registrar el patrón: la afirmación que cayó es exactamente la que yo había
señalado como "la conclusión con más consecuencias prácticas del documento". Las que
venían con fuente primaria aguantaron; la que era inferencia mía sin medición, no.
Los dos carriles ajenos sobrevivieron intactos a la revisión; el trozo que falló era
mío.

---

## 6. Incidencia de proceso que afecta a la confianza en el registro

Durante T-002, `coord-pulse` dejó de poder despertar a codex: al anotar H-002 en
`coord/HUMAN.md`, la decisión de arranque pasó a `fresh:human-open-item` y el proceso
hijo murió a los 3,2 s **sin emitir un solo byte** — indistinguible, desde el thread, de
un agente que ignora el encargo. Descarté flag, `--json`, carrera entre wakes y gate
ejecutando yo mismo el argv resuelto, que funciona. El carril A se desbloqueó con un
wake manual documentado; **no cerré H-002** para arreglarlo, porque sería borrar una
decisión pendiente tuya para tapar un fallo de herramienta. Detalle completo en el
`protocol-gap` del thread de T-002.

---

## 7. Índice

- Carril A — `coord/work/codex/T-002-carril-A-motor-mastery.md` (10 fichas, 19 fuentes)
- Carril B — `coord/work/agy/T-002-carril-B-delivery-manipulables.md` (6 fichas, revisado y corregido)
- Carril C — `coord/work/claude/T-002-carril-C-tutores-llm-juez.md` (8 fichas, 13 fuentes)
- Thread — `coord/threads/2026-08-10-T-002-prior-art-sistemas-de-aprendizaje-similares.md`
- Claims — `coord/claims/T-002-{codex,agy,claude}-*.md`

Las fuentes con URL y fecha de consulta viven en la §5 de cada carril. Este documento no
las duplica: si un dato de aquí importa, su fuente exacta está en el carril indicado
entre paréntesis.
