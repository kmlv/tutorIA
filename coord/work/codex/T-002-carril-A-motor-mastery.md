# T-002 / Carril A — Motor de mastery, remediacion y salida segura

- Agente: codex
- Carril: A — mastery, knowledge tracing, remediacion y modos de fallo
- Fecha UTC: 2026-08-10
- ACCESO A WEB: **si**
- Herramientas usadas: `web.run` (busqueda y apertura de fuentes), lectura local
  de `coord/` y de `docs/BRIEF.md`/`docs/PLAN.md`; fuentes primarias u oficiales
  siempre que estuvieron disponibles.
- Regla de evidencia: `[S#]` remite a la fuente exacta de §5; lo que no pude
  sostener se marca `[sin-verificar]`.

## §1. Tabla resumen

| Sistema / literatura | Que resuelve | Evidencia util para tutorIA | ¿Transferible? |
|---|---|---|---|
| MATHia / Cognitive Tutor | juicio, remediacion, cierre | BKT por KC, umbral publicado de 0.95 y promocion al agotar un maximo de **problemas**, no de oportunidades por KC; 11.2% de 3.78 M de workspaces terminaron sin mastery en 2018–19. [S1][S2] | **Si**, con parametros calibrables y cap a nivel de actividad |
| ALEKS | preguntas, juicio, cierre | Mantiene una distribucion probabilistica sobre estados de conocimiento; pregunta por informacion y practica el *outer fringe* del estado estimado, con reassessment. [S3] | **Parcial**: copiar frontera de prerrequisitos, no su infraestructura combinatoria |
| ASSISTments Skill Builders + ARRS | preguntas, remediacion, cierre | Tres correctas consecutivas sin ayuda producen mastery provisional; al llegar a 10 sin lograrlo, pausa; ARRS vuelve a medir a 7/14/28/56 dias y reasigna practica si falla. [S4][S5] | **Si**, especialmente mastery provisional + revalidacion |
| OLI / doer effect | delivery, preguntas | En el MOOC estudiado, una desviacion estandar adicional de *doing* se asocio con 0.44 SD en quiz, mas de seis veces el coeficiente de ver/leer; el estudio es observacional con inferencia causal, no un RCT. [S6] | **Si**, para intercalar evidencia activa, no para fijar un umbral |
| Khan Academy Mastery | preguntas, juicio, cierre | Estados discretos familiar/proficient/mastered; mastered exige demostrar el skill en un test/challenge, y los challenges espaciados pueden subir o bajar el estado. [S7][S8] | **Si**, como separacion entre practica y confirmacion |
| Duolingo HLR / Birdbrain | preguntas, juicio, remediacion | HLR estima recall como funcion del tiempo desde practica y una vida media aprendida; Birdbrain combina competencia del alumno y dificultad del ejercicio para seleccionar la siguiente sesion. [S9][S10] | **Parcial**: copiar tiempo+dificultad; no entrenar ML en el PoC |
| AutoTutor | juicio, remediacion, cierre | Escalera determinista pump → hint → prompt → assertion, guiada por expectativas cubiertas; diez experimentos, >1000 participantes y ganancia media reportada de 0.81 SD. [S11][S12] | **Si**, como escalera finita de ayuda, no como dialogo abierto ilimitado |
| BKT / PFA / DKT | juicio, cierre | BKT ofrece estado interpretable por KC; PFA usa exitos y fallos separados; DKT mejora prediccion en benchmarks pero puede bajar mastery tras una respuesta correcta y producir trayectorias ondulantes. [S13][S14][S15] | **Si BKT/PFA**, **no DKT** para este PoC pequeño y auditable |
| Wheel-spinning / predictive stability | cierre, remediacion | Dos criterios razonables producen prevalencias muy distintas; en tres datasets, 3-correctas-en-10 dio 6.6%, 0.56%, 10.2%, y PS++ dio 24.2%, 2.17%, 13.2%. [S16] | **Si**, como alarma calibrada, no como verdad ontologica |
| Gaming y abuso de pistas | juicio, remediacion | Retrasar hints puede crear nuevas estrategias de gaming; practica suplementaria sobre el paso eludido tuvo mejor señal de aprendizaje que expresar enfado, y un Help Tutor redujo el drill-down al bottom-out hint de 72% a 46% sin mejorar el aprendizaje global. [S17][S18] | **Si**, como instrumentacion y re-test; no castigo |

