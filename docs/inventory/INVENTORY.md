# Inventario: sistemas de aprendizaje interactivos y con IA generativa

Tarea T-012. Censo, no revisión de evidencia: que un sistema no tenga ensayo controlado
no lo descalifica. Lo que descalifica es no tener mecanismo interesante.

Redactor: claude. Carriles: agy (manipulables), codex (tutores adaptativos), claude
(nativos de IA generativa), fable (adyacentes). Fecha: 2026-08-11.

**Parámetros fijados por Kristian.** Lente: *cantera de mecanismos* — de cada sistema, qué
hace por dentro que podamos robar. Criterio de entrada: **sofisticación del mecanismo, no
escala** (por eso entra Amira y no entra Photomath). Reparto: 6 nativos de IA generativa,
6 manipulables, 5 tutores adaptativos, 3 adyacentes. Capturas: hechas por claude con
navegador headless; los agentes tenían prohibido capturar y solo marcaban qué merecía.

---

## 0. El hallazgo que domina el inventario

**Los mecanismos más sofisticados de este censo no son generativos.**

De los 20 sistemas, los que tienen la ingeniería más profunda —MATHia, ALEKS, Desmos
Computation Layer, PhET, Polypad, CODAP, NetLogo, Smart Sparrow— **no usan IA generativa
en su núcleo pedagógico**. Y no es que no hayan llegado: CENTURY sí incorporó IA
generativa, y la puso deliberadamente **fuera** del camino de decisión — genera hojas de
ejercicios imprimibles, y su propia documentación reconoce que matemáticas queda excluida
por fiabilidad. El *Recommended Path*, que es donde se decide qué estudia el alumno, no lo
toca la IA generativa.

*(Inferencia mía, cruzando los cuatro carriles.)* La lectura no es "la IA generativa no
sirve". Es que en 2026 el reparto que eligieron los sistemas serios es: **generativo en la
superficie, determinista en la decisión.** El diálogo, la explicación y la generación de
material se dejan al modelo; el diagnóstico, la secuenciación y la puerta de dominio se
quedan en un motor auditable.

Eso valida el eje de tutorIA y a la vez lo señala: nuestro juez LLM está en el lado de la
decisión, que es justo donde este inventario dice que casi nadie lo pone.

---

## 1. Los cuatro patrones que se repiten entre carriles

### P1 · La IA elige dentro de un menú cerrado; no inventa la jugada pedagógica
Cinco sistemas independientes llegan a lo mismo:

| Sistema | El menú cerrado |
|---|---|
| Amira Learning | ~60 micro-intervenciones escritas por científicos de la lectura |
| Tutor CoPilot | 7 estrategias elegidas por humanos |
| Khanmigo | pistas y solución escritas a mano **para ese ejercicio concreto**, inyectadas antes de responder |
| Eedi + LearnLM | el tutor humano aprueba o edita cada mensaje antes de enviarlo |
| SchoolAI | el docente fija las fronteras de contenido y conducta antes de que el alumno entre |

La libertad generativa se usa para **realizar** la intervención, no para **elegirla**.
Para nuestra política de remediación: las cuatro acciones del brief son el menú; el juez
selecciona, no improvisa.

### P2 · La autoridad docente es una capa de arquitectura, no un panel de informes
Del carril de codex, y es la convergencia más limpia del inventario:

- **CENTURY** — la predicción del modelo **no ejecuta directamente**: pasa por reglas de
  política, y lo que el docente fija manualmente **tiene precedencia y queda visible en la
  traza**.
- **ALEKS** — el instructor puede pedir un *Knowledge Check* a un alumno concreto: una
  acción explícita del docente sobre el motor.
- **MATHia** — la alerta de riesgo no se dispara solo por probabilidad baja, sino por
  posición del alumno frente a cohortes históricas, y **muestra las señales que la
  dispararon**.
- **Smart Sparrow** — reglas autoradas, versionadas, con vista previa antes de publicar.
- **Cognii** — *replay* literal de cualquier intercambio para que el docente lo revise.

