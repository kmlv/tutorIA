# T-002 · Carril C — El juez: tutores LLM desplegados y evaluacion automatica

| Campo | Valor |
|---|---|
| Agente | claude (Opus 5) |
| Carril | C — tutores LLM en produccion, LLM-as-judge, catalogos de misconceptions |
| Fecha UTC | 2026-08-10T18:40Z |
| **Acceso a web** | **SI** — WebSearch + WebFetch |
| Herramientas | WebSearch, WebFetch, lectura local de docs/BRIEF.md y docs/PLAN.md |
| Fichas | 8 |
| Claim | coord/claims/T-002-claude-carril-C.md |

Regla de evidencia aplicada: toda afirmacion lleva `[verificado:<url>]` o
`[sin-verificar]`. Donde una fuente secundaria contradice a la primaria, gana la
primaria y lo digo.

---

## §1 Tabla resumen

| Sistema | Que resuelve de nuestro ciclo | Evidencia mas dura | Transferible |
|---|---|---|---|
| Khanmigo (tutor + motor de contexto) | juicio, remediacion, UX del chat | A/B sobre ~15M threads: +3.4%, +2.7%, +5.09% | **Si, mucho** |
| Bastani et al. 2025 (GPT Base vs GPT Tutor) | el riesgo de todo el proyecto | RCT ~1.000 alumnos: practica +48% / examen −17% | **Si, critico** |
| Tutor CoPilot (Stanford) | remediacion, rol del humano | RCT 900 tutores / 1.800 alumnos: +4pp, +9pp | Si |
| LearnLM (Google) | juicio, estilo pedagogico | preferencia experta +31% vs GPT-4o; +5.5pp | Parcial |
| LLM-as-judge / ASAG | juez de respuesta abierta | QWK 0.585–0.640 vs ICC humano 0.667–0.800 | **Si, con limite** |
| Eedi / Diagnostic Questions | catalogo de misconceptions, distractores | 125k alumnos, 28k preguntas, 20M respuestas | Si, como metodo |
| Study / Learning modes | UX del chat | solo comparativas de prensa | Poco |
| Prior art interno (AudioExplainer, InteractiveEduHub) | delivery, modelo de datos | codigo en disco | Si |

---

## §2 Fichas

### Khanmigo — tutor LLM de Khan Academy, el unico desplegado a escala con datos publicados
- URL: https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ · https://thelearningstandard.org/news/khan-academy-revamps-ai-tutor-after-low-student-usage
- Estado: vivo. Lanzado 2023; rediseno anunciado para verano 2026.
- Que resuelve: juicio, remediacion, UX del chat.
- **Mecanismo concreto** — esto es lo que vale del carril:
  - **Que le meten al contexto del modelo**: intentos recientes del alumno con
    aciertos y fallos, nivel demostrado en el ejercicio actual, **prerequisitos
    aun no dominados**, y el log de conversacion de la sesion (historial de skill
    de 24 h, convertido de JSON a texto plano).
  - **Como evitan regalar la respuesta**: limitan al agente a razonar **solo sobre
    los pasos que el alumno ya hizo**, no sobre los que faltan. Eso solo redujo
    los incidentes de dar la respuesta un **50%**.
  - **Como bajan el error aritmetico**: un verificador matematico especializado
    corriendo detras, separado del tutor.
  - **Metricas de guardrail que vigilan**: latencia, correccion del siguiente
    item, calidad del engagement cognitivo (pasivo/activo/constructivo), tasa de
    error matematico, incidentes de respuesta regalada, interacciones por thread.
- Evidencia: A/B durante 6 meses sobre ~15M threads de tutoria —
  resumen de historial reciente **+3,4%** de correccion en el siguiente item
  (97,5% de confianza); exponer prerequisitos no dominados **+2,7%** (98,5%);
  pasar el log de conversacion **+5,09%** de engagement cognitivo (99,4%);
  combinado **+6,1%**. `[verificado:blog.khanacademy.org]`
  Adopcion: **solo el 15%** de los alumnos elegibles usa Khanmigo de forma activa,
  pese a 108M de interacciones acumuladas desde 2023. Por eso lo estan
  rediseñando: pasa de ventana de chat pasiva a soporte **visible durante la
  tarea**, que ajusta segun si la skill es nueva o repaso y evalua prerequisitos.
  `[verificado:thelearningstandard.org]`