## §2. Fichas

### 1. MATHia / Cognitive Tutor — model tracing dentro del problema y BKT entre problemas

- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC7334700/
- Estado: vivo. La documentacion de soporte actual de Carnegie Learning sigue
  describiendo proficiency por skill en MATHia. [S2]
- Que resuelve de nuestro ciclo: preguntas | juicio | remediacion | cierre.
- Mecanismo concreto: cada paso de un problema se enlaza con uno o mas knowledge
  components (KCs); el *model tracing* contrasta el paso con caminos de solucion y
  habilita feedback/hints contextuales, mientras BKT mantiene una probabilidad de
  mastery por KC. [S1][S13] MATHia publica proficiency en 0.95, pero el avance del
  workspace no depende solo de contar oportunidades de un KC: se gradua al dominar
  todos los KCs o se promociona al alcanzar un maximo fijo de problemas aun sin
  dominar todos. [S1][S2]
- Evidencia: en 2018–19 casi 300,000 estudiantes completaron unos 3.78 millones de
  workspaces bajo ese regimen; aproximadamente 424,000 (11.2%) terminaron sin
  dominar el workspace. La tasa variaba desde casi cero hasta mas de 20% segun el
  workspace, dato que el equipo usa para localizar contenido que requiere mejora.
  [S1]
- Que copiamos: separar (a) evidencia fina por sub-skill de (b) presupuesto de
  problemas de la actividad; conservar un estado `promoted/partial` honesto y mandar
  al instructor los workspaces con alta tasa de salida parcial. [S1]
- Que NO copiamos, y por que: no copiar 0.95 como constante universal ni el volumen
  de unas 700 KCs por grado; ambos pertenecen a un sistema con datos y curriculum a
  otra escala. [S1][S2]
