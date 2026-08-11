# T-012 — CARRIL 4: Adyacentes (idiomas, programación, corporativo, simulación profesional)

- **Agente:** fable
- **Fecha:** 2026-08-10 (UTC 2026-08-11)
- **Acceso a web:** SÍ (WebSearch + WebFetch). Páginas marcadas [verificado:<url>] fueron
  vistas directamente (fetch) o sostenidas por su propio texto en resultados de búsqueda.
  Lo que viene de memoria o de fuentes secundarias va marcado.
- **Lente:** cantera de mecanismos. Criterio de las 3 plazas: el mecanismo MÁS ROBABLE
  para tutorIA, no el sistema más famoso.

## Cómo elegí las 3 plazas

Cuatro segmentos, tres plazas. Gana idiomas (x2) y simulación profesional (x1):

1. **Duolingo** — el único sistema del carril con sus mecanismos centrales publicados en
   papers con código y datos. Modelo predictivo de acierto por ítem + modelo de memoria.
2. **Speak** — la arquitectura de dos capas (diálogo en tiempo real / juicio pedagógico
   fuera del loop de latencia) es un mapa 1:1 de la decisión 17 del brief de tutorIA.
3. **SimConverse** — juez automático con rúbrica sobre conversación clínica libre +
   autoría de escenarios por educadores. Es el diseño del juez de tutorIA, ya en producción.

Programación y corporativo quedaron sin ficha profunda **a propósito**: sus mejores ideas
(representers de Exercism, RAG corporativo de Sana) son menos robables para un tutor con
juez LLM que las tres de arriba. Las destaco en la cola con nota.

---

## FICHA 1

### Duolingo — Duolingo, Inc. (NASDAQ: DUOL)
- URL: https://www.duolingo.com
- Familia: adyacente-idiomas. Entró porque es el único sistema del carril cuyos mecanismos
  centrales están documentados a nivel de paper reproducible, no de marketing.