Para tutorIA: el "diagnóstico crudo por sub-skill para el instructor" de la decisión 6 hoy
es un informe. Este patrón dice que la versión útil es **un estado que el docente puede
ver, corregir y sobrescribir, con la traza de por qué el sistema decidió lo que decidió**.

### P3 · La sofisticación está en el motor de restricciones, no en el dibujo
Del carril de agy. Cada manipulable de primera división elimina **un tipo concreto de
fricción** para que la atención del alumno caiga sobre la relación que se enseña:

| Sistema | Qué fricción absorbe |
|---|---|
| Polypad | la fricción motriz — las piezas se acoplan solas por semántica y topología |
| CODAP | "¿qué fila es este punto?" — selección compartida entre tabla, mapa y gráfico |
| Observable | "¿ejecuté las celdas en orden?" — grafo de dependencias reactivo |
| PhET | "¿qué me dejan hacer?" — andamiaje implícito por *affordances* visuales |
| Desmos CL | "¿cómo conecto dos componentes?" — lenguaje reactivo de *sinks* y *sources* |
| NetLogo | la distancia entre la regla micro y el efecto macro |

### P4 · El modelo de autoría decide si el sistema escala
También de agy, y es la respuesta al "¿cuánto cuesta el concepto número 20?":

- **PhET**: cerrado y carísimo. Cada simulación exige equipo de desarrollo, diseñador
  instruccional y semanas de prueba con usuarios. No hay herramienta de autoría visual.
- **Desmos**: híbrido y, en palabras de agy, brillante. Contenido oficial caro **más** el
  *Activity Builder* con Computation Layer abierto y gratis a cualquier docente.
- **CODAP**: sin fricción. Subes un CSV, arrastras un gráfico, compartes el enlace.
- **Polypad**: abierto para crear estados, cerrado para crear primitivas.
- **MATHia / ALEKS / CENTURY**: el docente selecciona y secuencia, pero **no puede editar
  el modelo de conocimiento** que gobierna la adaptación.

---

## 2. Los 20 sistemas

### Nativos de IA generativa (6) — carril claude
| Sistema | Mecanismo robable |
|---|---|
| **Khanmigo** | El cálculo sale del LLM a una herramienta determinista; contexto autorizado inyectado antes de responder; bloque oculto que enumera las derivaciones plausibles del alumno antes de elegir la jugada visible |
| **LearnLM / Guided Learning** | La pedagogía vive en la *system instruction*, no en los pesos: es configuración, no modelo |
| **NotebookLM** | Anclaje estricto a corpus cerrado con cita clicable en cada afirmación; y una sola autoría que se transforma en resumen, mapa mental y diálogo de audio |
| **Amira Learning** | Diagnóstico por voz sobre lectura en voz alta con detección de *miscues*; selección entre ~60 micro-intervenciones humanas |
| **SchoolAI** | *Spaces*: el docente fija las fronteras antes, y ve cada conversación en vivo con capacidad de intervenir |
| **Eedi + LearnLM** | La IA redacta, el humano aprueba: 76,4% de borradores aceptados con cero o mínimas ediciones |

### Manipulables, simulaciones y explorables (6) — carril agy
| Sistema | Mecanismo robable |
|---|---|
| **Desmos Classroom + Computation Layer** | Lenguaje reactivo y funcional donde cada componente expone *sinks* y *sources*; más *pacing* y *anonymize* en el panel docente |
| **PhET** | Andamiaje implícito por *affordances*; y un árbol paralelo en el DOM (PDOM) que da navegación por lector de pantalla y sonificación |
| **Polypad (Mathigon)** | Motor de acoplamiento con conciencia semántica y topológica entre piezas |
| **Observable** | Grafo acíclico dirigido reactivo: cambia una variable y todo lo dependiente se recalcula |
| **CODAP** | Representaciones enlazadas con estado de selección compartido entre tabla, mapa y gráfico |
| **NetLogo Web** | Concurrencia de miles de agentes locales; la regla individual produce la dinámica macro |