- Confianza: [verificado:https://pmc.ncbi.nlm.nih.gov/articles/PMC7334700/]

### 2. ALEKS — estado de conocimiento combinatorio y practica en la frontera

- URL: https://doi.org/10.1016/j.jmp.2021.102512
- Estado: vivo; el articulo de 2021 reporta cuatro a cinco millones de estudiantes
  por ano. [S3]
- Que resuelve de nuestro ciclo: preguntas | juicio | remediacion | cierre.
- Mecanismo concreto: el estado no es una nota escalar sino un conjunto plausible de
  items que el estudiante domina dentro de una estructura de prerrequisitos. La
  evaluacion escoge el item mas informativo, actualiza probabilidades de estados y
  termina cuando emerge un estado con probabilidad muy alta. En learning mode ofrece
  items del *outer fringe*: los inmediatamente alcanzables desde el estado estimado;
  luego hace progress assessments para verificar lo aprendido. Para estructuras
  enormes, ALEKS proyecta el espacio completo en subestructuras manejables y propaga
  informacion entre ellas. [S3]
- Evidencia: el articulo analiza la implementacion a escala y documenta el uso anual
  de cuatro a cinco millones de estudiantes; no encontre en la fuente abierta un
  efecto causal unico que pueda atribuirse solo a la politica *outer fringe*. [S3]
- Que copiamos: representar prerrequisitos entre las 12 sub-skills esenciales y
  escoger una pregunta de la frontera: no preguntar optimizacion si aun no hay
  evidencia de factibilidad y pendiente. Esta es una propuesta de transferencia desde
  el mecanismo, no un resultado causal para microeconomia. [S3]
- Que NO copiamos, y por que: no construir un knowledge space exhaustivo ni inferencia
  combinatoria para dos conceptos; el costo y la escala no se justifican en el PoC.
  [S3]
- Confianza: [verificado:https://doi.org/10.1016/j.jmp.2021.102512]

### 3. ASSISTments Skill Builders + ARRS — mastery provisional con revalidacion espaciada

- URL: https://www.assistments.org/blog-posts/how-assistments-skillbuilders-works-in-my-class-and-why-it-will-work-for-you-too
- Estado: vivo; ASSISTments sigue publicando Skill Builders y su investigacion de
  reassessment/relearning. [S4][S5]
- Que resuelve de nuestro ciclo: preguntas | juicio | remediacion | cierre.
- Mecanismo concreto: un Skill Builder toma items aleatorios de un banco de una sola
  skill hasta conseguir tres respuestas correctas seguidas; pedir hint invalida esa
  oportunidad para la racha. Si no se logra en 10 preguntas, el sistema para y pide
  volver otro dia. ARRS prueba un item nuevo tras 7 dias; si acierta vuelve a probar a
  14, 28 y 56 dias desde el inicio; si falla, reasigna el Skill Builder bajo las mismas
  tres-correctas-seguidas. [S4]
- Evidencia: un RCT de ARRS reportado por ASSISTments incluyo 97 estudiantes de
  octavo grado y 32 skills; las skills reassessed/relearned tuvieron mejor desempeno,
  especialmente entre quienes empezaron bajo. [S5] Un estudio de deteccion de
  wheel-spinning uso 26,522 estudiantes y 1,088 Skill Builders, pero sus etiquetas
  dependen de la definicion elegida y no validan por si solas el numero 10. [S16]
- Que copiamos: distinguir `mastery_provisional` al cerrar la sesion de
  `mastery_retained` tras un item nuevo y espaciado; hints, re-explicaciones y
  bottom-out answers no cuentan como evidencia independiente de dominio. [S4][S5]
- Que NO copiamos, y por que: no adoptar literalmente tres correctas ni 10 intentos;
  son una heuristica de plataforma y otra investigacion advierte que aprendizaje puede
  aparecer despues de la oportunidad 10. [S1]
- Confianza: [verificado:https://www.assistments.org/blog-posts/how-assistments-skillbuilders-works-in-my-class-and-why-it-will-work-for-you-too]

### 4. Open Learning Initiative / doer effect — el motor necesita evidencia activa intercalada

- URL: https://pact.cs.cmu.edu/pubs/koedinger%2C%20Kim%2C%20Jia%2C%20McLaughlin%2C%20Bier%202015.pdf
- Estado: academico y con plataforma OLI viva. [S6]
- Que resuelve de nuestro ciclo: delivery | preguntas | juicio.
- Mecanismo concreto: OLI intercala actividades de *learning by doing* con paginas y
  otros materiales; cada actividad produce evidencia observable que puede alimentar
  el modelo del estudiante, a diferencia de inferir dominio por ver contenido. [S6]
- Evidencia: en el MOOC de psicologia analizado, una desviacion estandar extra de
  *doing* se relaciono con 0.44 SD de aumento en quiz; los coeficientes de ver video o
  leer fueron cercanos a 0.065, por lo que la asociacion de doing fue mas de seis veces
  mayor. Los autores declaran que los datos son correlacionales aunque aplican busqueda
  causal y controles; no debe presentarse como un RCT. [S6]
- Que copiamos: cada re-explicacion debe terminar en una accion nueva y puntuable
  sobre la misma sub-skill; escuchar/ver por si solo registra exposicion, nunca mastery.
  [S6]
- Que NO copiamos, y por que: no convertir “6x” en expectativa de efecto para tutorIA;
  es un coeficiente relativo de un curso y diseno concretos. [S6]
- Confianza: [verificado:https://pact.cs.cmu.edu/pubs/koedinger%2C%20Kim%2C%20Jia%2C%20McLaughlin%2C%20Bier%202015.pdf]

### 5. Khan Academy Mastery — practica separada de confirmacion y estado reversible

- URL: https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery
- Estado: vivo. [S7][S8]
- Que resuelve de nuestro ciclo: preguntas | juicio | cierre.
- Mecanismo concreto: la skill progresa por estados discretos —attempted, familiar,
  proficient, mastered—; obtener mastered requiere demostrar la skill en un Unit Test,
  Course Challenge o Mastery Challenge, no solo repetir el ejercicio de practica. [S7]
  Un Mastery Challenge mezcla tres skills, dos preguntas por skill, seleccionadas segun
  tiempo desde la ultima revision y nivel actual: 2/2 sube, 0/2 baja, 1/2 conserva el
  nivel. Solo se abre tras al menos 12 horas desde el challenge anterior. [S8]
- Evidencia: Khan reporta validez convergente, no causalidad, entre la proporcion de
  skills proficient/mastered y MAP Growth aun controlando amplitud de skills y tiempo
  en plataforma. [S7] El mecanismo exacto de challenges esta documentado por la propia
  plataforma. [S8]
- Que copiamos: `developing → provisional → retained`, con un mixed challenge que
  pueda bajar el estado si aparece olvido; no hacer monotono el mastery por decreto.
  [S8]
- Que NO copiamos, y por que: no copiar mastery points ni recompensas; son UX y no una
  probabilidad calibrada de conocimiento. [S7]
- Confianza: [verificado:https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery]

### 6. Duolingo HLR / Birdbrain — tiempo, dificultad y recall previsto para elegir practica

- URL: https://research.duolingo.com/papers/settles.acl16.pdf
- Estado: vivo; Duolingo sigue describiendo Birdbrain como selector de practica.
  [S9][S10]
- Que resuelve de nuestro ciclo: preguntas | juicio | remediacion.
- Mecanismo concreto: Half-Life Regression modela la probabilidad de recordar como
  `p = 2^(-delta/h)`, donde `delta` es tiempo desde practica y `h` una vida media
  estimada a partir de exitos, fallos y dificultad del item/lexema. [S9] Birdbrain
  estima competencia del alumno y dificultad de cada ejercicio; el Session Generator
  usa esa probabilidad para escoger material ni demasiado facil ni demasiado dificil.
  [S10]
- Evidencia: HLR se evaluo con 12.9 millones de trazas student-word; Duolingo reporta
  error absoluto medio de 0.13, casi la mitad del metodo Leitner anterior. En A/B tests
  de producto reporto +9.5% retencion diaria de sesiones de practica, +1.7% de lessons
  y +12% de actividad total; son metricas de engagement reportadas por la empresa, no
  una prueba directa de transferencia academica. [S9]
- Que copiamos: guardar `last_evidence_at`, dificultad del item y modalidad; tras una
  pausa temporal, priorizar una comprobacion breve de sub-skills antes dominadas.
  [S9]
- Que NO copiamos, y por que: no entrenar HLR/Birdbrain con dos conceptos y pocos
  alumnos; usar sus variables como schema e hipotesis hasta reunir datos. [S9][S10]
- Confianza: [verificado:https://research.duolingo.com/papers/settles.acl16.pdf]

### 7. AutoTutor — escalera de ayuda que termina, en vez de insistencia conversacional infinita

- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC3748232/
- Estado: academico; la familia AutoTutor tiene implementaciones y estudios, pero no
  verifique un producto comercial actual. [S11]
- Que resuelve de nuestro ciclo: preguntas | juicio | remediacion | cierre.
- Mecanismo concreto: el script define una respuesta ideal y expectativas que deben
  aparecer. Para una expectativa ausente, el tutor escala de *pump* abierto (“¿algo
  mas?”) a hint, prompt que pide una pieza concreta y, finalmente, assertion que la
  entrega; despues resume y avanza. [S11][S12]
- Evidencia: la revision de AutoTutor Lite resume diez experimentos controlados con mas
  de 1,000 participantes, ganancias significativas de 0.2 a 1.5 SD y media 0.81 SD;
  agrupa dominios, medidas y versiones, por lo que no es un efecto garantizado para
  tutorIA. [S11]
- Que copiamos: una escalera finita y auditable `pregunta abierta → pista → prompt
  cerrado → ejemplo/assertion → item isomorfo nuevo`; registrar en que escalon aparece
  la evidencia. [S11][S12]
- Que NO copiamos, y por que: no usar similitud semantica de dialogo como mastery ni
  producir scripts conversacionales exhaustivos en el PoC. [S11]
- Confianza: [verificado:https://pmc.ncbi.nlm.nih.gov/articles/PMC3748232/]

### 8. BKT / PFA / DKT — tres familias que no significan lo mismo

- URL: https://papers.nips.cc/paper_files/paper/2015/hash/bac9162b47c56fc8a4d2a519803d51b3-Abstract.html
- Estado: academico y con BKT/PFA desplegados en ITS vivos. [S1][S13][S14]
- Que resuelve de nuestro ciclo: juicio | cierre.
- Mecanismo concreto: BKT es un HMM binario latente por KC con `prior`, `learn`,
  `guess` y `slip`; una respuesta actualiza el posterior y despues aplica la transicion
  de aprendizaje. [S13] PFA usa una regresion logistica con parametros por KC y cuenta
  exitos y fallos previos por separado, pudiendo modelar varios KCs por accion. [S14]
  DKT alimenta la secuencia de item+resultado a una RNN y predice la probabilidad de
  acierto futuro para todos los items/KCs sin requerir el mismo etiquetado experto.
  [S15]
- Evidencia: el DKT original reporto una mejora de 25% en AUC sobre el mejor resultado
  previo de un benchmark. [S15] Estudios posteriores encontraron dos fallos para usar
  esa prediccion como “mastery”: puede disminuir la estimacion del KC despues de una
  respuesta correcta y producir oscilaciones bruscas entre pasos; regularizacion
  especifica reduce esos fallos. [S15]
- Que copiamos: para el PoC, un estado interpretable por KC con exitos, fallos,
  modalidad, ayuda y tiempo; ajustar BKT o una logistica tipo PFA offline cuando haya
  trazas etiquetadas, comparando calibracion y no solo AUC. [S13][S14][S15]
- Que NO copiamos, y por que: no DKT ni “mejor AUC = mejor decision pedagogica”; el
  estado debe explicar por que remedia o cierra y el volumen inicial no soporta una
  RNN. La insuficiencia de volumen del PoC es una inferencia de alcance, no un umbral
  publicado. [S15]
- Confianza: [verificado:https://papers.nips.cc/paper_files/paper/2015/hash/bac9162b47c56fc8a4d2a519803d51b3-Abstract.html]

### 9. Wheel-spinning / predictive stability — detectar que mas practica ya no cambia el pronostico

- URL: https://files.eric.ed.gov/fulltext/ED594575.pdf
- Estado: academico. [S16]
- Que resuelve de nuestro ciclo: remediacion | cierre.
- Mecanismo concreto: Beck/Gong operationalizan wheel-spinning como no lograr tres
  correctas seguidas en las primeras 10 oportunidades. Predictive Stability (PS) para
  cuando la probabilidad del siguiente acierto se estabiliza; PS++ distingue si esa
  meseta estable esta cerca del limite superior (mastery) o abajo (wheel-spinning).
  [S16]
- Evidencia: en tres datasets, el criterio 3-en-10 etiqueto 6.6%, 0.56% y 10.2% de
  pares student-KC como wheel-spinning; PS++ etiqueto 24.2%, 2.17% y 13.2%. Un random
  forest fue el detector temprano mas consistente, pero una regresion logistica de una
  sola feature tambien logro desempeno temprano razonable. [S16]
- Que copiamos: tratar `stuck` como una decision operacional con version de regla,
  no como rasgo del alumno; guardar pendiente/estabilidad de `P(correct next)` y
  declarar `indeterminate` cuando falta evidencia. [S16]
- Que NO copiamos, y por que: no fijar 6, 10 o 15 por analogia. MATHia documenta que
  esos cortes no coinciden con su politica real y que el cap debe alinearse con la
  unidad que consume tiempo: el problema/workspace, no necesariamente el KC. [S1]
- Confianza: [verificado:https://files.eric.ed.gov/fulltext/ED594575.pdf]

### 10. Gaming y abuso de pistas — el bypass es una senal diagnostica, no mastery

- URL: https://www.cs.cmu.edu/~rsbaker/Baker175.pdf
- Estado: academico, con mecanismos observados en Cognitive Tutor. [S17][S18]
- Que resuelve de nuestro ciclo: juicio | remediacion | cierre.
- Mecanismo concreto: gaming danino incluye guessing sistematico y peticiones rapidas
  de hints sobre pasos que el alumno conoce peor. Intentos de impedirlo con dos segundos
  entre hints o ayuda obligatoria despues de tres errores produjeron nuevas estrategias,
  como repetir el mismo error para disparar ayuda sin demora. [S17] La alternativa
  “Scooter” detectaba el paso eludido y asignaba hasta tres ejercicios suplementarios
  sobre ese contenido, el ultimo muy facil para terminar la secuencia. [S17] El Help
  Tutor modelaba ademas help abuse, help avoidance, try-step abuse/avoidance y daba
  feedback metacognitivo sin bloquear la conducta. [S18]
- Evidencia: Scooter redujo estudiantes observados haciendo gaming de 33% a 18%, pero
  solo con significancia marginal (`p=0.07`) y sin mejora global de aprendizaje
  (`p=0.73`). El tercio que recibio mas practica suplementaria si aprendio mas que los
  otros (`p=0.03`), mientras expresar enfado no se asocio con mas aprendizaje. [S17]
  En 60 estudiantes, Help Tutor redujo drill-down al bottom-out hint de 72% a 46%
  (`p<0.001`), pero tampoco mejoro aprendizaje global (`p=0.95`). [S18]
- Que copiamos: eventos `rapid_guess`, `rapid_hint`, `bottom_out_seen` y
  `same_answer_repeat`; la evidencia asistida no sube mastery; al detectar bypass,
  presentar un item isomorfo nuevo sobre la misma sub-skill y contar solo la respuesta
  independiente. [S17][S18]
- Que NO copiamos, y por que: no expresar enfado, penalizar ni confiar en delays. La
  literatura muestra desplazamiento del gaming y ausencia de efecto de aprendizaje
  para el componente punitivo/metacognitivo por si solo. [S17][S18]
- Confianza: [verificado:https://www.cs.cmu.edu/~rsbaker/Baker175.pdf]

## §3. Tres hallazgos que cambiarian `docs/PLAN.md`

### Hallazgo A — La sub-skill debe ser una hipotesis medible, no solo una etiqueta de contenido

- Seccion afectada: `docs/PLAN.md` §3.1 “Sub-skills”, §3.2 “Mastery” y M1.
- Cambio propuesto: conservar provisionalmente las 12 KCs esenciales + 3 de
  integracion, pero definir cada KC como una unidad inferible a traves de **varios
  items relacionados** y declarar para cada pregunta su vector `kc_weights`. Antes de
  fijar el pack, hacer una auditoria barata: (1) ningun item de cierre depende de una
  unica observacion; (2) las curvas de exito por oportunidad no son planas o
  descendentes sin explicacion; (3) si dos KCs siempre aparecen juntas, se marcan para
  fusion/re-diseno; (4) si una pregunta exige varias, no se propaga el score global por
  igual a todas. El KLI define KCs por patrones de desempeno sobre tareas relacionadas,
  y PFA existe precisamente para modelar multiples KCs por accion. [S13][S14][S19]
- Evidencia que lo sostiene: MATHia llega a unas 700 KCs por grado y aun refina sus
  modelos; el numero no es portable. [S1] KLI distingue procesos de memoria/fluidez,
  induccion/refinamiento y comprension/sense-making, que requieren eventos
  instruccionales distintos. [S19] Para solo dos conceptos, el valor no esta en sumar
  KCs sino en poder obtener al menos dos evidencias distintas por cada una; no encontre
  evidencia que valide exactamente “12 + 3” para microeconomia. [sin-verificar]

### Hallazgo B — Separar mastery provisional, retencion y salida por presupuesto; retirar `attempts ≥ 6` como verdad

- Seccion afectada: `docs/PLAN.md` §3.2, §3.3 R4 y §7 `mastery`/`events`.
- Cambio propuesto: reemplazar `stuck := attempts ≥ 6` por tres salidas:
  `provisional_mastery` (gate actual, tras evidencia independiente),
  `budget_exhausted` (cap configurable de **preguntas de la actividad**, no por KC) e
  `indeterminate` (no hubo evidencia suficiente). En una sesion posterior, un challenge
  mixto puede promover a `retained` o reabrir a `developing`. Registrar
  `stop_rule_version`, `problems_seen`, `kc_opportunities` y `p_correct_slope`; el
  valor inicial del cap sigue siendo hipotesis del PoC y debe salir de un pilotaje, no
  de la cifra 6. [S1][S4][S8][S16]
- Evidencia que lo sostiene: ASSISTments usa tres correctas y pausa en 10, Khan exige
  una confirmacion en challenge espaciado, y MATHia usa 0.95 pero promociona por un
  maximo de problemas del workspace. [S1][S2][S4][S8] Dos definiciones de
  wheel-spinning variaron hasta 6.6% vs 24.2% sobre el mismo dataset MATHia, prueba de
  que el corte fabrica buena parte de la etiqueta. [S16]

### Hallazgo C — Añadir una politica anti-gaming que invalide evidencia asistida y remida el paso eludido

- Seccion afectada: `docs/PLAN.md` §3.2 “Sin doble penalizacion”, §3.3 politica de
  remediacion y §9 riesgos.
- Cambio propuesto: antes de R0–R4, clasificar la **calidad de la oportunidad**. Una
  respuesta tras bottom-out, rapid-fire hints, guessing rapido o repeticion identica no
  aumenta mastery ni activa castigo: genera un item isomorfo nuevo sobre la misma KC,
  con ayuda reiniciada. Tras dos bypasses, bajar dificultad; tras el presupuesto de la
  actividad, cerrar parcial y marcar revision. No usar delay fijo como barrera; si se
  conserva, que sea solo para legibilidad. [S17][S18]
- Evidencia que lo sostiene: los delays produjeron estrategias nuevas de gaming. La
  practica suplementaria focalizada se asocio con ganancias, mientras el enfado no;
  Help Tutor cambio el uso de hints pero no el aprendizaje global. [S17][S18] La
  conclusion prudente es medir aprendizaje con una oportunidad nueva e independiente,
  no confundir completar con dominar. [S17][S18]

## §4. Huecos, colisiones y preguntas abiertas

- No encontre un numero empirico universal para `mastery_threshold` ni
  `max_attempts`; 0.95 (MATHia), tres-correctas (ASSISTments) y estados discretos
  (Khan) son politicas ligadas a instrumentos y curriculum concretos. [S1][S2][S4][S8]
- No encontre evidencia que valide exactamente 12 KCs esenciales + 3 de integracion
  para linea presupuestaria y curva de indiferencia. Debe tratarse como modelo inicial
  a contrastar con respuestas reales. [sin-verificar]
- No encontre una politica publicada que elija exactamente entre las cuatro acciones
  de Kristian con las mismas senales del plan. AutoTutor aporta una escalera de ayuda;
  gaming aporta re-test focalizado; la combinacion propuesta es una sintesis, no un
  algoritmo validado como conjunto. [S11][S12][S17][S18]
- La calibracion de BKT/PFA requiere mas trazas de las que probablemente existan al
  arrancar el PoC; no encontre un minimo de muestra portable. [sin-verificar]
- Colision evitada con carril C: AutoTutor usa listas de expectativas y
  misconceptions, pero aqui solo investigue su **politica de movimientos y parada**;
  no investigue catalogos, LLM-as-judge ni tutores LLM.
- Colision evitada con carril B: no investigue graficos, PhET, Desmos, manim, costos de
  produccion ni compatibilidad.
- Squirrel AI y GIFT quedaron fuera de las diez fichas: encontre descripciones de
  arquitectura/marketing, pero no una fuente abierta suficientemente concreta que
  mejorara los mecanismos ya documentados sin sacrificar profundidad. [sin-verificar]

## §5. Fuentes

Fecha de consulta para todas: **2026-08-10**.

- **[S1]** Fancsali et al., “Towards Practical Detection of Unproductive
  Struggle” (MATHia; mecanismo, escala y desalineacion de stopping rules):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7334700/
- **[S2]** Carnegie Learning Support, “Understanding the Skills Report”
  (proficiency 0.95):
  https://www.carnegielearning.com/texas-help/article/understanding-the-skills-report/
- **[S3]** Falmagne et al., “A practical perspective on knowledge space theory:
  ALEKS and its data”, *Journal of Mathematical Psychology* 101 (2021):
  https://doi.org/10.1016/j.jmp.2021.102512
- **[S4]** ASSISTments, “How ASSISTments Skill Builders Works in My Class”
  (3-correctas, cap 10, ARRS 7/14/28/56):
  https://www.assistments.org/blog-posts/how-assistments-skillbuilders-works-in-my-class-and-why-it-will-work-for-you-too
- **[S5]** ASSISTments Research, “Students Retain Math Skill Mastery Through
  Reassessment and Relearning” (RCT, n=97, 32 skills):
  https://www.assistments.org/blog-posts/our-research-reassessing-and-relearning
- **[S6]** Koedinger et al. (2015), “Learning is Not a Spectator Sport: Doing is
  Better than Watching for Learning from a MOOC”:
  https://pact.cs.cmu.edu/pubs/koedinger%2C%20Kim%2C%20Jia%2C%20McLaughlin%2C%20Bier%202015.pdf
- **[S7]** Khan Academy, “Why Khan Academy will be using skills to proficient to
  measure learning outcomes”:
  https://blog.khanacademy.org/why-khan-academy-will-be-using-skills-to-proficient-to-measure-learning-outcomes/
- **[S8]** Khan Academy Help Center, “What are Mastery Challenges in course
  mastery?”:
  https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery
- **[S9]** Settles & Meeder (2016), “A Trainable Spaced Repetition Model for
  Language Learning”:
  https://research.duolingo.com/papers/settles.acl16.pdf
- **[S10]** Duolingo, “Learning how to help you learn: Introducing Birdbrain”:
  https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/
- **[S11]** Graesser et al., “The Development and Analysis of Tutorial Dialogues
  in AutoTutor Lite”:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3748232/
- **[S12]** Graesser et al., “Teaching Tactics and Dialog in AutoTutor”:
  https://people.cs.pitt.edu/~litman/courses/cs3710_s02/graesser.pdf
- **[S13]** Koedinger, “Cognitive Tutors” / overview of model tracing and
  knowledge tracing:
  https://www.andrew.cmu.edu/course/85-412/readings/koedinger.pdf
- **[S14]** Pavlik, Cen & Koedinger (2009), “Performance Factors Analysis — A New
  Alternative to Knowledge Tracing”:
  https://files.eric.ed.gov/fulltext/ED506305.pdf
- **[S15]** Piech et al. (2015), “Deep Knowledge Tracing”, y Yeung & Yeung (2018),
  “Addressing Two Problems in Deep Knowledge Tracing”:
  https://papers.nips.cc/paper_files/paper/2015/hash/bac9162b47c56fc8a4d2a519803d51b3-Abstract.html
  y https://doi.org/10.1145/3231644.3231647
- **[S16]** Zhang et al., “Early Detection of Wheel Spinning: Comparison across
  Tutors, Models, Features, and Operationalizations”:
  https://files.eric.ed.gov/fulltext/ED594575.pdf
- **[S17]** Baker et al. (2006), “Adapting to When Students Game an Intelligent
  Tutoring System”:
  https://www.cs.cmu.edu/~rsbaker/Baker175.pdf
- **[S18]** Roll et al. (2006), “The Help Tutor: Does Metacognitive Feedback
  Improve Students' Help-Seeking Actions, Skills, and Learning?”:
  https://www.cs.cmu.edu/~bmclaren/pubs/RollEtAl-HelpTutor-ITS2006.pdf
- **[S19]** Koedinger, Corbett & Perfetti (2012), “The Knowledge-Learning-
  Instruction Framework”:
  https://pact.cs.cmu.edu/pubs/KLI-KoedingerCorbettPerfetti2012-pre.pdf