- Qué es: app masiva de idiomas gamificada con lecciones cortas y currículo alineado a CEFR.
- **EL MECANISMO ROBABLE** — son dos, complementarios:
  1. **Birdbrain**: modelo ML que, tras cada ejercicio respondido, actualiza una estimación
     de la proficiencia del alumno por concepto gramatical y de la dificultad del ítem, y
     predice la probabilidad de que ese alumno acierte ese ejercicio. El generador de
     sesiones usa esa predicción para armar la siguiente lección a la dificultad correcta.
     Entrenado con la telemetría de cientos de millones de ejercicios diarios; en A/B tests
     mejoró aprendizaje Y retención a la vez.
     [verificado:https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/]
     El objetivo de ~80% de acierto ("zona Goldilocks") aparece en fuentes secundarias,
     no lo vi en la página oficial: [sin-verificar].
  2. **Half-Life Regression (HLR)**: modelo entrenable de repetición espaciada que estima
     la "semivida" de cada palabra en la memoria del alumno a partir del historial de
     práctica y los tiempos entre exposiciones, y programa el repaso cuando la probabilidad
     de recuerdo cae. Redujo el error de predicción de recuerdo 45%+ contra baselines
     (Leitner, Pimsleur, regresión logística). Paper ACL 2016 (Settles & Meeder), con
     código y dataset de 13M de pares alumno-palabra liberados.
     [verificado:https://research.duolingo.com/papers/settles.acl16.pdf]
     [verificado:https://github.com/duolingo/halflife-regression]
- Uso de IA generativa: SÍ, en tres funciones distintas. (a) Generación de contenido: usan
  LLMs para crear lecciones más rápido, con expertos en el loop
  [verificado:https://blog.duolingo.com/large-language-model-duolingo-lessons/ — a nivel de
  título y resumen oficial]. (b) Diálogo y explicación: Duolingo Max ("Roleplay" conversacional
  y "Explain My Answer" sobre errores, con GPT-4) [sin-verificar: no fetché la página oficial
  de Max; ampliamente reportado]. (c) La decisión pedagógica (qué ejercicio te toca) NO es
  generativa: es Birdbrain, ML predictivo clásico. Esa separación es en sí una lección de diseño.
- Sofisticación visible: pulido extremo de producto (streaks, ligas, personajes); la
  adaptividad es deliberadamente invisible — el alumno no ve el modelo, solo nota que casi
  siempre puede. Lo caro está debajo del agua.
- Modelo de autoría: equipos internos de currículo + generación asistida por LLM con
  revisión experta. No hay autoría de terceros (mataron los cursos comunitarios hace años
  [sin-verificar]).
- Estado: vivo, cotiza en bolsa, el mayor del segmento.
- CAPTURA: SÍ. (1) Una lección en curso: fallar un ejercicio a propósito y capturar cómo el
  mismo ítem reaparece al final de la lección — es la mecánica de Birdbrain visible. (2) La
  pantalla de práctica personalizada (Practice Hub / "palabras débiles"), que es HLR en la
  interfaz. (3) Si hay acceso a Max: "Explain My Answer" tras un error.
- Confianza: mecanismos 1 y 2 [verificado] con fuente primaria; detalles de Max y el 80%
  [sin-verificar].

---

## FICHA 2

### Speak — Speak (respaldada por OpenAI Startup Fund [sin-verificar])
- URL: https://www.speak.com
- Familia: adyacente-idiomas (speech-first). Entró por la arquitectura, no por el tamaño:
  es el ejemplo en producción más limpio de cómo separar conversación en tiempo real y
  juicio pedagógico.
- Qué es: tutor de idiomas centrado en HABLAR: lecciones que desembocan en roleplays de
  voz con una IA, con feedback posterior.
- **EL MECANISMO ROBABLE** — la arquitectura de dos capas de "Live Roleplays"
  [verificado:https://www.speak.com/blog/live-roleplays — página leída completa]:
  1. **Capa de diálogo**: OpenAI Realtime API (GPT-4o speech-to-speech, audio directo sin
     pipeline ASR→LLM→TTS). Ellos mismos documentan el porqué: el pipeline por texto creaba
     latencia y errores; con audio directo "el tutor responde tan rápido o más que un humano",
     y el modelo percibe tono, pronunciación y prosodia, no solo el transcript.
  2. **Capa pedagógica, fuera del loop de latencia**: un "proficiency graph" propio que
     rastrea "el estado exacto del conocimiento del alumno" y mantiene el diálogo al nivel
     correcto; objetivos conversacionales explícitos por lección; hints contextuales cuando
     el alumno se atasca; y feedback de precisión y variedad después del roleplay.
  3. La admisión clave, textual en su propio blog: los modelos speech-to-speech "todavía no
     son buenos en tareas finas de enseñanza de idiomas como el coaching de pronunciación" —
     por eso el juicio fino NO vive en el modelo de tiempo real.
  Para tutorIA esto es la decisión 17 del brief hecha producto: modelo rápido/barato para
  el diálogo, juicio pedagógico en una capa aparte con otro presupuesto de latencia y costo.
  Y sus "objetivos + hints" son el patrón de los checkpoints diseñados en guion (decisión 12).
- Uso de IA generativa: SÍ. Diálogo: Realtime API en roleplays abiertos. Evaluación:
  feedback post-conversación sobre precisión y variedad de lenguaje [fuente secundaria:
  https://learn.kotoenglish.com/blog/speak-app-review/]. Decisión pedagógica: el proficiency
  graph (propio, no describen la técnica) decide nivel y objetivos. Contenido: currículo
  propio con método Learn→Practice→Apply
  [verificado:https://www.speak.com/ — marketing propio].
- Sofisticación visible: la latencia ES el producto — conversación de voz sin pausas
  incómodas. Eso es lo que se nota que costó caro.
- Modelo de autoría: interno; no hay autoría de terceros documentada [sin-verificar].
- Estado: vivo, en crecimiento.
- CAPTURA: SÍ. (1) Un Live Roleplay en curso con el objetivo de la lección visible y un
  hint contextual desplegado — muestra las dos capas a la vez. (2) La pantalla de feedback
  posterior al roleplay.
- Confianza: mecanismo central [verificado] en su blog de ingeniería (leído). Detalles de
  feedback y respaldo de OpenAI: secundarios / [sin-verificar].

---

## FICHA 3

### SimConverse — SimConverse (Australia)
- URL: https://www.simconverse.com
- Familia: adyacente-simulación profesional (salud). Entró porque su ciclo
  conversación libre → rúbrica automática → panel institucional es el diseño del juez de
  tutorIA funcionando en producción y con validación publicada por el proveedor.
- Qué es: simulador de comunicación clínica: la IA generativa interpreta por VOZ a
  cualquier paciente o colega, y el sistema califica la conversación contra una rúbrica.
- **EL MECANISMO ROBABLE** — el ciclo completo de cinco etapas
  Preparation → Conversation → Documentation → Feedback → Reflection
  [verificado:https://www.simconverse.com/ — página leída]:
  1. **Roleplay generativo por voz**: la IA interpreta cualquier rol clínico (paciente,
     colega) con historia médica y motivo de consulta; adaptable al nivel del alumno
     [verificado:https://www.healthysimulation.com/simconverse-generative-ai-healthcare-simulation-communication-skills/].
  2. **Calificación automática contra rúbrica**: feedback personalizado "ligado a criterios
     de rúbrica", cuantitativo y cualitativo, con transcript de la conversación para la
     reflexión posterior [verificado: ambas URLs de arriba].
  3. **Panel institucional**: "heatmaps granulares de rúbrica desde toda la institución
     hasta un criterio individual" — la vista docente/institución que casi nadie construye
     [verificado:https://www.simconverse.com/].
  4. **Autoría por educadores**: el educador define visuales, voces, personajes, acciones,
     estudios complementarios, rúbricas y artefactos escritos; "currículos enteros
     montados en minutos" [verificado:https://www.simconverse.com/ — es marketing propio;
     el costo real de autoría no está documentado públicamente].
  Para tutorIA: (2) es el juez LLM con rúbrica sobre respuesta abierta (decisiones 6 y 7);
  (3) es el diagnóstico crudo por sub-skill para el instructor; (4) es el criterio 4 del
  bake-off (¿puede crear contenido alguien que no programa?). Reporte del proveedor:
  mejora de 1.65 DE en el framework SEGUE de comunicación en enfermería
  [verificado:https://www.simconverse.com/research — reportado por el proveedor, no
  peer-review independiente; recordar que esto es censo, no revisión de evidencia].
- Uso de IA generativa: SÍ, en las tres: diálogo (el paciente simulado), evaluación
  (calificación automática cuali+cuanti contra rúbrica) y autoría (montaje de escenarios).
  La decisión pedagógica de qué escenario toca sigue siendo del educador.
- Sofisticación visible: avatares fotorrealistas y conversación por voz; el pulido está en
  el flujo completo pre-brief → simulación → debrief, calcado del protocolo de simulación
  clínica presencial.
- Modelo de autoría: educadores sin código, con biblioteca de escenarios compartida
  [sin-verificar el tamaño de la biblioteca].
- Estado: vivo; desplegado en universidades (Villanova, King's College London entre otras)
  [verificado:https://www.villanova.edu/villanova/nursing/newsevents/archives/SimConverse.html].
- CAPTURA: SÍ, si se consigue demo/trial (es B2B, puede requerir registro). (1) Conversación
  de voz con un paciente simulado. (2) La pantalla de feedback desglosada por criterio de
  rúbrica — la captura que más vale para tutorIA. (3) El heatmap institucional si es accesible.
- Confianza: mecanismo [verificado] en sitio propio + cobertura especializada
  (HealthySimulation). Cifras de eficacia: del proveedor.

---

## §4 — Rozaduras con otros carriles (una línea cada una)

- **Speak** corre sobre OpenAI Realtime API; si el carril 3 cubre ChatGPT voice/study
  modes, lo mío aquí es la INTEGRACIÓN curricular (proficiency graph, objetivos, hints),
  no el API.
- **Duolingo** entero es mío por frontera resuelta del encargo (Birdbrain y repetición
  espaciada incluidos).
- **Sana** genera contenido didáctico desde documentos con RAG; si carril 3 toca
  generadores docentes (MagicSchool), es el mismo patrón en otro mercado — no lo profundicé.

---

## COLA (tabla larga del carril 4)

Las dos primeras filas de cada segmento son las que más cerca estuvieron de ficha.

| Sistema | Familia | Quién lo hace | Una línea | URL |
|---|---|---|---|---|
| **Exercism** | programación | Exercism (nonprofit) | La mejor idea de ingeniería del segmento: "representers" normalizan cada solución (formato, comentarios, nombres → placeholders) a una representación canónica, y el feedback de un mentor humano a UNA representación llega a todos los alumnos cuya solución normaliza igual — deduplicación de mentoría a escala | [verificado:https://exercism.org/docs/building/product/representers] |
| **Boot.dev** | programación | Boot.dev | "Boots": mentor LLM socrático con acceso a la lección que NO da la respuesta, y pedir su ayuda antes de resolver cuesta XP/ítems del juego — fricción económica explícita para calibrar cuándo pedir ayuda; gratis después de resolver | [verificado:https://blog.boot.dev/wiki/boots/] |
| Codecademy | programación | Skillsoft | Editor en navegador con verificación determinista de ejercicios + asistente IA para errores | https://www.codecademy.com [sin-verificar] |
| DataCamp | programación | DataCamp | Ejercicios en navegador calificados por tests deterministas (SCT) sobre el código del alumno | https://www.datacamp.com [sin-verificar] |
| Replit | programación | Replit | Cursos "100 Days of Code" + IDE en la nube; su ingeniería fuerte (Agent) no es pedagógica | https://replit.com [sin-verificar] |
| **ELSA Speak** | idiomas | ELSA Corp | Diagnóstico de pronunciación a nivel de FONEMA con ASR propietario entrenado en hablantes no nativos: señala el fonema exacto errado y cómo colocar lengua/labios — granularidad de diagnóstico análoga a sub-skills | [verificado:https://elsaspeak.com/en/faqs/how-does-elsas-pronunciation-feedback-work] |
| Memrise | idiomas | Memrise | MemBot (LLM) para práctica conversacional sin juicio + video de hablantes nativos reales | https://www.memrise.com [sin-verificar] |
| Busuu | idiomas | Chegg | Corrección de ejercicios abiertos por la comunidad de hablantes nativos + repaso espaciado | https://www.busuu.com [sin-verificar] |
| Praktika | idiomas | Praktika.ai | Tutores-avatar generativos en video para conversación | https://praktika.ai [sin-verificar] |
| **Sana Learn** | corporativo | Sana (adquirida por Workday, 2025) | Genera cursos interactivos (quizzes, polls, multimedia) desde documentos de la empresa; asistente RAG que responde desde Slack/SharePoint/GitHub del cliente | https://sanalabs.com/platform [mecanismo: fuentes secundarias]; adquisición: [verificado:https://joshbersin.com/2025/09/workday-acquires-sana-to-transform-its-learning-platform-and-much-more/] |
| Docebo | corporativo | Docebo | LMS con IA para etiquetado de skills y generación de contenido | https://www.docebo.com [sin-verificar] |
| 360Learning | corporativo | 360Learning | Autoría colaborativa: expertos internos crean cursos y las "reactions" de alumnos los mejoran — el mecanismo es social, no de IA | https://360learning.com [sin-verificar] |
| **Shadow Health (DCE)** | simulación-salud | Elsevier | Pre-LLM y aún notable: 80+ "Digital Standardized Patients" con Conversation Engine patentado — el alumno pregunta en texto/voz LIBRE y el motor mapea a un modelo de conceptos, con "DCE Score" de completitud de anamnesis contra estándares nacionales | [verificado:https://www.elsevier.com/products/shadow-health] |
| Body Interact | simulación-salud | Take The Wind | Pacientes virtuales con fisiología dinámica que responde en tiempo real a decisiones clínicas (no solo conversación) | https://bodyinteract.com [sin-verificar] |
| CAE Rise | aviación | CAE | Telemetría del simulador full-flight convertida en evaluación objetiva de competencias del piloto contra estándares de la aerolínea | https://www.cae.com [sin-verificar] |
| Osso VR | simulación-quirúrgica | Osso VR | Entrenamiento quirúrgico en VR con scoring de precisión de movimientos | https://www.ossovr.com [sin-verificar] |

**Resumen de capturas que pido** (las hace claude/Kristian): Duolingo ×3, Speak ×2,
SimConverse ×3 (requiere demo B2B). Detalle exacto en cada ficha.