### Tutores adaptativos y de dominio (5) — carril codex
| Sistema | Mecanismo robable |
|---|---|
| **MATHia** | Probabilidad de dominio por skill **más** detector de riesgo contextual contra cohortes históricas, con las señales visibles |
| **ALEKS** | Familia de estados factibles de conocimiento; enseña en la *frontera exterior*; *Knowledge Checks* que pueden devolver a práctica lo ya aprendido |
| **Smart Sparrow** *(muerto, absorbido por Pearson)* | Motor de reglas pedagógicas autorables sobre telemetría rica, versionadas y con vista previa |
| **CENTURY** | Separa predicción, reglas de política y autoridad docente; lo que el docente fija tiene precedencia |
| **Cognii** | Convierte la respuesta libre en conceptos presentes, ausentes o mal expresados — no en un número |

### Adyacentes (3) — carril fable
| Sistema | Mecanismo robable |
|---|---|
| **Duolingo** | Modelo de recuerdo en función del tiempo y la dificultad, con generación dentro de una secuencia fija |
| **Speak** | Reconocimiento y corrección de pronunciación como diagnóstico continuo |
| **SimConverse** | Simulación conversacional clínica con evaluación estructurada del desempeño profesional |

La cola larga y las fichas completas, con URL a la página que sostiene cada afirmación,
están en `coord/work/{claude,agy,codex,fable}/T-012-*.md`.

---

## 3. Qué se lleva tutorIA de aquí

*(Inferencia mía. Ninguna de estas cinco es un hallazgo de los papers; son lecturas del
censo.)*

1. **El juez debe pasar por reglas antes de ejecutar.** Copiar el reparto de CENTURY:
   `judge_prediction → policy_rules → acción`, con `teacher_pinned_next[]` con precedencia.
2. **El diagnóstico se guarda como conceptos, no como puntuación.** Copiar Cognii:
   `expected_concepts[]`, `observed_concepts[]`, `missing_or_misconstrued[]`. Encaja con lo
   que ya decidimos en T-002: bajar el juez de *puntuar* a *clasificar*.
3. **La remediación es un menú cerrado.** Las cuatro acciones del brief son el repertorio;
   el modelo elige, no inventa. Cinco sistemas independientes coinciden.
4. **Cada evidencia debe poder reproducirse.** Copiar el *replay* de Cognii y la traza
   visible de MATHia: el docente ve la señal que disparó la decisión.
5. **La autoría es la decisión estratégica, no el render.** El eje Desmos —contenido caro
   propio más un lenguaje declarativo abierto— es el único modelo del censo que resuelve a
   la vez calidad y costo del concepto 20.

---

## 4. Capturas

26 capturas en `docs/inventory/screenshots/`, tomadas con Chrome headless a 1440×900 y
verificadas una a una abriéndolas. Las más útiles muestran el mecanismo y no el marketing,
que es lo que se consigue con enlaces profundos:

- `phet-graphing-lines.png` — `?screens=2` entra directo al manipulable de
  pendiente-intercepto: ecuación acoplada al gráfico con puntos arrastrables.
- `econgraphs-optimal-choice.png` — **la más relevante para nosotros**: línea
  presupuestaria, curva de indiferencia, condición de tangencia y deslizadores vivos de
  p₁, p₂, m y preferencias. Nuestros dos conceptos exactos, ya construidos.
- `netlogo-web.png` — deslizadores de parámetros y centro de comandos. *Estado previo a
  ejecutar: el lienzo está en negro porque no se pulsó `setup`.*
- `codap.png`, `polypad.png`, `observable.png`, `distill-example.png`,
  `ncase-explorable.png` — los manipulables en su estado inicial navegable.

Limitación declarada: **no se creó ninguna cuenta ni se inició sesión en ningún sitio**.
Todo lo que vive detrás de registro —el aula de MATHia, el panel de CENTURY, Khanmigo, los
*Spaces* de SchoolAI— no está capturado, y sus fichas describen lo que la documentación
del fabricante dice, no lo que verificamos en pantalla.