- **Que copiamos**: (a) el contrato de contexto del juez — estado de mastery +
  prerequisitos + intentos previos, no solo la respuesta actual; (b) el
  verificador determinista separado del LLM; (c) la regla "razona solo sobre los
  pasos ya dados"; (d) la lista de metricas de guardrail, que es practicamente
  una especificacion de telemetria lista para copiar.
- **Que NO copiamos**: el chat abierto como superficie principal. Su propio dato
  de 15% lo condena, y ellos mismos lo estan abandonando.
- Confianza: `[verificado]` en todo lo anterior.

### Bastani, Bastani, Sungu, Ge, Kabakci, Mariman — "Generative AI without guardrails can harm learning"
- URL: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4895486 · PNAS 2025 (https://www.pnas.org/doi/10.1073/pnas.2422633122, 403 al fetch; numeros tomados de SSRN + Knowledge@Wharton)
- Estado: publicado, revisado por pares.
- Que resuelve: es el estudio que define el riesgo central de tutorIA.
- **Mecanismo concreto**: ~1.000 alumnos de secundaria en Turquia, tres brazos —
  **GPT Base** (interfaz tipo ChatGPT sin restricciones), **GPT Tutor** (con
  salvaguardas: pistas en vez de respuestas) y control sin tecnologia. La IA se
  usa **durante la practica**; luego se retira y se examina.
- **Evidencia**:
  - GPT Base: **+48%** frente al control **durante la practica asistida**, y
    **−17%** frente al control **en el examen sin asistencia**.
  - GPT Tutor: **+127%** durante la practica, y en el examen **igual que el
    control** — es decir, la mejora espectacular en practica **no produjo ningun
    aprendizaje transferible medible**.
  `[verificado:knowledge.wharton.upenn.edu + ssrn]`
- **Que copiamos**: la arquitectura del experimento. Medir al alumno *con* el
  tutor no dice nada sobre si aprendio; hay que medirlo *sin* el tutor y sobre
  problemas nuevos.
- **Que NO copiamos**: nada. Es una advertencia, no un diseno.
- **Aviso de higiene de citas**: dos articulos de divulgacion citan el "+127%"
  como prueba de que la tutoria con IA funciona. Es el mismo numero de este
  estudio, y en el estudio ese brazo **no mejoro el examen**. Citar el 127% sin el
  resultado del examen invierte la conclusion del paper. Si aparece en el trabajo
  de otro carril, es esto. `[verificado]`

### Tutor CoPilot — LLM asistiendo a tutores humanos en vivo
- URL: https://edunlp.stanford.edu/projects/tutor-copilot · paper: https://files.eric.ed.gov/fulltext/ED661562.pdf
- Estado: vivo / academico.
- Que resuelve: remediacion, y la pregunta de donde poner al humano.
- **Mecanismo concreto**: el LLM **no habla con el alumno**. Sugiere estrategias
  pedagogicas al tutor humano durante la sesion en vivo; el tutor decide si las
  usa. Primer RCT de un sistema humano-IA en tutoria real.
- Evidencia: 900 tutores, 1.800 alumnos K-12 de comunidades desatendidas.
  **+4 puntos porcentuales** en dominio de temas (p<0,01); **+9pp** para los
  alumnos de los tutores peor valorados. Analisis de 350.000 mensajes: aumenta
  las preguntas indagatorias y reduce el elogio generico. Costo **~$20 por tutor
  y anio**. `[verificado:edunlp.stanford.edu, aiforeducation.io]`
- **Que copiamos**: la cuarta remediacion del brief ("marcar para revision
  humana") deja de ser el cajon de sastre y pasa a ser el canal con mejor
  evidencia del carril. Y el diagnostico crudo por sub-skill que el brief ya
  promete al instructor (decision 6) es exactamente el artefacto que hace util
  esa via.
- **Que NO copiamos**: el modelo operativo completo — no tenemos tutores humanos
  en vivo en el PoC.

### LearnLM — Gemini post-entrenado para seguir instrucciones pedagogicas
- URL: https://arxiv.org/abs/2412.16429
- Estado: vivo, integrado en Gemini.
- Que resuelve: juicio y estilo del tutor.
- **Mecanismo concreto**: replantean "ser pedagogico" como **seguimiento de
  instrucciones pedagogicas** — los ejemplos de entrenamiento llevan instrucciones
  de sistema que describen la pedagogia deseada, en vez de fijar una pedagogia
  unica en los pesos. Co-entrenan con Gemini (mezclado en SFT/RM/RL) en vez de
  post-entrenar despues.
- Evidencia: evaluadores pedagogos expertos lo prefieren **+31% sobre GPT-4o,
  +11% sobre Claude 3.5 Sonnet, +13% sobre Gemini 1.5 Pro**. Reportan **+5,5pp**
  en resolver problemas nuevos tras sesiones cortas. `[verificado:arxiv.org/abs/2412.16429]`
- **Que copiamos**: la tesis de que la pedagogia va en la **instruccion de
  sistema y en la rubrica**, no en la eleccion de modelo. Encaja con la decision
  16 del brief (proveedor intercambiable): si la pedagogia vive en el prompt y en
  la rubrica, cambiar de proveedor no destruye el diseno.
- **Que NO copiamos**: no vamos a post-entrenar nada. Y ojo con el sesgo: la
  evaluacion de preferencia la corre el mismo equipo que hizo el modelo.
- Confianza: numeros `[verificado]`; la lectura del sesgo es mia.

### LLM-as-judge para respuesta abierta (ASAG) — el limite duro del juez
- URLs: https://onlinelibrary.wiley.com/doi/10.1002/jcal.70160 · https://pubmed.ncbi.nlm.nih.gov/40849930/
- Estado: literatura activa 2025–2026.
- Que resuelve: el nucleo de nuestra decision "juez LLM para respuestas abiertas".
- **Mecanismo y numeros**:
  - Educacion en sostenibilidad: acuerdo LLM–humano **QWK 0,585–0,640** (r
    0,660–0,668), frente a fiabilidad entre humanos **ICC 0,667–0,800**. Es decir:
    el LLM queda **por debajo** del acuerdo entre dos humanos.
  - **El acuerdo cae segun sube la complejidad cognitiva del criterio**, con
    acuerdo notablemente bajo en habilidades de orden superior.
  - Medicina: acuerdo experto–experto kappa medio 0,69; el mejor experto–LLM
    quedo en kappa 0,61. `[verificado:wiley, pubmed]`
- **Que copiamos**: bajar la ambicion del juez de *puntuar* a *clasificar*. Pedirle
  "¿que misconception del catalogo se ve en esta respuesta?" es clasificacion con
  etiquetas cerradas; pedirle "¿cuanto sabe este alumno, del 1 al 5?" es
  justamente donde la literatura dice que se cae.
- **Que NO copiamos**: cualquier diseno en que el juicio holistico del LLM sea la
  unica senal para decidir mastery.
- **Consecuencia incomoda**: el juez es mas debil exactamente en el tipo de
  pregunta donde el brief dice que "es donde el juez LLM aporta" (preguntas
  abiertas). No invalida la decision, pero obliga a triangular: numerico
  determinista + distractor mapeado a misconception + juez abierto, y que el
  mastery no dependa de una sola de las tres.

### Eedi / Diagnostic Questions — el metodo para construir el catalogo de misconceptions
- URL: https://arxiv.org/pdf/2104.04034 · https://eedi.com/us/blog/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions
- Estado: vivo (Eedi) + dataset academico.
- Que resuelve: decision 9 (catalogo curado de misconceptions) y los distractores
  de opcion multiple.
- **Mecanismo concreto**: preguntas de opcion multiple donde **cada distractor
  esta disenado para delatar una misconception concreta** — exactamente el diseno
  que el brief ya adopto. Dataset NeurIPS 2020: **125k alumnos, 28k preguntas,
  20M respuestas**. `[verificado:arxiv.org/pdf/2104.04034]`
- **El detalle que mas nos sirve**: aun teniendo los datos, **Eedi no tenia las
  etiquetas que unen distractor con misconception**, y lanzo una competencia de
  Kaggle para construirlas. Una empresa dedicada a esto, con 20M de respuestas,
  no pudo derivar el mapa automaticamente. `[verificado:eedi.com]`
- **Que copiamos**: el catalogo se escribe a mano, por el docente, antes de que
  exista dato. Es autoria, no mineria.
- **Que NO copiamos**: la escala. Con dos conceptos no hay dato suficiente para
  validar nada estadisticamente; la validacion en el PoC es el juicio de Kristian.

### Modos de estudio/aprendizaje de los asistentes generalistas
- URL: comparativas de prensa (tomsguide, whytryai). Sin paper.
- Estado: vivo.
- Que resuelve: poco de lo nuestro, y por eso importa.
- **Mecanismo concreto**: andamiaje socratico por prompt — pistas por capas,
  preguntas en vez de solucion, generacion de preguntas de practica.
- Evidencia: **ninguna publicada** sobre aprendizaje. Solo comparativas
  subjetivas de prensa. `[sin-verificar]` en cuanto a eficacia.
- **Que copiamos**: nada directo.
- **Por que esta la ficha**: delimita nuestro valor. Estos modos no saben que
  concepto estas estudiando, no llevan estado de mastery por sub-skill, no tienen
  catalogo de misconceptions y no tienen contenido verificado del docente.
  tutorIA no compite con ellos en conversacion; compite en **estado y contenido**.

### Prior art interno — AudioExplainer e InteractiveEduHub
- Rutas: `~/GithubRepos/AudioExplainer`, `~/GithubRepos/InteractiveEduHub`
- Que resuelve: delivery y modelo de datos.
- **Mecanismo**: AudioExplainer produce MP3 + transcript sincronizado **a nivel de
  ORACION** (`sync.segments[] = {text, start_s, end_s, part_index, speaker}`,
  `granularity: "sentence"`, `source: "edge-sentence-boundary"`), con
  `formulas[] = {marker, original, mathml, spoken}`.
- **Lo importante ya esta registrado en docs/BRIEF.md §4**: la sincronizacion es
  por oracion, no por palabra. Ningun diseno del juez o del guion debe prometer
  resaltado palabra a palabra sin presupuestar antes esa extension.
- **Que copiamos**: `formulas[].mathml` es el puente natural a KaTeX de la
  decision 21, y ya existe.
- Confianza: `[verificado]` contra el propio repo, ya auditado en T-001.

---

## §3 Los tres hallazgos que cambiarian docs/PLAN.md

### C-1 · El juez necesita un contrato de contexto, y hay evidencia de cuanto vale cada campo
- **Seccion del PLAN afectada**: diseno del juez / estado de mastery.
- **Cambio propuesto**: especificar el *contrato de entrada* del juez, no solo su
  rubrica de salida. Minimo: respuesta actual + sub-skill en juego + estado de
  mastery + **prerequisitos no dominados** + intentos previos de la sesion.
- **Evidencia**: los tres A/B de Khan sobre ~15M threads (+3,4% historial, +2,7%
  prerequisitos, +5,09% log de conversacion, +6,1% combinado). No es opinion de
  diseno: es el unico sitio del carril donde alguien midio campo por campo.
- **Coste**: bajo. Es estructura de prompt, no arquitectura nueva.

### C-2 · El chat abierto no debe ser la superficie principal
- **Seccion del PLAN afectada**: UX del chat (la pregunta abierta del brief:
  burbuja vs panel lateral vs otra) y decision 12 (checkpoints en el guion).
- **Cambio propuesto**: resolver la pregunta abierta hacia **asistencia proactiva
  embebida en la actividad**, con el chat libre como salida secundaria siempre
  disponible pero nunca como el mecanismo del que depende el aprendizaje. Y
  **instrumentar la tasa de uso desde el dia uno** como metrica del PoC.
- **Evidencia**: Khanmigo, el despliegue mas grande que existe, consigue **15%**
  de uso activo y esta siendo rediseñado precisamente para ser visible durante la
  tarea en vez de esperar a que el alumno pregunte.
- **Nota**: esto **refuerza** la decision 12 que Kristian ya tomo. No la
  contradice: le da el numero que le faltaba.

### C-3 · El PoC no tiene ninguna señal capaz de detectar que el tutor daña el aprendizaje
- **Seccion del PLAN afectada**: cierre del ciclo (decision 10, resumen formativo
  sin nota) y criterio de "el PoC funciona".
- **El problema**: el brief cierra —con razon pedagogica— que **nunca hay nota**.
  Consecuencia no buscada: todo lo que mediremos ocurre *con* el tutor delante.
  Bastani et al. muestran que esa es exactamente la medicion que engaña: el brazo
  sin guardarrailes iba **+48% con la IA** y **−17% sin ella**, y el brazo con
  guardarrailes iba **+127% con la IA** y **plano** en el examen. Un tutorIA que
  produjera ese mismo resultado se veria, en nuestra telemetria actual,
  exactamente igual que uno excelente.
- **Cambio propuesto**: un **chequeo de transferencia** al cerrar el concepto —
  uno o dos items nuevos, sin asistencia, sin pistas, **sin nota y sin mostrarse
  como evaluacion al alumno**; su resultado alimenta solo el diagnostico del
  instructor (decision 6, que ya existe). No es una nota: es el unico instrumento
  que distingue "el alumno aprendio" de "el tutor resolvio por el".
- **Tension a declarar, no a esconder**: roza la frontera de la decision 10. Por
  eso va como propuesta a Kristian y no como edicion del PLAN. Si Kristian lo
  rechaza, la decision debe registrarse junto con lo que se pierde: el PoC no
  podra afirmar que enseña, solo que gusta.

---

## §4 Lo que no encontre, colisiones y preguntas abiertas

- **Hueco real: no existe un catalogo publicado de misconceptions de linea
  presupuestaria y curva de indiferencia** comparable al de Eedi en matematicas
  escolar. Busque y solo aparecen paginas de libro de texto y errores genericos
  ("confundir restriccion con preferencia", "tomar un cruce por el optimo en vez
  de la tangencia", "no igualar la utilidad marginal por dolar"). Sirven de
  semilla, no de catalogo. **Consecuencia para el plan**: el catalogo de la
  decision 9 lo tiene que escribir Kristian a partir de sus propios examenes.
  Eedi confirma que ese trabajo es autoria manual incluso con 20M de respuestas.
  Riesgo de calendario que hoy el PLAN no presupuesta.
- **No encontre** ningun estudio de fiabilidad de LLM-as-judge especifico de
  economia; todo lo solido es matematicas, medicina y escritura. Extrapolamos.
- **Colision detectada, no invadida**: la ficha de Khanmigo toca "prerequisitos no
  dominados", que es vocabulario del motor de mastery (carril A, codex). Me limite
  a *que campo entra en el prompt del juez*; **como se calcula** ese estado es de
  codex. Si su carril propone otra representacion, manda la suya.
- **Pregunta abierta para Kristian**: C-3 es la unica propuesta del carril que roza
  una decision suya ya cerrada. La dejo explicita para que la desempate.

---

## §5 Fuentes

| # | Fuente | Consultada |
|---|---|---|
| 1 | https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ | 2026-08-10 |
| 2 | https://thelearningstandard.org/news/khan-academy-revamps-ai-tutor-after-low-student-usage | 2026-08-10 |
| 3 | https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4895486 | 2026-08-10 |
| 4 | https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education/ | 2026-08-10 |
| 5 | https://www.pnas.org/doi/10.1073/pnas.2422633122 | 2026-08-10 (403 al fetch; citada via 3 y 4) |
| 6 | https://edunlp.stanford.edu/projects/tutor-copilot · https://files.eric.ed.gov/fulltext/ED661562.pdf | 2026-08-10 |
| 7 | https://www.aiforeducation.io/blog/stanfords-ai-assisted-tutoring-study | 2026-08-10 |
| 8 | https://arxiv.org/abs/2412.16429 (LearnLM) | 2026-08-10 |
| 9 | https://onlinelibrary.wiley.com/doi/10.1002/jcal.70160 | 2026-08-10 |
| 10 | https://pubmed.ncbi.nlm.nih.gov/40849930/ | 2026-08-10 |
| 11 | https://arxiv.org/pdf/2104.04034 (Diagnostic Questions, NeurIPS 2020) | 2026-08-10 |
| 12 | https://eedi.com/us/blog/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions | 2026-08-10 |
| 13 | https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/ | 2026-08-10 (listada, no citada) |

Todo numero de este documento procede de una de estas fuentes. Los juicios
("es autoria, no mineria"; el sesgo de la evaluacion de LearnLM; la lectura de
C-3) son mios y estan marcados como tales en el texto.
