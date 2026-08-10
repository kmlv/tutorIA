Agente: claude (Opus 5)
Carril: C (el juez: tutores LLM desplegados, defensas anti-alucinacion, fiabilidad de LLM-as-judge)
Fecha UTC: 2026-08-10
ACCESO A WEB: **Si**, verificado. WebSearch + WebFetch, 316 llamadas a herramientas.
Herramientas usadas: Workflow (12 agentes: 6 investigadores + 6 verificadores adversariales),
WebSearch, WebFetch, descarga y conteo directo de datasets.

**Control de calidad de este carril.** Cada afirmacion numerica y cada afirmacion sobre
mecanismo interno paso por un verificador adversarial independiente, instruido para
REFUTAR y con default `no-verificable` salvo que viera la fuente. Resultado sobre 162
afirmaciones: **143 confirmadas, 9 REFUTADAS, 10 no verificables**. Las 9 refutadas
estan corregidas en este documento y listadas en §4 — no se propagan. Ese es el motivo
de que las cifras de abajo difieran en algunos puntos de lo que dicen los resumenes
que circulan.

---

## §1 Tabla resumen

| Sistema | Que resuelve | Evidencia | Transferible |
|---|---|---|---|
| **Khanmigo** | remediacion | 2.0M usuarios SY24-25; el WSJ documento fallos aritmeticos; **cero eficacia independiente publicada** | Si — la separacion razonar/responder |
| **CoMTA** (Khan) | juicio | 188 dialogos; todos los modelos 9-60 puntos peores atrapando errores que confirmando aciertos | Si — el protocolo de gate |
| **LearnLM** | delivery, remediacion | +31% preferencia sobre GPT-4o; RCT N=165: remediacion 93.0% vs 91.2% humano = empate | Parcial — la System Instruction, no el modelo |
| **ChatGPT Study Mode** | delivery | Solo system prompt; **murio sin anuncio**; cero evaluacion de aprendizaje | Si — las restricciones de turno |
| **Tutor CoPilot** | remediacion | RCT preregistrado, 900 tutores, 1.787 alumnos; +4 p.p. ITT; ayuda mas a los tutores peores | Si — el enum cerrado de acciones |
| **Bastani et al.** | — | GPT Base **DANO** el aprendizaje no asistido; GPT Tutor lo dejo en cero | Si — el hallazgo mas importante del carril |
| **MT-Bench** | juicio | El "80% = nivel humano" es S2, pareado, azar 50%, sin correccion | No — y hay que dejar de citarlo |
| **ASAG medico** | juicio | Techo humano kappa 0.69; LLM 0.04-0.61 | Si — medir el techo primero |
| **SRA / SemEval-13** | juicio | macro-F1 cae 0.09-0.13 al pasar a preguntas nuevas | Si — separar items calibrados de nuevos |
| **ASAS mid-range** | juicio | Humanos kappa 0.89-0.98; los LLM colapsan en el rango medio | Si — facetas binarias |
| **IESA-Micro** | preguntas | Inventario de conceptos de micro intermedia; 22 learning goals cubren nuestro alcance | **Si — el hallazgo mas accionable** |
| **Eedi** | juicio | 2.5k misconceptions con id estable, anotadas por docentes | Si — el contrato de id |

---

## §2 Fichas

### Khanmigo (Khan Academy) — capa de tutoria sobre GPT-4o
- URL: https://blog.khanacademy.org/khanmigo-math-computation-and-tutoring-updates/
- Estado: vivo
- Que resuelve: remediacion
- **Mecanismo:** tres piezas documentadas. (1) El calculo numerico **sale del LLM**:
  "We built a calculator for Khanmigo to solve numerical problems instead of relying on
  AI's predictive capabilities". No dicen si es CAS o evaluador numerico. (2) **Inyeccion
  de contexto antes de responder**: recuperan enunciado, pasos, hints y solucion escritos
  por humanos para ese ejercicio concreto. (3) Un bloque oculto donde el modelo **enumera
  las derivaciones plausibles del alumno** antes de elegir el movimiento visible —
  "We have instructed the AI to write out all the ways in which the student may have
  arrived at their answer behind the scenes". La idea transferible: separar **razonar**
  (privado, con herramienta determinista) de **responder** (publico, socratico).
- **Evidencia:** SY23-24: 221.2K usuarios. SY24-25: 2.0M, de los cuales 770K estudiantes
  via Districts. Feb-2024, piloto de ~65.000 alumnos en 44 distritos: el WSJ documento
  que acepto 430 como 27²−17² (es 440) respondiendo "Excellent!", y rechazo como
  incorrecto un 15²−9²=144 correcto. **Eficacia independiente: no publicada a ago-2026.**
  El unico RCT registrado (AEARCTR-0013519, Oreopoulos/J-PAL, ~3.300 alumnos, Tennessee)
  no tiene resultados publicos. Abr-2026, Sal Khan: "For a lot of students, it was a
  non-event... They just didn't use it much".
