# T-012 · Carril 3 — Nativos de IA generativa

| Campo | Valor |
|---|---|
| Agente | claude (Opus 5) |
| Carril | 3 — sistemas cuya razón de ser es la IA generativa |
| Fecha UTC | 2026-08-11T02:45Z |
| **Acceso a web** | **SÍ** — WebSearch + WebFetch + navegador headless para capturas |
| Fichas | 6 |
| Cola | 8 |

Lente aplicada: **cantera de mecanismos**. La pregunta de cada ficha no es "¿funciona?"
sino "¿qué hace por dentro que podamos robar?". Criterio de entrada: sofisticación del
mecanismo, no escala. Por eso entra Amira, con dos órdenes de magnitud menos usuarios que
un chatbot generalista, y no entran los asistentes de estudio genéricos.

**El patrón que se repite en cinco de las seis fichas, y que no esperaba encontrar:** los
sistemas serios **no dejan que el modelo invente la jugada pedagógica**. Le dan un menú
cerrado escrito por humanos y el modelo elige dentro. Amira: 60 micro-intervenciones
escritas por científicos de la lectura. Tutor CoPilot: 7 estrategias. Khanmigo: pistas y
soluciones escritas a mano para *ese* ejercicio. Eedi/LearnLM: el humano aprueba cada
mensaje antes de enviarlo. SchoolAI: el docente fija las fronteras antes de que el alumno
entre. La libertad generativa se usa para *realizar* la intervención, no para *elegirla*.

---

## §1 Tabla resumen

| Sistema | Quién | El mecanismo robable en una línea | ¿GenAI para qué? | Captura |
|---|---|---|---|---|
| **Khanmigo** | Khan Academy | El cálculo sale del LLM a una herramienta determinista; contexto inyectado con pistas humanas del ejercicio concreto | diálogo y decisión, no cálculo | sí |
| **LearnLM / Guided Learning** | Google DeepMind | La pedagogía vive en la *system instruction*, no en los pesos: "pedagogical instruction following" | diálogo, andamiaje | sí |
| **NotebookLM** | Google | Anclaje estricto a un corpus cerrado subido por el usuario, con cita clicable a la fuente en cada afirmación | generación anclada, audio, mapas | sí |
| **Amira Learning** | Amira (linaje CMU) | Escucha leer en voz alta, detecta el *miscue* concreto y elige entre **60 micro-intervenciones escritas por científicos de la lectura** | selección de intervención, voz | sí |
| **SchoolAI** | SchoolAI | *Spaces*: el docente fija fronteras de contenido y conducta ANTES de que el alumno entre, y ve cada conversación en vivo | diálogo dentro de un corral | sí |
| **Eedi + LearnLM** | Eedi + Google | La IA **redacta** y el tutor humano aprueba o edita cada mensaje antes de enviarlo | redacción asistida | no |

---

## §2 Fichas

### Khanmigo — Khan Academy
- URL: https://blog.khanacademy.org/khanmigo-math-computation-and-tutoring-updates/
- Familia: nativo genAI. Entra por ser el único despliegue masivo cuyo mecanismo interno
  está documentado por sus propios ingenieros.
- Qué es: capa de tutoría sobre GPT-4o integrada a los ejercicios de Khan Academy.
- **EL MECANISMO ROBABLE** — tres piezas, y las tres son transferibles:
  1. **El cálculo numérico sale del modelo.** Textual: *"We built a calculator for
     Khanmigo to solve numerical problems instead of relying on AI's predictive
     capabilities"*. El tutor no hace aritmética; la delega y luego habla.
  2. **Inyección de contexto autorizado antes de responder**: recuperan enunciado, pasos,
     pistas y solución **escritos por humanos** para ese ejercicio concreto. El modelo no
     improvisa la pedagogía del ítem: la lee.
  3. **Bloque oculto de razonamiento previo**: el modelo *enumera las derivaciones
     plausibles del alumno* antes de elegir el movimiento visible. Separar **razonar**
     (privado, con herramienta) de **responder** (público, socrático).
- Uso de genAI: diálogo y elección de la siguiente jugada. **No** cálculo. **No** creación
  del contenido del ejercicio.
- Sofisticación visible: alta integración curricular; el chat vive pegado al ejercicio.
- Modelo de autoría: humana, previa. El contenido no lo genera el modelo.
- Estado: vivo. 2,0M de usuarios en el curso 24-25.
- CAPTURA: sí — página de producto (el tutor en sí exige cuenta de distrito).
- Confianza: [verificado:blog.khanacademy.org] · mecanismo ya auditado en T-002 carril C.

