# Brief — PoC de tutor interactivo (tutorIA)

Estado: entrada para la fase de súper-plan multi-vendor.
Principal: Kristian. Rama: `Kristian1`.
Este documento es la **única fuente de requisitos** para los agentes que redactan el plan.
No es el plan. El plan se produce a partir de esto.

---

## 1. Qué estamos construyendo

Una aplicación de aprendizaje interactivo. El ciclo por concepto es:

1. **Delivery**: el estudiante recibe el concepto en audio/video con gráficos y fórmulas (2–3 min).
2. **Ejemplos**: el tutor da ejemplos, de forma adaptativa, hasta que el estudiante confirma que quiere avanzar.
3. **Preguntas no calificadas**: el estudiante responde. Nunca hay nota.
4. **Juicio**: la IA evalúa continuamente si el estudiante está aprendiendo, y remedia cuando no.
5. **Cierre**: resumen formativo sin nota cuando se alcanza el umbral de dominio.

El estudiante puede preguntar en cualquier momento. El chat **no** está abierto todo el tiempo;
su forma exacta (burbuja, panel lateral, otra) es una decisión de diseño abierta y es parte de lo
que el plan debe resolver.

Concepto de referencia: **línea presupuestaria** (microeconomía intermedia).

---

## 2. Decisiones ya tomadas por el principal

Estas 32 respuestas están cerradas. El plan las respeta; no las re-litiga.
Si un agente cree que alguna es un error, lo dice como `[blocker]` con argumento, no la ignora.

### Alcance y contenido
| # | Decisión |
|---|---|
| 1 | Dos conceptos: **línea presupuestaria + curva de indiferencia** (se combinan en óptimo del consumidor) |
| 2 | Reusar contenido existente de `intermediate_micro_notes` y `econ100a-slides_homeworks`; conservar la voz docente del principal |
| 3 | Delivery de **2–3 minutos** por concepto |
| 4 | Profundidad: base (ecuación, interceptos, pendiente, conjunto factible) **+ estática comparativa** (cambios en m, px, py) |
| — | Idioma: **bilingüe es/en desde el diseño** |
| — | Stack: **standalone nuevo** en `tutorIA`, no sobre InteractiveEduHub |
| — | Producción: **pre-producida ahora, generación al vuelo después** — la arquitectura no debe cerrar esa puerta |

### Pedagogía y evaluación
| # | Decisión |
|---|---|
| 5 | Ejemplos **adaptativos**: hasta que el estudiante confirme |
| 6 | El juicio lo ven **ambos, con distinto detalle**: feedback formativo para el estudiante, diagnóstico crudo por sub-skill para el instructor |
| 7 | Remediación: **las cuatro** — re-explicar con otra representación, pregunta socrática dirigida a la misconception, bajar dificultad con caso numérico, y marcar para revisión humana. *La política que decide cuál aplicar y cuándo es tarea del plan.* |
| 8 | Salida del loop: **umbral de mastery por sub-skill**, con tope de intentos |
| 9 | **Catálogo curado de misconceptions** por concepto; el juez las detecta por nombre |
| 10 | Cierre con **resumen formativo sin nota** |
| — | Juez: **rúbrica LLM + estado de mastery por sub-skill** |

### Interacción
| # | Decisión |
|---|---|
| 11 | Pausa del media: **el estudiante elige** (botón de pausa manual) |
| 12 | El tutor interrumpe en **checkpoints diseñados en el guion** (2–3 por concepto) |
| 13 | Entrada: **texto + voz del navegador** (Web Speech). La voz se refina más adelante |
| 14 | **Botones de intención rápida + chat libre** |
| 15 | **Desktop primero**, responsive razonable |

### Tipos de pregunta — los cuatro
| Tipo | Nota |
|---|---|
| Manipulación del gráfico | Arrastrar la línea, mover m/px/py y ver el efecto |
| Numéricas | Calificables de forma determinista |
| Abiertas | Explicar con sus palabras; es donde el juez LLM aporta |
| Opción múltiple con distractores | Cada distractor mapea a una misconception del catálogo |

### Técnico
| # | Decisión |
|---|---|
| 16 | **Claude API detrás de una interfaz intercambiable** de proveedor |
| 17 | Costo **mixto por rol**: modelo barato para chat, modelo fuerte para juez de respuestas abiertas y diagnóstico |
| 18 | Persistencia: **SQLite local**, migrable |
| 19 | Sin auth ahora, pero **el modelo de datos y las fronteras se diseñan para una plataforma con login** más adelante |
| 20 | **Localhost ahora, desplegable por diseño** (la API key vive en el servidor, nunca en el navegador) |
| 21 | Fórmulas: **KaTeX en el DOM sincronizado al audio** como objetivo, con flexibilidad por prototipo |
| 22 | **Accesibilidad con base sólida**: transcript sincronizado, navegación por teclado, contraste, y alternativa textual al gráfico manipulable |

---

## 3. El bake-off de media — decisión abierta

El principal quiere **construir las cuatro opciones y compararlas**, no elegir a priori:

| Opción | Descripción |
|---|---|
| A | AudioExplainer + gráficos HTML/SVG sincronizados por word-boundary |
| B | Remotion (video MP4 en React/TS) |
| C | Manim + audio |
| D | Híbrido: Manim pre-renderiza el gráfico, AudioExplainer narra y sincroniza |

**Comparabilidad gruesa (decisión 24, RELAJADA por Kristian el 2026-08-10)**: los cuatro
cubren el mismo concepto con contenido equivalente. Nada más se impone; cada tecnología
juega a sus fortalezas. *"Por hacerlas muy comparables vamos a sufrir restricciones
innecesarias."* No es un experimento controlado: es una decisión de con qué construimos.