- **Que copiamos:** el contrato del bloque interno como estructura obligatoria de salida
  del juez, en este orden: (a) resolver el item con el motor determinista — nuestras
  rectas presupuestarias y TMS ya son calculables en codigo; (b) enumerar las derivaciones
  plausibles que llevan a lo que escribio el alumno; (c) recien ahi mapear a un id del
  catalogo. El paso (b) es lo que evita etiquetar por parecido superficial de texto.
- **Que NO copiamos:** la regla blanda "no le digas que se equivoco". Es exactamente la
  politica que produjo el "Excellent!" sobre una respuesta mal en el test del WSJ.
  Tampoco el chat abierto como interaccion primaria: es el modo que Khan mismo reporta
  que los alumnos no usaron.
- Confianza: [verificado:https://blog.khanacademy.org/khanmigo-math-computation-and-tutoring-updates/]
  **Corregido tras verificacion:** la secuencia interna de 4 pasos era inferencia de un
  gist de terceros; solo la enumeracion de derivaciones esta en fuente Khan.

### CoMTA — Conversation-Based Math Tutoring Accuracy Dataset (Miller & DiCerbo, Khan)
- URL: https://github.com/Khan/tutoring-accuracy-dataset
- Estado: academico
- Que resuelve: juicio
- **Mecanismo:** es el metodo con el que Khan mide justo lo que nuestro gate mide.
  Toman conversaciones reales, las anonimizan "without changing any of the math", y
  **truncan cada dialogo en el turno donde el alumno hace una afirmacion matematica**.
  La etiqueta no es el diagnostico sino la **conducta esperada del tutor**, binaria:
  "Answer Accepted" vs "Answer Not Accepted". Luego un segundo LLM puntua con un prompt
  fijo de una linea, temp 0. Eso desacopla "detecto el error" de "lo dijo bonito".
  Detalle operativo: cada item se corrio **10 veces** en modelos OpenAI porque a
  temperatura 0 no eran deterministas.
- **Evidencia:** 188 dialogos; largo medio 10.77 turnos. Resultados (total / alumno-
  incorrecto / alumno-correcto): gpt-4o 78.3 / 68.5 / 85.8; claude-3-opus 75.0 / 56.1 /
  89.6; claude-2.1 65.4 / 31.7 / 91.5. **Todos los modelos son entre 9 y 60 puntos
  peores atrapando errores que confirmando aciertos** (17-60 si se excluye el unico
  modelo fine-tuned). El corrector LLM tiene piso de error propio: "approximately 90%
  accurate".
- **Que copiamos:** el diseno truncar-en-la-afirmacion con etiqueta de conducta esperada
  para los ~30 items ciegos: es mas barato de etiquetar para Kristian que un diagnostico
  completo. Y tres practicas: estratos balanceados en vez de muestra natural; medir la
  **auto-consistencia** del juez repitiendo N veces el mismo item antes de medir acuerdo
  con el docente; y reportar el error del propio metodo de puntuacion.
- **Que NO copiamos:** la etiqueta solo binaria — no puede medir recall sobre 14 ids.
  Tampoco reusar el dataset: la licencia lo limita a evaluacion interna no comercial.
- Confianza: [verificado:https://github.com/Khan/tutoring-accuracy-dataset]
  **Corregido:** el paper dice 106/82 "Answer Accepted"/"Not Accepted", pero el conteo
  directo sobre `CoMTA_dataset.json` da **108/80**. Inconsistencia real entre paper y
  datos de Khan.

### LearnLM (Google DeepMind) — "pedagogical instruction following"
- URL: https://arxiv.org/abs/2412.16429
- Estado: vivo
- Que resuelve: delivery, remediacion
- **Mecanismo:** la tesis del paper es que **no codificaron una pedagogia dentro del
  modelo**. Reencuadran el problema: la pedagogia se expresa como System Instruction en
  tiempo de inferencia, y el post-entrenamiento solo ensena al modelo a **obedecer mejor
  ese tipo de instruccion**. El activo reutilizable es la instruccion, no el modelo.
- **Evidencia:** preferencia de expertos +31% sobre GPT-4o, +11% sobre Claude 3.5 Sonnet,
  +13% sobre Gemini 1.5 Pro. Pero los autores lo acotan ellos mismos: "it is unclear how
  well the results translate to improvements in learning outcomes". Un ano despues,
  el outcome real: RCT en 5 secundarias UK, N=165 (91 control / 74 tutoria), **diseno de
  dos niveles** (alumnos a condicion, y dentro de tutoria las sesiones aleatorizadas),
  3.617 mensajes, plataforma Eedi. Remediacion inmediata: 93.0% [90.4, 95.3] con LearnLM
  vs 91.2% [88.5, 93.6] con tutor humano solo — **empate, intervalos solapados**.
- **Que copiamos:** la pedagogia como System Instruction explicita y **versionada**,
  separada del modelo y del prompt del juez. Y su diseno de evaluacion: comparacion
  pareada a ciegas con rubrica de dimensiones nombradas.
- **Que NO copiamos:** aceptar preferencia de evaluadores como prueba de que algo ensena.
  Google mismo separa ambas cosas, y su unico dato de aprendizaje es un empate.
- Confianza: [verificado:https://arxiv.org/abs/2412.16429]

### ChatGPT Study Mode (y Claude Learning mode)
- URL: https://simonwillison.net/2025/Jul/29/openai-introducing-study-mode/
- Estado: **muerto**
- Que resuelve: delivery
- **Mecanismo:** nada de afinado. Es un system prompt inyectado, **sin herramientas, sin
  estado y sin corrector**. OpenAI lo dice: "powered by custom system instructions".
  Como no habia proteccion, el prompt se extrajo entero y se puede leer como
  especificacion: es una politica de turno.
- **Evidencia:** la prueba mas fuerte de que era solo prompt es **como murio** —
  desaparecio de ChatGPT sin anuncio, sin retraining ni cambios de infraestructura.
  No existe evaluacion de aprendizaje publicada de Study Mode ni de Claude Learning mode:
  cero RCT, cero medida de outcome.
- **Que copiamos:** las restricciones de turno como texto explicito y **testeable de
  forma determinista**: una sola pregunta por turno, prohibido resolver el ejercicio en
  la primera respuesta, respuesta corta.
- **Que NO copiamos:** la arquitectura. Es pedagogia sin estado y sin verificacion: no
  distingue entre lo que el alumno dijo y lo que el alumno sabe.
- Confianza: [verificado:https://simonwillison.net/2025/Jul/29/openai-introducing-study-mode/]
  La fecha exacta de retirada (~abr-2026) es [sin-verificar]: el help center devolvio 403.

### Tutor CoPilot (Stanford + FEV Tutor) — RCT preregistrado
- URL: https://arxiv.org/abs/2410.03017
- Estado: academico
- Que resuelve: remediacion
- **Mecanismo:** es **tutor-facing**: el LLM nunca habla con el estudiante. El tutor
  pulsa un boton y el sistema arma la llamada con tres piezas: los 10 mensajes mas
  recientes (tope duro, para limitar exposicion de datos), el topico, y **una estrategia
  elegida por el humano de un menu FIJO de 7** (dar solucion, ejemplo resuelto, correccion
  menor, problema similar, simplificar, afirmar, animar). El humano elige la categoria;
  el LLM solo la realiza en lenguaje.
- **Evidencia:** preregistro OSF. Aleatorizacion a nivel tutor: 900 asignados, 782 al
  lanzamiento; 1.787 estudiantes, grados 3-8, escuelas Title I, 80% hispanos, 67% en
  desventaja economica. ITT sobre aprobar el exit ticket: **+4 p.p.** (EE 0,01; p<0,01),
  62%→66%, **n=4.136 sesiones**. TOT por 2SLS: +14 p.p. Heterogeneidad: **ayuda mas a los
  tutores peor calificados**.
- **Que copiamos:** el espacio de accion **cerrado por enum** — el humano elige entre 7
  estrategias nombradas y el LLM solo ejecuta. Nuestros ids de misconception validados por
  enum son ese mismo movimiento aplicado al diagnostico.
- **Que NO copiamos:** su outcome como prueba de aprendizaje. El efecto significativo esta
  en el exit ticket de su propia plataforma — una compuerta de progresion interna — y el
  test distal estandarizado salio nulo.
- Confianza: [verificado:https://arxiv.org/abs/2410.03017]
  **Corregido:** la n del exit ticket es **4.136**, no 1.931; 1.931 es la n de los items
  de encuesta del Panel B de la misma tabla. Un investigador cruzo dos filas.

### Bastani et al. — "Generative AI without guardrails can harm learning"
- URL: https://hamsabastani.github.io/education_llm.pdf
- Estado: academico
- Que resuelve: — (es evidencia de riesgo, no un sistema)
- **Mecanismo:** RCT de campo con tres brazos donde la intervencion toca **solo** el
  bloque central de una sesion de 90 min: la clase del profesor y el examen final son
  identicos en todos los brazos, y **cada problema del examen esta emparejado 1:1 con un
  problema de practica casi identico**. GPT Base usa un system prompt tipo ChatGPT;
  GPT Tutor anade guardrails con la solucion canonica del item.
- **Evidencia:** escuela en Turquia, ~1.000 estudiantes, 2.848 observaciones
  estudiante-sesion, clusterizado por aula. **Practica asistida:** GPT Base +0,137 y
  GPT Tutor +0,361 sobre media de control 0,284 — o sea +48% y +127%. **Examen no
  asistido inmediatamente posterior:** GPT Base **negativo**; GPT Tutor ≈ **cero**
  (−0,004). Los guardrails recompraron el dano; no produjeron aprendizaje.
- **Que copiamos:** ground truth por item dentro del prompt — la solucion canonica **mas
  el subconjunto de misconceptions aplicables a ESE item** con su linea correctiva.
- **Que NO copiamos:** citar este paper como evidencia de que un tutor LLM ensena.
- Confianza: [verificado:https://hamsabastani.github.io/education_llm.pdf]

### MT-Bench / Chatbot Arena (Zheng et al., NeurIPS 2023) — el origen del "80%"
- URL: https://arxiv.org/abs/2306.05685
- Estado: vivo
- Que resuelve: juicio
- **Mecanismo:** tres modos: pairwise comparison, single-answer grading 1-10, y
  **reference-guided grading**. El "acuerdo" **no** es porcentaje de items bien
  clasificados: se muestrea una pregunta y un par (voto del juez, voto de un humano) y se
  mide la probabilidad de que elijan el mismo ganador. Definen dos setups: S1 cuenta
  empate como clase valida; **S2 descarta toda comparacion donde alguno voto empate**.
  El 80%+ que se cita siempre es S2 — o sea con los casos dificiles retirados, sobre una
  eleccion binaria cuyo azar es ~50%, **sin correccion por azar**.
- **Evidencia:** S2: GPT-4 vs humano 85%; **humano vs humano 81%**. Consistencia bajo
  swap de orden: GPT-4 65.0%, Claude-v1 23.8%. Auto-preferencia: GPT-4 +10%, Claude-v1
  +25%. Ataque de verbosidad: exito 91.3% en Claude-v1 y GPT-3.5. **Reference-guided
  grading en matematicas: tasa de fallo 70% con prompt por defecto, 15% con referencia
  inyectada.**
- **Que copiamos:** reference-guided grading. Es la mejora verificada mas grande y barata
  del paper. El prompt del juez no debe llevar solo el enum de 14 ids, sino tambien la
  respuesta de referencia del item y la firma diagnostica de cada misconception aplicable.
- **Que NO copiamos:** el titular "80% = nivel humano" como definicion de nuestro gate.
  Es otra tarea, otra metrica y otro azar base.
- Confianza: [verificado:https://arxiv.org/html/2306.05685v4]
  **Corregido:** un investigador reporto un tercer modo "pairwise-with-tie". **No existe**;
  el tercer modo es reference-guided grading.

### Correccion de respuesta corta medica por LLM vs expertos (Medical Education Online, 2025)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC12377152/
- Estado: academico
- Que resuelve: juicio
- **Mecanismo:** es el diseno que deberiamos imitar porque **mide el techo antes de medir
  el juez**. Tres catedraticos corrigen 804 respuestas de forma independiente con rubricas
  estandarizadas — de ahi sale el acuerdo humano-humano. Solo despues entran cinco LLMs,
  en dos condiciones ablacionadas: A1, el modelo se inventa sus criterios; A2, se le
  inyecta la rubrica del experto.
- **Evidencia:** techo humano-humano: **Cohen kappa medio 0.69** (rango 0.57-0.87).
  LLM vs humano: **kappa 0.04-0.61** en ambas condiciones. Ningun LLM igualo
  consistentemente el acuerdo entre expertos. Y el hallazgo incomodo: **dar la rubrica
  experta produjo resultados inconsistentes** — algunos modelos mejoraron y otros
  empeoraron.
- **Que copiamos:** el orden del experimento. tutorIA necesita **dos correctores humanos**
  sobre al menos un subconjunto, o el gate no tiene denominador.
- **Que NO copiamos:** el supuesto de que inyectar el catalogo verbatim mejora el acuerdo.
- Confianza: [verificado:https://pmc.ncbi.nlm.nih.gov/articles/PMC12377152/]
  **Corregido dos veces:** el rango es 0.04-**0.61**, no 0.63. Y el techo humano-humano
  **no es directamente comparable** con el acuerdo LLM-humano: el primero es pareja a
  pareja entre expertos, el segundo se calcula contra el **consenso promediado** de los
  tres. El propio paper lo lista como limitacion.

### SRA corpus / SemEval-2013 Task 7 (Beetle + SciEntsBank)
- URL: https://aclanthology.org/S13-2045/
- Estado: academico
- Que resuelve: juicio
- **Mecanismo:** etiqueta cada respuesta con 1 de 5 categorias de un **enum cerrado**,
  disenado para que un sistema de dialogo elija el movimiento de feedback. La pieza clave
  son **tres conjuntos de test que miden generalizaciones distintas**: UA (respuestas
  nuevas a preguntas vistas), UQ (preguntas nuevas), UD (dominios nuevos). Puntuan con
  macro-F1, y **excluyen las clases demasiado raras**.
- **Evidencia:** mejor macro-F1 5-way: Beetle UA 0.619 / UQ 0.552; SciEntsBank UA 0.581 /
  UQ 0.384 / UD 0.375. **Caida UA→UQ de 0.09 a 0.13.** En Beetle UQ 2-way, los 9 sistemas
  quedaron **por debajo del baseline de solapamiento lexico**.
- **Que copiamos:** partir la evaluacion del gate en "preguntas sobre las que el juez fue
  calibrado" vs "preguntas nuevas". Es la unica forma de saber si el gate se sostiene
  cuando el tutor genera un item que Kristian no etiqueto. Y su regla explicita para
  clases con n insuficiente: excluirlas y decirlo.
- **Que NO copiamos:** sus 5 etiquetas son genericas y **no son diagnosticos**. Nuestro
  catalogo es mas fino, asi que sus F1 son un techo optimista, no una meta.
- Confianza: [verificado:https://aclanthology.org/S13-2045.pdf]

### Quality-Conditioned Agreement in ASAS (Weizmann + ETS, 2026)
- URL: https://arxiv.org/abs/2605.07647
- Estado: academico
- Que resuelve: juicio
- **Mecanismo:** en vez de nota holistica, una rubrica analitica descompone la explicacion
  en **10 categorias binarias independientes**. Al LLM se le invoca **una vez por
  categoria**, 3 veces cada una, por mayoria — nunca juicio libre. Despues condicionan el
  error al nivel de nota gold, y eso revela la U que el promedio agregado esconde.
- **Evidencia:** acuerdo humano-humano **kappa 0.89-0.98** — el regimen de facetas
  binarias es donde los humanos se ponen de acuerdo casi perfectamente. En el **rango
  medio (gold 4-7), 47 de 48 celdas** promedian mas de 2 categorias de error. **El segundo
  humano experto no muestra degradacion en el medio.** Claude Opus 4.5 fue el mejor
  few-shot en un item y de lejos el peor en el otro: inestabilidad entre items.
- **Que copiamos:** descomponer el juicio en **chequeos binarios de facetas** ("¿la
  respuesta afirma que el precio relativo es la pendiente? si/no") en vez de un prompt
  holistico. Mas self-consistency de 3 invocaciones. Y reportar el acuerdo **condicionado
  al nivel de calidad**, no agregado.
- **Que NO copiamos:** el fine-tuning del encoder (necesita n=669 por item; tendremos ~30),
  ni el fan-out de 30 llamadas por respuesta: inviable en tiempo real.
- Confianza: [verificado:https://arxiv.org/pdf/2605.07647]
  **Corregido:** "en los extremos todos los modelos quedan a menos de 1 categoria" es
  falso — Claude Opus 4.5 llega a L1=5.57 en gold 0 del item 2.

### IESA-Micro (Cornell Suite) — el inventario de conceptos de micro intermedia
- URL: https://www.econ-assessments.org/pages/IESA-Micro.html
- Estado: vivo
- Que resuelve: preguntas
- **Mecanismo:** es el analogo del Force Concept Inventory para micro intermedia, **y
  existe**. Su pipeline de construccion es exactamente el que nuestro plan quiere
  improvisar en M1: (1) se documentan los learning goals **antes** de escribir un solo
  item; (2) se redactan MCQ contra esos goals; (3) profesores de dentro y fuera de Cornell
  juzgan si el item evalua pensamiento de experto; (4) **entrevistas think-aloud** con
  estudiantes que ya cursaron la materia; (5) el paso clave — con esas entrevistas "se
  clarificaron las preguntas y **se anadieron respuestas potenciales que correspondian a
  errores comunes**". El distractor sale de datos de estudiantes reales, no de la
  introspeccion del experto.
- **Evidencia:** 31 MCQ. Su seccion III "The Consumer's Problem" cubre **literalmente el
  alcance de tutorIA** con 22 learning goals: A.Budgets 3 (conjunto presupuestario y como
  cambia, pendiente como costo de oportunidad), B.Preferences and Utility 8 (completitud,
  transitividad, monotonicidad, convexidad, MRS), C.Consumer choice 11 (tangencia,
  soluciones de esquina, Slutsky). Validacion: correlacion con la nota del examen final de
  0.45, 0.56 y 0.33 en tres cohortes (n=61, 140, 120).
- **Que copiamos:** el orden del pipeline (learning goals antes que items), la fuente del
  distractor (think-aloud de estudiantes reales), y el reporte por subscore. Y sobre todo:
  **pedir el cuestionario** por el formulario del sitio para usar sus items de consumer
  choice como set dorado externo pre-etiquetado en M3.
- **Que NO copiamos:** su ausencia de ids estables — es justo lo que nuestro catalogo si
  necesita. Ni su naturaleza sumativa de una sola pasada.
- Confianza: [verificado:https://econ-assessments.org/download/IESA-Micro%20Learning%20Goals.pdf]
  **Corregido:** un investigador afirmo "usado en 7 cursos de economia en 4 instituciones
  R1". **Es fabricado.** La fuente dice que las siete *evaluaciones* del Cornell Suite
  estan "in active use at Cornell" y que "several have already been piloted in classrooms
  at other institutions", sin cuantificar. El "7" era una confusion con el numero de
  evaluaciones de la suite.

### Eedi — catalogo de misconceptions con id estable
- URL: https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics
- Estado: vivo
- Que resuelve: juicio
- **Mecanismo:** cada Diagnostic Question es 1 correcta + 3 distractores, y **cada
  distractor lleva anotado por profesores un `MisconceptionId`** con nombre en lenguaje
  natural. Lo decisivo: con ~2.5k entradas el catalogo **no cabe en un prompt**, asi que
  el diagnostico no se plantea como clasificacion sobre un enum sino como **recuperacion**
  (top-25, MAP@25). Y el objetivo declarado es **asistir a etiquetadores humanos**, no
  reemplazarlos.
- **Evidencia:** ~1.8k preguntas, pool de 2.5k+ misconceptions, $55.000 en premios. El
  dataset previo (NeurIPS 2020) aporto >20 millones de respuestas.
- **Que copiamos:** el id estable como contrato, el catalogo escrito por docentes y
  mantenido fuera de la generacion automatica (coincide con C9 del plan), y el
  humano-en-el-lazo como **estado permanente**, no fase transitoria.
- **Que NO copiamos:** la arquitectura de recuperacion. Con 14 entradas el enum en el
  prompt es correcto. Lo que si hay que importar es su **honestidad sobre el conjunto
  abierto**: ellos asumen que existen misconceptions fuera del catalogo.
- Confianza: [verificado:https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics]
  La cifra exacta de preguntas es [sin-verificar]: circula 1.869, no la pude confirmar.
  Usar "~1.8k".

---

## §3 Los tres hallazgos que cambiarian docs/PLAN.md

### H-C1 · El gate de "≥80% de acuerdo" esta mal especificado y se puede pasar sin diagnosticar nada

**Seccion afectada:** §10 D2/D3, §3.4, §8 M3, §9 R1.

**El problema.** Nuestro 80% viene, por herencia cultural, del titular de MT-Bench. Pero
ese 80% es: preferencia **pareada** entre dos respuestas, en setup **S2 con los empates
descartados**, con azar base ~50%, **sin correccion por azar**, y sobre calidad de
respuesta de chatbot. Nuestra tarea es clasificacion multiclase sobre 14 ids con una clase
"sin misconception" dominante. **Un juez que prediga siempre la clase mayoritaria puede
rozar el 80% sin diagnosticar absolutamente nada.** El gate, tal como esta escrito, se
pasa por construccion.

**Cambio propuesto, en cuatro partes:**

1. **Metrica corregida por azar.** El criterio de paso pasa a ser kappa de Cohen (o QWK),
   con el acuerdo bruto reportado al lado como secundario y nunca como titular. Publicar
   siempre el baseline de clase mayoritaria junto al resultado.
2. **Umbral relativo al techo, no absoluto.** Kristian y un segundo corrector etiquetan un
   solapamiento comun → sale `kappa_humano`. El gate es `kappa_juez ≥ 0.75 × kappa_humano`.
   Sin techo medido, "80%" es un numero flotando en el vacio. Referencia externa: en
   correccion de respuesta corta con rubrica, el techo humano fue kappa 0.69 y **ningun
   LLM lo iguala consistentemente** (max 0.61).
3. **Estratificar y exigir la barra donde duele.** La muestra no se toma al azar sino
   estratificada por calidad (claramente correcta / **parcialmente correcta** /
   claramente incorrecta), y la barra se exige en el estrato **parcial** — que es
   exactamente donde viven las misconceptions y donde el acuerdo LLM-humano se derrumba.
   Evidencia: en ASAS, 47 de 48 celdas del rango medio superan 2 categorias de error
   mientras el segundo humano no se degrada; en CoMTA, todos los modelos son 9-60 puntos
   peores atrapando errores que confirmando aciertos.
4. **Valor de escape en el enum.** Anadir `NINGUNA` / `FUERA_DE_CATALOGO` **como opcion
   por defecto**. Sin el, el juez esta obligado a emitir uno de los 14 ids aunque el
   alumno no cometa ningun error o cometa uno que el catalogo no contempla — y la
   validacion enum lo acepta como valido. **El gate "cero IDs fuera de catalogo" de D3
   entonces no mide nada: se pasa por construccion mientras los falsos positivos suben.**

**Y una honestidad que el plan debe escribir:** ~30 respuestas **no pueden** certificar 14
clases; con reparto uniforme son ~2 por clase. El recall por misconception no se decide en
el gate: se declara explicitamente **no medido** y se acumula en sombra hasta tener n≥8
por clase.

### H-C2 · El criterio de dominio puede satisfacerse integramente con desempeno asistido

**Seccion afectada:** §3.2 (criterio `mastered`), §8 M2/M3, §9.

**El problema, con la evidencia mas dura del carril.** Bastani et al. hicieron un RCT donde
la practica asistida por GPT mejoro el rendimiento entre **+48% y +127%** sobre control, y
el examen **no asistido inmediatamente posterior** dio **negativo** para GPT sin guardrails
y **cero** (−0,004) con guardrails. Es decir: **rendimiento asistido y aprendizaje no
asistido estan empiricamente desacoplados, y pueden ir en direcciones opuestas.**

Nuestro criterio actual — nivel ≥0.80, 2 aciertos seguidos, ≥2 modalidades — **puede
cumplirse entero con desempeno asistido**: el estudiante puede haber recibido pista,
feedback del juez o empujon sobre el grafico en cada uno de esos aciertos. Estariamos
midiendo lo que Bastani midio en la fase de practica, que es justo lo que no predijo
aprendizaje.

**Cambio propuesto:**

1. **Cuarta condicion:** al menos uno de los aciertos debe venir de un item resuelto **sin
   andamiaje en ese turno** — sin pista previa, sin feedback del juez antes de enviar, sin
   ayuda sobre el grafico. "Modalidad distinta" no es lo mismo que "sin ayuda".
2. **Subir de 2 a 3 aciertos consecutivos.** El 2 no esta respaldado por nada.
3. **Capar el juez LLM a como mucho 1 de las 3 evidencias** mientras siga por debajo del
   techo humano. Las otras dos vienen de modalidades deterministas.

**Y aqui esta el resultado contraintuitivo que resuelve de paso la preocupacion de
duracion que levante ante Kristian.** Capar el juez a 1 de 3 evidencias baja las respuestas
abiertas juzgadas **de ~24 a ~12 por sesion**, **mientras la evidencia total sube de 2 a 3
por sub-skill**. La sesion se acorta bajando la carga del juez, no bajando la exigencia.
El cuello de botella nunca fue el numero de sub-skills: era cuantas de sus evidencias
tenian que pasar por el componente lento y caro.

### H-C3 · Existe el inventario de conceptos de micro intermedia y el plan no lo usa

**Seccion afectada:** §4 (validacion del catalogo), §8 M1.

**El problema.** El plan dice validar el catalogo de 14 misconceptions "contra examenes
reales de Econ 100A". Eso es correcto pero insuficiente, y ademas hay prior art directo que
no estabamos usando: **IESA-Micro**, del Cornell Suite, es el analogo del Force Concept
Inventory para micro intermedia. Su seccion III, "The Consumer's Problem", cubre
literalmente nuestro alcance con 22 learning goals, y **sus distractores se construyeron
con entrevistas think-aloud a estudiantes que ya habian cursado la materia** — exactamente
la fuente de evidencia que nuestro catalogo, escrito por cuatro modelos de lenguaje, no
tiene.

**Cambio propuesto:**

1. **M1 valida contra Econ 100A *mas* IESA-Micro**, no solo contra Econ 100A.
2. **Mapear las 12 sub-skills nucleo contra los 22 learning goals** de su seccion III, y
   registrar explicitamente que dejamos fuera a proposito (Slutsky, Hicksiana vs
   Marshalliana, soluciones de esquina, transformaciones monotonas) en vez de que el hueco
   quede por accidente.
3. **Accion inmediata, antes de M1:** pedir el cuestionario en
   https://www.econ-assessments.org/pages/IESA-Micro.html — es gratis, por formulario, y
   con lead time desconocido. Si llega, sus items de consumer choice sirven como **set
   dorado externo pre-etiquetado** en M3, lo que reduce muchisimo lo que Kristian tiene que
   etiquetar a mano.
4. **Adoptar su pipeline**: learning goals escritos antes que los items, y distractores
   derivados de think-aloud de estudiantes reales, no de introspeccion.

---

## §4 Lo que NO encontre, colisiones y preguntas abiertas

### Huecos honestos

1. **No existe acuerdo humano-humano publicado para nuestra tarea exacta** — clasificar
   respuesta abierta contra un catalogo curado de misconceptions de economia. El techo que
   cito (kappa 0.69) viene de correccion de respuesta corta medica con rubrica, que es la
   analogia mas cercana que hay, no una medicion de lo nuestro. **Por eso el gate debe
   medir su propio techo en M3 en vez de importarlo.**
2. **No existe catalogo de misconceptions con id estable para economia.** Eedi lo tiene
   para matematicas (2.5k ids). IESA-Micro y el Cornell Suite **incrustan el error dentro
   del texto del distractor pero nunca lo nombran ni le asignan identificador**, asi que no
   se puede agregar entre items. tutorIA estaria construyendo algo sin precedente publico
   en economia. Eso es una oportunidad y un riesgo: nadie ha validado que esa taxonomia sea
   estable.
3. **Cero eficacia independiente de Khanmigo**, el tutor LLM mas desplegado del mundo, a
   ago-2026. El RCT registrado no tiene resultados publicos.
4. **Cero evaluacion de aprendizaje de los "modos de estudio"** de los chatbots
   generalistas. Y el de OpenAI murio sin anuncio.
5. **Alerta de contenido generado:** circulan blogs SEO que atribuyen a Khanmigo un RCT con
   +0.34 SD en algebra publicado en *Educational Technology Research and Development*. **No
   existe tal paper**, y el propio sitio se autocontradice. Si alguien lo cita, es falso.

### Las 9 afirmaciones REFUTADAS por los verificadores

Se listan porque documentan el modo de fallo del propio metodo, no solo el resultado:

| Afirmacion | Realidad |
|---|---|
| MT-Bench tiene un modo "pairwise-with-tie" | No existe; el tercero es reference-guided grading |
| kappa LLM-humano 0.04-**0.63** | 0.04-**0.61**; la afirmacion se autocontradecia |
| El techo humano y el acuerdo LLM son comparables | No: pareja-a-pareja vs contra consenso agregado |
| En los extremos todos los modelos < 1 categoria | Falso; Claude Opus 4.5 llega a L1=5.57 |
| IESA-Micro usado en **7 cursos de 4 instituciones R1** | **Fabricado.** Confusion con las 7 evaluaciones de la suite |
| CoMTA 106/82 | El paper dice 106/82; el JSON publicado dice **108/80** |
| Modelos 17-60 puntos peores atrapando errores | **9**-60; el 17 excluye el modelo fine-tuned |
| Tutor CoPilot n=**1.931** | **4.136**; 1.931 es otra fila de la misma tabla |
| LearnLM aleatoriza a nivel de sesion | Diseno de **dos niveles**: alumnos y luego sesiones |

### Colisiones de carril detectadas

- **Eedi aparece en dos sitios**: como catalogo de misconceptions es mio (C); como
  plataforma sobre la que corrio el RCT de LearnLM tambien es mio. Pero su **motor
  adaptativo** seria de codex (A). No lo investigue.
- **El "menu fijo de 7 estrategias" de Tutor CoPilot** roza la politica de remediacion, que
  es carril A. Lo incluyo porque el mecanismo transferible es el **enum cerrado**, que es
  del juez; la eleccion de *cual* estrategia es de codex.
- **Bastani et al.** mide dano al aprendizaje, lo que roza el motor de mastery (A). Lo
  incluyo porque su implicacion directa es sobre el criterio de dominio, que el juez aplica.

### Preguntas abiertas para Kristian

1. **¿Tienes dos correctores?** H-C1 exige un segundo humano sobre un subconjunto para
   medir el techo. Si eres el unico, el gate pierde su denominador y hay que replantearlo.
2. **¿Pedimos IESA-Micro hoy?** El lead time es desconocido y podria bloquear M1.
3. **El catalogo de 14 no tiene precedente en economia.** ¿Asumimos ese riesgo, o
   derivamos los ids de las entrevistas think-aloud que IESA-Micro ya hizo?

---

## §5 Fuentes

Todas consultadas el 2026-08-10.

- Khan Academy blog, math computation and tutoring updates — https://blog.khanacademy.org/khanmigo-math-computation-and-tutoring-updates/
- Khan Academy Annual Report — https://annualreport.khanacademy.org/
- Miller & DiCerbo, CoMTA dataset — https://github.com/Khan/tutoring-accuracy-dataset
- Reporte de fallos de Khanmigo — https://iblnews.org/khanmigo-struggles-with-basic-math-showed-a-report/
- LearnLM technical report — https://arxiv.org/abs/2412.16429
- ChatGPT Study Mode, prompt extraido — https://simonwillison.net/2025/Jul/29/openai-introducing-study-mode/
- Tutor CoPilot — https://arxiv.org/abs/2410.03017 · preregistro https://osf.io/8d6ha
- Bastani et al., Generative AI without guardrails — https://hamsabastani.github.io/education_llm.pdf
- Zheng et al., Judging LLM-as-a-Judge (MT-Bench) — https://arxiv.org/abs/2306.05685
- LLM grading vs experts, Medical Education Online — https://pmc.ncbi.nlm.nih.gov/articles/PMC12377152/
- SemEval-2013 Task 7 (SRA corpus) — https://aclanthology.org/S13-2045/
- Quality-Conditioned Agreement in ASAS — https://arxiv.org/abs/2605.07647
- IESA-Micro — https://www.econ-assessments.org/pages/IESA-Micro.html · learning goals https://econ-assessments.org/download/IESA-Micro%20Learning%20Goals.pdf · validacion https://pmc.ncbi.nlm.nih.gov/articles/PMC12700375/
- Eedi Mining Misconceptions — https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics · dataset previo https://arxiv.org/abs/2104.04034