### LearnLM / Guided Learning — Google DeepMind
- URL: https://arxiv.org/abs/2412.16429 · https://gemini.google/overview/guided-learning/
- Familia: nativo genAI. Entra por resolver el problema de "¿dónde vive la pedagogía?".
- Qué es: familia de modelos y modo de producto donde Gemini se comporta como tutor.
- **EL MECANISMO ROBABLE**: replantean la pedagogía como **seguimiento de instrucciones
  pedagógicas**. Los ejemplos de entrenamiento llevan una *system instruction* que describe
  la pedagogía deseada, en vez de fijar una pedagogía única en los pesos. Consecuencia
  directa para nosotros: **la pedagogía es configuración, no modelo**. Si vive en el prompt
  y la rúbrica, cambiar de proveedor no destruye el diseño — que es exactamente lo que la
  decisión 16 del brief necesita.
- Uso de genAI: todo el diálogo y el andamiaje.
- Sofisticación visible: alta; multimodal, y en Guided Learning genera apoyos visuales.
- Modelo de autoría: no aplica — no hay banco de contenido propio.
- Estado: vivo, integrado en Gemini.
- CAPTURA: sí — página de Guided Learning.
- Confianza: [verificado:arxiv.org/abs/2412.16429]

### NotebookLM — Google
- URL: https://notebooklm.google/
- Familia: nativo genAI. Entra por el mecanismo anti-alucinación mejor resuelto del carril.
- Qué es: espacio de trabajo que responde **solo** sobre las fuentes que tú subes.
- **EL MECANISMO ROBABLE**: **anclaje a corpus cerrado con cita clicable**. Cada afirmación
  del modelo lleva un número que te lleva al fragmento exacto de tu documento. No es "el
  modelo intenta no alucinar": es que la respuesta es inútil si no puede señalar la fuente,
  y la interfaz lo hace evidente. Es el patrón que tutorIA necesita para que el juez
  justifique un diagnóstico citando el fragmento de la respuesta del alumno.
  Segundo mecanismo, distinto y también robable: **transformación de formato sobre el mismo
  corpus** — de las mismas fuentes salen un resumen, un mapa mental y un diálogo de audio
  entre dos voces. Una sola autoría, muchas superficies.
- Uso de genAI: generación anclada, síntesis de audio, mapas.
- Sofisticación visible: muy alta. Es el producto mejor terminado del carril.
- Modelo de autoría: el usuario aporta el corpus; el sistema genera las superficies.
- Estado: vivo.
- CAPTURA: sí — página de producto.
- Confianza: [verificado:notebooklm.google]

### Amira Learning — linaje Carnegie Mellon
- URL: https://www.amiralearning.com/ · https://www.techlearning.com/how-to/amira-learning-teaching-with-the-ai-powered-reading-tool
- Familia: nativo genAI + voz. **Entra por mecanismo puro, no por escala** — y es la ficha
  que más me hizo cambiar de opinión sobre qué es un tutor sofisticado.
- Qué es: tutor de lectura oral. El niño lee en voz alta y el sistema escucha.
- **EL MECANISMO ROBABLE**, y son dos:
  1. **El diagnóstico viene de una modalidad que no es texto escrito.** Reconocimiento de
     habla sobre lectura en voz alta, con detección de *miscues*: mala pronunciación,
     palabra saltada, autocorrección, vacilación. El error se observa, no se infiere de una
     respuesta final.
  2. **Menú cerrado de intervenciones escritas por expertos.** Cuando el alumno falla, el
     sistema **elige entre unas 60 micro-intervenciones construidas por científicos de la
     lectura**. El modelo decide *cuál*, no *qué decir*. Esto es exactamente lo que nuestra
     política de remediación necesita: cuatro acciones, y que la IA seleccione, no invente.
- Uso de genAI: selección de intervención y voz. El repertorio pedagógico es humano.
- Sofisticación visible: alta en lo que no se ve — la ingeniería está en el reconocimiento
  de habla infantil, que es notoriamente difícil.
- Modelo de autoría: científicos de la lectura escriben las intervenciones. No se generan.
- Estado: vivo; distribuido también vía Pearson.
- CAPTURA: sí — sitio de producto; el tutor exige cuenta escolar.
- Confianza: [verificado:techlearning.com] · el linaje CMU y las ~60 intervenciones vienen
  de fuentes secundarias de producto: **[sin-verificar] contra documentación primaria de
  Amira**. La cifra 60 puede ser de marketing; el patrón "menú cerrado" sí está claro.

### SchoolAI — Spaces
- URL: https://schoolai.com/blog/ai-guardrails-keeping-students-safe-and-learning-on-track
- Familia: nativo genAI, orientado al aula. Entra por resolver la capa 7 del stack
  —orquestación humana— que casi nadie enseña en las demos.
- Qué es: entornos de IA que el docente configura para una lección; los alumnos trabajan
  dentro de esos límites.