**Criterios de comparación (decisión 23)**, todos con peso:
1. Calidad visual y claridad pedagógica
2. Facilidad de personalización al vuelo *(crítico: la generación por estudiante es el futuro declarado)*
3. Tiempo y costo de producción por concepto *(¿cuánto cuesta el concepto número 20?)*
4. Accesibilidad y mantenibilidad *(¿puede editar el contenido alguien que no programa?)*
5. **Versatilidad entre generaciones de PCs, navegadores y dispositivos** — criterio añadido por el principal. Los estudiantes tienen equipos viejos y navegadores heterogéneos.

**Timebox (decisión 26)**: estricto y parejo para los cuatro. Si una tecnología no llega dentro del
presupuesto de esfuerzo, **ese hecho es el resultado**, no un fracaso a compensar con más tiempo.

**Jurado (decisión 25)**: rúbrica independiente de los **cuatro** agentes **y** juicio del principal
humano. El principal tiene la palabra final.
*(Corregido tras el nit de fable: una versión previa decía "tres agentes", de cuando el roster aún
no incluía a Opus 5 como autor con voto.)*

---

## 4. Activos existentes que el plan debe considerar

| Activo | Ruta | Por qué importa |
|---|---|---|
| AudioExplainer | `~/GithubRepos/AudioExplainer` | CLI `audioexplain` madura: script → MP3 + **transcript sincronizado a nivel de ORACIÓN** + player HTML sin dependencias. Módulo `math_content.py`. Soporta es/en, mono y diálogo. Formato real del `.audio.json`: `sync.segments[] = {text, start_s, end_s, part_index, speaker}` y `formulas[] = {marker, original, mathml, spoken}`. |

> **Corrección (fable, ronda 1; verificada por Opus 5).** Una versión previa de este brief decía
> "word boundaries de Edge TTS". **Es falso.** La implementación pide `boundary="SentenceBoundary"`
> (`src/audioexplainer/providers.py:72`) y los artefactos reales declaran
> `granularity: "sentence"`, `source: "edge-sentence-boundary"`.
>
> Consecuencia para el plan: la sincronización es **por oración, no por palabra**. Para cues de
> gráfico y checkpoints basta y sobra, con la regla de diseño "cada elemento visual tiene su propia
> oración". Pero **ningún plan debe prometer resaltado de fórmulas palabra por palabra** sin
> presupuestar antes una extensión de AudioExplainer (Edge sí emite `WordBoundary`; el cambio es
> acotado, pero es trabajo real y hoy no está hecho).
| manim | instalado en PATH | Nativo para gráficos matemáticos |
| Prior art manim+audio | `~/GithubRepos/manim-workspace/nash_equilibrium_with_audio.py` | Patrón ya probado por el principal |
| Contenido de micro | `~/GithubRepos/intermediate_micro_notes`, `~/GithubRepos/econ100a-slides_homeworks` | Guiones y notación del principal |
| Plataforma previa | `~/GithubRepos/InteractiveEduHub` | Django+Docker+Postgres de micro intermedia. **No es el stack objetivo**, pero es prior art sobre el dominio y el destino eventual con login |

Toolchain disponible y verificado: node 22.18, npm 11.16, Python 3.12.5, uv 0.11.29, manim, ffmpeg, `audioexplain`.

---

## 5. Qué debe entregar el plan

1. **Arquitectura** del PoC: módulos, fronteras, flujo de datos, y dónde se enchufa la generación al vuelo del futuro.
2. **Diseño del juez**: esquema de sub-skills para los dos conceptos, formato del estado de mastery, rúbrica, y la **política de remediación** que decide cuál de las cuatro acciones aplicar (decisión 7).
3. **Catálogo de misconceptions** para línea presupuestaria y curva de indiferencia: nombre, señal observable, remediación asociada, y distractor de opción múltiple que la delata.
4. **Diseño de la UX del chat**: resolver la pregunta abierta de burbuja vs panel lateral vs otra, con argumento.
5. **Protocolo del bake-off**: guion común, gráfico común, presupuesto de esfuerzo por prototipo, rúbrica de los 5 criterios, y cómo se mide cada uno (especialmente el criterio 5, versatilidad de dispositivos).
6. **Modelo de datos** SQLite con el camino explícito a multi-estudiante con login.
7. **Secuencia de trabajo**: qué se construye primero y cuál es el criterio de "el PoC funciona".
8. **Riesgos** con mitigación, y qué supuestos habría que invalidar para cambiar de rumbo.

---

## 6. Reglas del proceso

- Autores del plan, **cuatro, en pie de igualdad**, cada uno con voz y voto:

  | Slot en coord | Modelo | Vendor |
  |---|---|---|
  | `claude` | **Opus 5** — además facilita el proceso | Anthropic |
  | `fable` | **Fable-5** | Anthropic |
  | `codex` | **Sol Ultra / GPT-5.6** | OpenAI |
  | `agy` | **Gemini** | Google / Antigravity |

  Opus 5 facilita *y* propone. Facilitar no le da autoridad extra sobre el contenido:
  su propuesta compite en igualdad de condiciones y puede ser rechazada como cualquier otra.

- Mecanismo (decisión 30): **propuestas independientes → crítica cruzada → síntesis**.
  La ronda 1 es a ciegas: no leas las propuestas de los otros antes de escribir la tuya.
- Los desacuerdos **se registran**, no se promedian. Si tras la crítica sigues en desacuerdo,
  dilo por escrito con tu razón; el principal desempata.
- Entregable final: `coord/decisions/` (decisiones con justificación y disensos) + `docs/PLAN.md` (plan ejecutable).
- El principal (Kristian) tiene la palabra final sobre todo.