- **EL MECANISMO ROBABLE**: **el docente fija las fronteras antes de que el alumno entre**,
  no después. Define contenido permitido y cómo se comporta la IA, y luego **ve cada
  conversación en vivo** en un panel, con capacidad de intervenir en el momento. Más
  alertas automáticas que marcan mensajes preocupantes.
  Para tutorIA: nuestro "diagnóstico crudo por sub-skill para el instructor" (decisión 6)
  hoy es un informe; esto sugiere que la versión útil es **un panel en vivo con capacidad
  de override**, no un PDF a posteriori.
- Uso de genAI: el diálogo, dentro del corral que puso el docente.
- Sofisticación visible: media-alta en producto; la sofisticación está en la gobernanza.
- Modelo de autoría: el docente configura por lección, sin programar.
- Estado: vivo.
- CAPTURA: sí — mostraría el panel del docente si hubiera demo pública; sin cuenta, solo
  material de producto.
- Confianza: [verificado:schoolai.com] — **ojo, es su propio blog**: es fuente primaria
  sobre lo que dicen hacer, no evidencia independiente de que funcione.

### Eedi + LearnLM — tutoría con IA supervisada
- URL: https://arxiv.org/abs/2512.23633
- Familia: nativo genAI. Entra por ser el reparto humano-IA mejor documentado.
- Qué es: RCT exploratorio donde LearnLM redacta y un tutor humano supervisa.
- **EL MECANISMO ROBABLE**: **la IA redacta, el humano aprueba**. El tutor revisa cada
  mensaje que la IA propone *hasta quedar satisfecho de enviarlo él mismo*. No es la IA
  hablando con el alumno; es la IA escribiendo el primer borrador del humano.
  El dato que lo hace interesante: los tutores aprobaron el **76,4%** de los borradores con
  cero ediciones o mínimas. Es decir, el cuello de botella humano es mucho más barato de lo
  que parece, y se puede escalar sin quitar al humano del lazo.
- Uso de genAI: redacción de cada turno, bajo revisión.
- Sofisticación visible: no es un producto; es un diseño experimental.
- Modelo de autoría: los ítems son de Eedi, con distractores etiquetados por docentes.
- Estado: vivo como investigación.
- CAPTURA: no — no hay superficie que capturar.
- Confianza: [verificado] en T-002 carril C.

---

## §3 Cola — el resto del carril 3

| Sistema | Quién | Una línea | URL |
|---|---|---|---|
| ChatGPT Study Mode | OpenAI | Andamiaje socrático por *system prompt* sobre el asistente general; sin estado de dominio | https://openai.com/index/chatgpt-study-mode/ |
| Claude Learning Mode | Anthropic | Modo socrático y Projects para educación superior | https://www.anthropic.com/education |
| MagicSchool | MagicSchool AI | Suite de herramientas docentes: planificación, rúbricas, diferenciación | https://www.magicschool.ai/ |
| Brisk Teaching | Brisk | Extensión de navegador: retroalimenta sobre el documento donde el alumno escribe | https://www.briskteaching.com/ |
| Coursera Coach | Coursera | Chat anclado al material del curso dentro de la plataforma | https://www.coursera.org/ |
| Synthesis Tutor | Synthesis | Tutor de matemáticas para niños con diálogo hablado | https://www.synthesis.com/tutor |
| Ello | Ello | Compañero de lectura que escucha leer en voz alta, como Amira | https://www.helloello.com/ |
| Sizzle / Google Learn About | varios | Resolución paso a paso conversacional | — |

---

## §4 Huecos, colisiones y preguntas abiertas

- **Hueco honesto:** de los seis, solo dos (Khanmigo y Eedi/LearnLM) tienen su mecanismo
  descrito por sus propios ingenieros o en un paper. Los otros cuatro se describen desde
  material de producto. En un censo eso es aceptable —el encargo es inventario, no
  evidencia— pero hay que decirlo: **describo lo que dicen hacer**.
- **Amira** es el que más me gustaría verificar contra documentación primaria y no pude.
  La cifra de ~60 micro-intervenciones circula en fuentes secundarias.
- **Colisión evitada con carril 2 (codex):** el motor de mastery de Khan es suyo; yo solo
  toqué Khanmigo como capa de tutoría.
- **Colisión evitada con carril 4 (fable):** Ello y Amira rozan "idiomas/lectura". Amira la
  reclamo yo porque su mecanismo es de diagnóstico por voz, no de aprendizaje de idioma;
  Ello la dejo en cola y que fable decida si la quiere.
- **Pregunta para la síntesis:** los seis sistemas de este carril tienen algo que tutorIA
  no tiene y que ninguno de los otros carriles cubre: **una superficie de gobernanza para
  el docente**. Es candidato a hallazgo de la síntesis.
