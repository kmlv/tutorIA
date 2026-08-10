# PLAN — PoC de tutor interactivo (tutorIA)

Síntesis de la ronda 3 de T-001. Redactada por `claude` (Opus 5) como lead, a partir de
las cuatro propuestas independientes y las cinco críticas cruzadas de la ronda 2.

**Estado: FIRMADO 3/3. D1–D3 resueltos. Actualizado con los hallazgos de T-002 (prior art)
y con dos relajaciones del bake-off decididas por Kristian el 2026-08-10.**
Falta únicamente que Kristian autorice el cambio de `proposal-only` a `implementation`.

Requisitos en [BRIEF.md](BRIEF.md). Debate completo en el thread de T-001.

---

## 1. Lo que quedó resuelto por consenso

| # | Decisión | Voto | Origen |
|---|---|---|---|
| C1 | **Backend Python + FastAPI** | 4–0 | agy y fable lo propusieron; claude y codex cambiaron de voto |
| C2 | **Frontend TypeScript + Vite**, sin framework de entrada | 4–0 en TS; vanilla-vs-React lo decide un spike, no Kristian | fable |
| C3 | **KaTeX se renderiza en build-time**; cero KaTeX JS en runtime | fable aceptó el blocker de claude | claude → fable |
| C4 | **Fuente declarativa → compilador → bundle de runtime** | fusión de fable §1.2 y claude §1 | fable |
| C5 | **`MediaAdapter`**: las 4 opciones del bake-off corren *dentro de la app real* | 4–0 | fable |
| C6 | ~~Las 4 opciones comparten **el mismo MP3 y el mismo `timeline.json`**~~ → **REVOCADO por Kristian (2026-08-10)**: basta comparabilidad **gruesa**. Ver §6 | — | fable, revocado por el principal |
| C7 | **Deterministic-first**: el LLM solo juzga respuestas abiertas | 3–0 | codex y fable |
| C8 | **Juez en modo sombra** contra el set dorado antes de que pueda mover mastery | 4–0 | codex |
| C9 | **Catálogo de misconceptions curado y fuera de la generación automática** | 4–0 | fable |
| C10 | **Dock lateral de 3 estados** (oculto / pasivo / activo) | 4–0 | fable |
| C11 | **12 sub-skills núcleo + 3 de integración no bloqueantes**, un ítem determinista cada una | 4–0 *(ver nota)* | codex propuso las de integración; claude y fable acotaron el costo |

> **Nota de procedencia de C11.** Secuencia real, verificada contra el thread:
>
> 1. **Ronda 1, `codex`**: enumera las tres sub-skills de integración
>    `OPT.FEASIBLE_CHOICE`, `OPT.TANGENCY_MRS_PRICE_RATIO`, `OPT.CORNER_VS_INTERIOR`,
>    dentro de un esquema de 20 sub-skills bloqueantes. `fable` (ronda 1) solo menciona
>    un futuro `OPT.TAN` y lo declara **fuera del alcance** del PoC.
> 2. **Ronda 2**: `claude` y `fable` levantan `[blocker]` contra las 20 bloqueantes
>    (≥40 respuestas juzgadas ⇒ sesión incompletable). `codex` **se retracta a
>    12 + máximo 2**, no 3. `fable` acota el costo a un ítem determinista por skill.
> 3. **Disenso de firma (rev 16)**: `codex` acepta expresamente el compromiso final
>    de **3** `OPT.*` no esenciales.
>
> El 4–0 se alcanzó ahí, no en la ronda 2. Dos versiones previas de esta nota fueron
> incorrectas: la primera declaraba 4–0 sin distinguir la retractación; la segunda,
> al corregir eso, **invirtió la procedencia** atribuyendo los tres `OPT.*` a `fable`.
> Ambas las detectó `codex` con evidencia primaria del thread.
| C12 | **Timebox 6 h por opción**, con el guion como costo compartido pagado una vez *(el MP3 y el timeline dejan de ser compartidos al revocarse C6)* | 4–0 | fable y claude |
| C13 | **`events` append-only** ⇒ replay de sesiones ⇒ bake-off de jueces gratis | claude; adoptado por fable | claude |
| C14 | **Éxito = concordancia medida con Kristian**, con contingencia pre-registrada | 4–0 (agy concedió) | claude, codex, fable |
| C15 | **Sin credenciales propias**: `external_auth_id` reservado, nunca hashes de password | codex y fable | codex |

---

## 2. Arquitectura

### 2.1 Las dos mitades y la costura

    content/packs/<concepto>/     FUENTE — texto plano que edita un humano o emite un LLM
      pack.yaml                   sub-skills, umbrales, orden de checkpoints
      script.{es,en}.md           guion con fórmulas $...$ y marcas <!--cue:X-->
      questions.yaml
      examples.yaml
      misconceptions.yaml         CURADO — nunca generado (C9)
              │
              ▼  pipeline/  (build-time)
      build_media.py              → audioexplain (MP3 + audio.json)
      cues.py                     → timeline.json
      render_math.py              → KaTeX a HTML estático (C3)
              │
              ▼
      media/{A,B,C,D}/ + timeline.json     ARTEFACTO — lo que consume el runtime

**Por qué la costura va ahí.** El criterio "un no-programador edita el contenido" y
"un LLM lo emite mañana" operan sobre la **fuente**, no sobre el artefacto compilado.
Nadie edita `cues[{t_ms}]` a mano, y pedirle a un modelo que emita timestamps coherentes
es pedir alucinación. Fue la corrección de fable a la propuesta de claude, y es correcta.

### 2.2 Punto de extensión para la generación al vuelo

```python
class PackSource(Protocol):
    def get_pack(self, concept_id: str, lang: str,
                 student: StudentProfile | None = None) -> Pack: ...

class FilesystemPackSource:   # HOY
class GeneratedPackSource:    # FUTURO — LLM emite la FUENTE, el compilador hace el resto
```

Tres reglas que no se negocian:
1. El runtime consume `Pack` y **nunca sabe** de dónde vino.
2. `misconceptions.yaml` queda fuera de la generación (C9). El catálogo es la ontología
   que hace comparables a los estudiantes entre sí; si se regenera por estudiante, se
   pierde toda posibilidad de agregar.
3. **La generación futura es un job asíncrono** con estados `pending/ready/failed` y
   caché por hash. Nunca síncrona dentro de un request HTTP — fue un `[blocker]` de
   codex contra agy, y es correcto: bloquearía el request y duplicaría trabajo.

### 2.3 Runtime

    app/server/  FastAPI + uvicorn, gestionado con uv
      api/       session · answer · chat (SSE) · events · instructor
      core/
        orchestrator.py    máquina de estados
        judge/             graders deterministas + grader_open (LLM) + mastery + remediation
        llm/               LLMProvider (Protocol) · claude.py · fake.py · router.yaml
        content/           schema.py (pydantic) · loader.py
      db/        schema.sql · repo.py     (SQLite WAL, SQL explícito, sin ORM)

    app/web/     TypeScript + Vite, target es2017
      player/    sync.ts · media_html.ts (A) · media_video.ts (B/C/D)
      graph/     budget_graph.ts · ic_graph.ts · a11y.ts
      chat/      dock.ts
      questions/ mcq · numeric · open · manip

**Presupuesto de peso, verificado en CI desde M0**: app JS ~40 KB gz + CSS ~10 KB +
fuentes matemáticas subseteadas ~100 KB ≈ **150 KB**, con holgura bajo 250 KB.

> **MEDIDO en M0 (2026-08-10), `npm pack katex@0.16.11`.** Ya no es estimación:
>
> | Artefacto | crudo | gzip |
> |---|---|---|
> | `katex.min.js` | 275 414 B | **75 488 B** |
> | `katex.min.css` | 23 335 B | 3 433 B |
> | fuentes woff2, set completo (20 archivos) | 296 KB | no comprimible |
> | fuentes, 4 caras típicas de una página de micro | **73 504 B** | no comprimible |
>
> **Los dos lados del debate estaban equivocados.** `claude` afirmó que "~280 KB de
> KaTeX se comen el presupuesto": confundió bytes crudos con transferidos; son 75 KB
> gz. `fable` corrigió bien esa cifra, pero su argumento de rescate —que las fuentes
> woff2 hundían igualmente el presupuesto con 150–250 KB— **también era alto**: una
> página carga 4 caras, ~73 KB, no el set de 296 KB.
>
> Cuentas reales contra el presupuesto de 250 KB gz:
> - **build-time (C3)**: app ~40 + CSS 3.4 + fuentes 73.5 ≈ **117 KB**
> - **runtime**: app ~40 + JS 75.5 + CSS 3.4 + fuentes 73.5 ≈ **192 KB**
>
> Es decir, **el presupuesto cerraba en las dos configuraciones**. C3 (KaTeX a
> build-time) **sigue en pie, pero por otra razón**: elimina el coste de parseo y
> ejecución de 275 KB de JS en CPUs débiles, que es el criterio 5. El argumento de
> peso con el que se decidió era falso; el de CPU no.

### 2.4 Disparo de cues

`previousTime < cue.t <= currentTime`, idempotente, con `requestVideoFrameCallback`
donde exista y fallback temporizado. Sustituye la tolerancia plana de ±250 ms de la
propuesta original de fable: `timeupdate` dispara cada ~250 ms en varios navegadores,
así que una tolerancia plana de ese mismo orden puede saltarse un cue.

**Granularidad: por oración, no por palabra.** Regla de diseño del guion, no negociable:
*cada elemento visual tiene su propia oración*. Ninguna parte del plan promete resaltado
de fórmulas término por término.

---

## 3. El juez

### 3.1 Sub-skills

**Núcleo (12) — bloquean el cierre del concepto:**

    BL.EQ     Plantear p1·x1 + p2·x2 = m e interpretar cada término
    BL.INT    Interceptos m/p1 y m/p2
    BL.SLOPE  Pendiente -p1/p2 como precio relativo / costo de oportunidad
    BL.FEAS   Conjunto presupuestario: interior vs frontera vs inalcanzable
    BL.CS.M   Δm ⇒ desplazamiento paralelo
    BL.CS.P   Δp1 o Δp2 ⇒ pivote sobre el intercepto del otro bien

    IC.DEF      Conjunto de canastas indiferentes
    IC.MONO     Monotonicidad ⇒ pendiente negativa, más lejos del origen es mejor
    IC.NOCROSS  Dos curvas no se cruzan (transitividad)
    IC.MRS      MRS = pendiente = disposición marginal a sustituir
    IC.CONV     Convexidad / MRS decreciente
    IC.MAP      Leer un mapa de indiferencia

**Integración (3) — `essential: false`, no bloquean el cierre:**

    OPT.FEASIBLE_CHOICE · OPT.TANGENCY_MRS_PRICE_RATIO · OPT.CORNER_VS_INTERIOR

Costo acotado: **un solo ítem determinista** por sub-skill de integración. No cobertura
de 4 modalidades × 2 idiomas.

> `IC.5 tangency` de la propuesta de claude mezclaba restricción con preferencias dentro
> de IC. Corrección de codex, aceptada: vive en `OPT.*`.

### 3.2 Mastery

```json
{ "subskill_id": "BL.SLOPE", "p_mastery": 0.62, "evidence_count": 4,
  "modalities": ["numeric", "open"], "streak_correct": 2,
  "attempts_in_concept": 5, "active_misconception": "BL-M2", "status": "developing" }
```

**Actualización**: `p ← p + α·(score − p)`, con `α = 0.35` para graders deterministas y
`α = 0.25` para el juez LLM. La α distingue por **fiabilidad del instrumento**, no por
dirección del error — es más defendible que la asimetría 0.4/0.6 que propuso claude, que
era un número inventado con aire de rigor.

**Sin doble penalización.** Una misconception activa con `p ≥ 0.6` **bloquea** `mastered`
y dirige la remediación; no resta puntos adicionales. Restarlos contaría la misma
evidencia dos veces, sobre un score que ya refleja el error. Corrección de codex.

**`mastered` = `p ≥ 0.80` ∧ `streak_correct ≥ 3` ∧ `modalidades ≥ 2` ∧
**≥1 acierto sin andamiaje** ∧ ninguna misconception activa.**

> **La cuarta condición es la que salva el criterio, y viene de T-002.** Bastani et al.
> (RCT, ~1.000 alumnos, 3 brazos) midieron práctica asistida por GPT **+48% a +127%**
> sobre control, y el examen **sin asistencia inmediatamente posterior** dio **negativo**
> sin guardarraíles y **cero** con ellos. Y desde la otra literatura, ASSISTments
> **invalida la oportunidad** cuando el alumno pide pista. El desempeño asistido no basta
> para demostrar aprendizaje independiente y puede sobreestimar la transferencia.
>
> Las tres condiciones anteriores **podían cumplirse enteras con desempeño asistido**:
> el estudiante podía haber recibido pista, feedback del juez o empujón sobre el gráfico
> en cada acierto. "Modalidad distinta" no es lo mismo que "sin ayuda".
>
> Un acierto **sin andamiaje** = sin pista previa, sin feedback del juez antes de enviar,
> sin ayuda sobre el gráfico, en ese turno.

**El juez LLM aporta como mucho 1 de las 3 evidencias** mientras siga por debajo del
techo humano medido. Las otras dos vienen de modalidades deterministas.

> **Esto acorta la sesión, no la alarga.** Capar el juez baja las respuestas abiertas
> juzgadas de ~24 a ~12 por sesión **mientras la evidencia total sube de 2 a 3 por
> sub-skill**. El cuello de botella nunca fueron las 12 sub-skills: era cuántas de sus
> evidencias tenían que pasar por el componente lento, caro y poco fiable.

**Salidas del loop** — reemplazan al antiguo `stuck := attempts ≥ 6`, que codex
demostró que era un marcador de posición presentado como decisión:

| Estado | Condición |
|---|---|
| `provisional_mastery` | Hay evidencia independiente pero incompleta |
| `budget_exhausted` | Se agotó el tope configurable de preguntas **de la actividad** |
| `indeterminate` | No hubo evidencia suficiente para afirmar ni negar |

Se registra `stop_rule_version` con cada cierre. Distinguir los tres importa: `indeterminate`
no es lo mismo que "no lo domina", y tratarlos igual falsea la telemetría del instructor.

Todos los parámetros en `config/mastery.yaml`. **Son hipótesis explícitas, no constantes
calibradas** — se ajustan con datos reales, y el plan lo dice en vez de fingir precisión.

### 3.3 Política de remediación

Determinista. Primera regla que aplica gana. El LLM diagnostica; **la política dispone**.

| # | Condición | Acción |
|---|---|---|
| R0 | `score ≥ 0.8` | Sin remediación; feedback positivo específico |
| R1 | Misconception `confidence ≥ 0.6`, no sondeada aún en la sesión | **Socrática dirigida** — `socratic_probe` pre-escrito en el catálogo; el modelo barato solo lo adapta |
| R2 | La misma misconception persiste tras la socrática, o `score < 0.4` con `p < 0.4` | **Otra representación** — escalera `verbal → numérica → gráfica → tabla`, eligiendo una no usada |
| R3 | `score ∈ [0.4, 0.8)` sin misconception, o turno posterior a una re-explicación | **Bajar dificultad** — ítem tier-1 numérico (m=100, p1=10, p2=5) |
| R4 | `attempts ≥ 6`, misma misconception 3 veces, **o `judge_confidence < 0.60`** | **Revisión humana** — se registra, se le dice al estudiante con honestidad, se congela esa sub-skill y se sigue con las demás |

Invariantes: nunca la misma acción dos veces seguidas sobre la misma sub-skill; tras cada
remediación se usa una pregunta **nueva** que mida la misma sub-skill; toda acción queda
en `events` con la regla que la disparó.

> El gate por `judge_confidence < 0.60` es de codex: escalar cuando el propio juez duda
> es una señal más temprana y más honesta que esperar al tope de intentos.

### 3.4 Salida del juez (solo abiertas)

```json
{ "scores": {"BL.SLOPE": 0.5},
  "key_points_hit": [...], "key_points_missed": [...],
  "misconceptions_detected": [{"id": "BL-M1", "confidence": 0.8, "evidence": "cita textual"}],
  "feedback_student": "2–3 frases formativas, sin nota",
  "judge_confidence": 0.0, "needs_clarification": false }
```

`misconceptions_detected.id` se valida **enum contra el catálogo**: el juez no inventa
diagnósticos. Temperatura 0. `evidence` obligatoria: el juez cita el fragmento que
justifica su veredicto, y eso es lo que hace auditable el diagnóstico.

**El enum incluye `NINGUNA` y `FUERA_DE_CATALOGO`, y `NINGUNA` es el valor por defecto.**

> **Sin ese escape, el gate de D3 no medía nada.** El juez estaba obligado a emitir uno
> de los 14 ids aunque el alumno no cometiera ningún error, o cometiera uno que el
> catálogo no contempla — y la validación enum lo aceptaba como válido. El criterio
> "cero IDs fuera de catálogo" **se pasaba por construcción** mientras los falsos
> positivos subían. Hallazgo del carril C de T-002; el diseño de Eedi asume
> explícitamente que existen misconceptions fuera del catálogo, y el nuestro no lo hacía.

**Reference-guided grading.** El prompt del juez no lleva solo el enum: lleva también la
**respuesta de referencia del ítem** y la **firma diagnóstica de cada misconception
aplicable a ese ítem**. En MT-Bench, inyectar la referencia bajó la tasa de fallo en
matemáticas del 70% al 15% — la mejora verificada más grande y barata de esa literatura.

---

## 4. Catálogo de misconceptions

Fusión de los cuatro catálogos. **14 entradas** (7 + 7); formato
`{id, nombre, subskills, señal_observable, socratic_probe, representación_alternativa, caso_numérico, distractor}`.

**Línea presupuestaria (7):** pendiente invertida · Δm cambia la pendiente · Δp mueve el
intercepto equivocado · confunde línea con conjunto factible · pendiente positiva ·
interceptos intercambiados · **factible = óptimo** *(de codex; los otros tres no la vieron)*.

**Curva de indiferencia (7):** las curvas pueden cruzarse · curva más alta = más de un
bien · MRS constante · **interferencia con la línea presupuestaria** · IC creciente ·
convexidad sin significado económico · **espaciado cardinal** *(de codex)*.

> `IC-M4` (creer que la curva de indiferencia se desplaza si sube el ingreso) es la joya
> diagnóstica: **solo emerge al enseñar los dos conceptos juntos**, que es exactamente
> lo que justifica la decisión 1 del brief de cubrir dos conceptos y no uno.

**Validación pendiente (M1):** este catálogo es teoría de cuatro modelos. Debe
contrastarse con dos fuentes, no una:

1. **Los exámenes y tareas reales de Econ 100A** — dónde están las confusiones que de
   verdad aparecen, y con qué frecuencia.
2. **IESA-Micro** (Cornell Suite) — *hallazgo de T-002*. Es el análogo del Force Concept
   Inventory para micro intermedia, **y existe**. Su sección III "The Consumer's Problem"
   cubre literalmente nuestro alcance con 22 learning goals, y sus distractores se
   construyeron con **entrevistas think-aloud a estudiantes que ya cursaron la materia** —
   justo la fuente de evidencia que un catálogo escrito por modelos de lenguaje no tiene.

> **Acción inmediata, antes de M1:** pedir el cuestionario en
> https://www.econ-assessments.org/pages/IESA-Micro.html — es gratuito, por formulario, y
> con lead time desconocido. Si llega, sus ítems de *consumer choice* sirven como **set
> dorado externo pre-etiquetado** en M3, y reducen mucho lo que Kristian tiene que
> etiquetar a mano.
>
> **Y el riesgo que conviene mirar de frente:** ningún instrumento de economía asigna un
> **identificador estable** a la misconception — la incrustan en el texto del distractor
> sin nombrarla. El contrato de `id` que necesitamos **no tiene precedente público en
> economía**. Es a la vez la oportunidad del proyecto y su riesgo: nadie ha validado que
> esa taxonomía sea estable.

---

## 5. UX

**Dock lateral derecho, tres estados según la fase:**

1. `oculto` — durante el delivery. Solo un botón **"✋ Preguntar"**; pulsarlo pausa el
   media (control del estudiante) y abre el dock.
2. `abierto-pasivo` — ejemplos y práctica. Historial + botones de intención
   ("No entiendo", "Otro ejemplo", "Más despacio", "¿Por qué?", "Listo, sigamos") +
   input de texto, con micrófono Web Speech como *progressive enhancement*.
3. `abierto-activo` — checkpoint, pregunta o remediación. Input enfocado, escenario
   atenuado, la pregunta vive dentro del dock; las de manipulación resaltan el gráfico.

Los cuatro agentes rechazaron la burbuja flotante con el mismo argumento: ocluye el
gráfico justo durante las preguntas de manipulación, esconde el historial y complica el
manejo de foco por teclado.

**Accesibilidad**: transcript sincronizado, navegación completa por teclado, contraste,
y **tabla textual alternativa al gráfico manipulable** — sin ella, la manipulación es
inaccesible para quien no usa mouse.

---

## 6. Bake-off

**Comparabilidad gruesa, no control experimental.** *(Decisión de Kristian, 2026-08-10,
que revoca C6 y relaja la decisión 24 del brief.)*

Las cuatro opciones cubren **el mismo concepto con contenido equivalente**. Nada más se
impone. Cada tecnología puede jugar a sus fortalezas: si Remotion rinde mejor con su
propio ritmo, o Manim con su propia estructura de escena, que lo usen.

> **Por qué se revocó.** El plan había llegado a exigir el mismo MP3 y la misma
> `timeline.json` para las cuatro — un control más estricto que el que pedía el brief.
> Kristian lo corta: *"por hacerlas muy comparables vamos a sufrir restricciones
> innecesarias"*. Y tiene razón en el fondo: obligar a Manim y a Remotion a servirse de
> una línea de tiempo pensada para el camino HTML les impide mostrar lo que saben hacer,
> y entonces el bake-off mide su capacidad de imitar a otro, no su valor propio. **El
> objetivo no es aislar una variable: es decidir con qué construimos.**

Cada prototipo se entrega **corriendo dentro de la app** vía su `MediaAdapter`, con los
checkpoints funcionando. Eso se mantiene: no es una restricción de comparabilidad sino
la única forma de ver el costo real de integrar cada opción.

**Guion común**: ~420 palabras, 8 cues + 2 checkpoints. `c1` ejes → `c2` línea con
interceptos → `c3` fórmula → `c4` pendiente → **CP1** → `c5` desplazamiento por m →
`c6` pivote por p1 → `c7` conjunto factible → **CP2** → `c8` resumen.

**Timebox**: 6 h efectivas por opción, hard stop. Guion, MP3 y timeline son costo
compartido pagado **una vez**, fuera del reloj. "No llegó en el presupuesto" es un
resultado que se reporta, no un fracaso que se compensa con más tiempo.

### Los 5 criterios y cómo se miden

| Criterio | Medida |
|---|---|
| 1. Calidad visual y pedagógica | Rúbrica 1–5 de los 4 agentes a ciegas + Kristian, en orden aleatorio. Ítems: legibilidad de rótulos, distinguibilidad pivote-vs-desplazamiento, fidelidad al guion |
| 2. Personalización al vuelo | Cambio estandarizado `(m: 100→150, p1: 10→8, "cerveza"→"café")`. Métricas: **minutos humanos**, segundos de re-render, ¿parametrizable sin tocar código?, **¿el formato es emitible por un LLM?** — *no* líneas de código, que castiga formatos verbosos pero parametrizables |
| 3. Costo por concepto | Horas del `time_log` + proyección del concepto n.º 20 usando el tiempo medido en el criterio 2 |
| 4. Accesibilidad y mantenibilidad | axe-core; ¿el texto es DOM o píxeles?; ¿Kristian corrige una errata editando un `.md`?; ¿cuántos archivos hay que tocar? |
| 5. Versatilidad entre equipos | Matriz de ~6 celdas, abajo |

**Criterio 5 — medición local, sin instrumentación externa.** *(Decisión de Kristian,
2026-08-10: el método del flash con grabación de celular es overkill. "Haz lo que puedas
desde aquí y mi computadora".)*

Tres instrumentos, todos disponibles sin salir de la máquina:

1. **Instrumentación en página.** El propio cue engine registra, en cada disparo, el
   `audio.currentTime` real contra el `t` programado. La diferencia es el **desfase
   interno**, en milisegundos, sin grabar nada. No es el desfase percibido, pero es el
   único sobre el que podemos actuar en código.
2. **Throttling de CPU y emulación de red** desde las herramientas de navegador: bytes
   transferidos, tiempo hasta el primer audio, jank bajo carga.
3. **El equipo viejo real de Kristian** como celda cualitativa: arranca sí/no, se ve
   fluido sí/no. Juicio humano, no cronómetro.

Se pierde el desfase percibido en hardware ajeno, y se acepta explícitamente.

> **Qué se retiró y por qué.** El plan tenía el método del flash de un frame + grabación
> con celular a 30 fps (~33 ms de resolución), propuesta de fable que claude había
> elogiado dos veces. Mide más fino de lo que el proyecto necesita, a cambio de un
> procedimiento manual repetido por celda y por opción. También cae el gate
> `sync p95 ≤ 250 ms` de codex, que era más fino que su propio instrumento.

**Puntaje** = % de celdas "usable sin degradación pedagógica" = audio continuo + gráfico
visible + sin desincronía evidente **a ojo**. Para distinguir "funciona" de "se ve roto",
el ojo basta.

**Hipótesis pre-registrada que la matriz debe poder falsar**: el MP4 gana en equipos
viejos (decodificación por hardware, casi cero JS) y pierde en personalización; HTML es
lo inverso; D hereda de ambos según la celda. **Kristian fija los pesos de los 5
criterios ANTES de ver resultados**, para evitar racionalización post-hoc.

---

## 7. Datos

    students(id, external_auth_id, display_name, lang, created_at)
    concepts(id, pack_version, title_es, title_en)
    subskills(id, concept_id, essential, mastery_threshold, max_attempts)
    sessions(id, student_id, concept_id, media_variant, phase, lang, started_at, ended_at)
    events(id, session_id, ts, type, payload)              -- APPEND-ONLY
    answers(id, session_id, question_id, attempt, raw_answer, grader, score,
            misconception_id, judge_json, model, prompt_version, created_at)
    mastery(student_id, subskill_id, p_mastery, evidence_count, modalities,
            streak_correct, status, updated_at)
    flags(id, student_id, subskill_id, session_id, reason, misconception_id, resolved)
    chat_messages(id, session_id, role, content, phase, model, tokens_in, tokens_out)

**Tres decisiones que parecen menores y no lo son:**

- `events` **append-only** permite reproducir una sesión y **re-correr un juez distinto
  sobre los mismos datos**. Eso da gratis el bake-off de jueces que se descartó por
  costo, y permite mejorar el juez sin volver a molestar a estudiantes reales.
- `answers.model` y `answers.prompt_version` como **columnas**, no enterradas en el blob:
  cuando cambies de modelo vas a querer saber qué diagnósticos vinieron de cuál. Sin eso
  los datos históricos no son comparables.
- `sessions.media_variant` permite **correr el bake-off con estudiantes reales** después.

**Camino al login (decisión 19).** Todo está keyed por `student_id`; pasar a
multi-estudiante es dejar de hardcodear `local-default`, **cero cambio de esquema**.
`external_auth_id` reserva el mapeo a la identidad del destino (InteractiveEduHub es
Django: `auth_user.id`). tutorIA **nunca almacena credenciales** — nada de hashes de
password, que serían deuda de seguridad y de migración a la vez.

---

## 8. Secuencia

| Hito | Contenido | Criterio de salida |
|---|---|---|
| **M0** | Esqueleto FastAPI + schema + `loader.py` + CI. **Medir KaTeX y fijar el presupuesto real** | Tests verdes; presupuesto medido, no estimado |
| **M1** | Guion es/en desde S2 con la voz de Kristian; `audioexplain`; `cues.py` → `timeline.json`. **Validar el catálogo contra Econ 100A _y contra IESA-Micro_** | `timeline.json` valida; las 12 sub-skills mapeadas contra los 22 learning goals de IESA-Micro §III, con lo excluido registrado a propósito |
| **M2** | Opción A end-to-end: audio + SVG por cues + checkpoints + los 4 tipos de pregunta. **Es también el spike que decide vanilla vs React** | Primer loop cerrado |
| **M3** | Graders deterministas + juez LLM **en modo sombra** + set dorado + gate de concordancia | El gate pasa, o se activa la contingencia |
| **M4** | Adaptadores B/C/D; bake-off con timebox; matriz de versatilidad; rúbricas a ciegas | Informe 5 criterios × 4 opciones |
| **M5** | Pack `indifference-curve` **sin tocar código** | Concepto 2 cerrado con solo contenido |
| **M6** | Teclado, tabla alternativa del gráfico, contraste, paridad bilingüe | axe-core limpio; loop completable solo con teclado |

**M3 es el hito que decide si el proyecto tiene sentido.** Si el juez no concuerda con
Kristian, todo lo construido encima es decoración. Por eso el gate va antes de que el
juez pueda mover mastery, y por eso la contingencia está pre-registrada.

**El orden M2 → M4 importa.** La propuesta original de claude ponía el bake-off antes del
shell de runtime, lo que obligaba a juzgar cuatro demos huérfanas. Corrección de fable.

**La manipulación del gráfico se construye al final** dentro de M2: es la pieza más cara
y la única cuyo valor no está demostrado. Si las otras tres formas de pregunta ya mueven
el mastery, eso es un hallazgo, no un recorte.

### "El PoC funciona"

1. Un estudiante nuevo completa `budget-line` de delivery a cierre sin operador.
2. Los 4 tipos de pregunta aparecen y se juzgan.
3. Plantando `BL-M2` deliberadamente, el sistema la **nombra** y aplica la socrática en ≤ 2 intentos.
4. El mastery **sube** en las sub-skills practicadas y sobrevive a recargar el navegador.
5. El cierre formativo se genera sin nota ni números.
6. Corre en Chrome moderno **y** Firefox ESR.
7. **El gate de concordancia con Kristian está pasado**: ≥80% de acuerdo con intervalo
   reportado, recall ≥70% en misconceptions con n≥3, cero IDs fuera de catálogo (§10).
8. **El tiempo entre pausa de checkpoint y primera acción del estudiante queda registrado**
   — es la señal de atención que justifica D1.

> El punto 4 decía originalmente "el mastery **se mueve** en ≥4 de 6 sub-skills".
> *Moverse* incluye bajar: un estudiante que empeora habría satisfecho el criterio.
> Error de claude, detectado por codex.

---

## 9. Riesgos

| # | Riesgo | Mitigación | Qué lo invalidaría |
|---|---|---|---|
| R1 | **El juez es confiadamente incorrecto** | Temperatura 0; ids enum-validados; deterministic-first; modo sombra; set dorado balanceado | Si el gate falla tras 2 calibraciones: el juez deja de decidir mastery; el diagnóstico pasa a distractores MCQ y manipulación; las abiertas quedan como señal formativa |
| R2 | **HTML degrada en equipos viejos** | Solo `transform`/`opacity`; presupuesto en CI; probar temprano en la celda más débil | Si A resulta no usable donde B/C sí, el delivery pasa a MP4 — con `MediaAdapter` es cambiar un adaptador, no la app |
| R3 | **Juzgar la manipulación es ambiguo** | Tolerancias explícitas (pendiente ±10%, interceptos ±0.5); diagnóstico direccional (rotó vs desplazó ⇒ `BL-M2`/`BL-M3`) | Si genera falsos negativos frustrantes: elegir entre 3 posiciones candidatas |
| R4 | **El bake-off se come el PoC** | A es el producto; B/C/D solo dentro del timebox; se recortan celdas de la matriz, jamás el timebox | — |
| R5 | **El formato de pack resulta hostil para que un LLM lo genere** | Prueba barata al final de M5: pedirle a Claude un pack de juguete y validarlo | Si no valida o exige mano humana pesada, **simplificar el esquema antes** de producir los ~18 conceptos restantes |
| R6 | **La granularidad de oración no alcanza** | Regla "un elemento visual por oración", verificada en M1 | Si se exige karaoke por palabra: extensión acotada de AudioExplainer a `WordBoundary` — trabajo real, hoy no presupuestado |

**Supuesto que cambiaría el rumbo:** que el delivery pre-producido alcanza. Si los
estudiantes piden re-explicación de formas que el material pre-producido no puede servir,
ese es el disparador para adelantar la generación al vuelo — y §2.2 hace que adelantarla
no sea una reescritura.

---

## 10. Disensos — RESUELTOS por Kristian (2026-08-10)

### D1 · RESUELTO: **sí hay pausa automática en checkpoint**

**Decisión de Kristian:** el sistema pausa en el checkpoint y espera acción humana del
estudiante. La decisión 11 **no** se extiende a los 2–3 checkpoints guionados.

**Razón del principal, que ningún agente había formulado:** la pausa es además un
**check de atención**. Si el estudiante no está frente a la pantalla, la sesión se
detiene ahí, y ese silencio es señal — se distingue a quien abandonó de quien está
pensando. Ninguna de las cuatro propuestas argumentó esto; los cuatro discutimos la
pausa solo como problema de control, no como instrumento de medición.

Esto **cierra la objeción formal de codex**, que era procedimental y correcta: pedía que
la excepción a la decisión 11 la confirmara el principal en vez de que el plan se la
auto-concediera. Kristian la confirmó explícitamente.

**Implicación de diseño**: el cue `checkpoint` ejecuta `pause()`. El evento de reanudación
es siempre una acción del estudiante. Además, `events` debe registrar el **tiempo entre
la pausa del checkpoint y la primera acción del estudiante** — es la señal de atención
que hace válida esta decisión, y sin registrarla la justificación se pierde.

### D2 · RESUELTO por Kristian, **reformulado tras T-002**

Kristian fijó 80% con intervalo de confianza reportado. **T-002 mostró que el "80% de
acuerdo bruto" no identifica un nivel de fiabilidad**, así que se conserva su decisión de
exigencia pero se cambia el instrumento:

1. **Métrica corregida por azar** — kappa de Cohen (o QWK) como criterio de paso, con el
   acuerdo bruto reportado al lado, nunca como titular, **y siempre junto al baseline de
   clase mayoritaria**.
2. **Umbral relativo al techo medido, no absoluto** — Kristian y un segundo corrector
   etiquetan un solapamiento común → `kappa_humano`. El gate es
   **`kappa_juez ≥ 0.75 × kappa_humano`**.
3. **Estratificar y exigir la barra en el estrato *parcial*** — la muestra no es aleatoria
   sino estratificada por calidad, y la barra se exige donde viven las misconceptions.

> **Por qué.** Nuestro 80% venía por herencia cultural del titular de MT-Bench, que es
> preferencia **pareada**, en setup con los empates **descartados**, azar base ~50% y
> **sin corrección por azar**. Nuestra tarea es multiclase sobre 14 ids con una clase
> "sin misconception" dominante: **un juez que prediga siempre la mayoritaria puede rozar
> el 80% sin diagnosticar nada.** Referencias: en corrección de respuesta corta con
> rúbrica el techo humano fue kappa 0.69 y ningún LLM lo igualó consistentemente (máx
> 0.61); en ASAS los humanos llegan a kappa 0.89–0.98 con facetas binarias mientras los
> LLM se derrumban en el rango medio — que es exactamente donde viven las misconceptions.

**Dependencia nueva y no negociable:** hace falta un **segundo corrector humano** sobre
al menos un subconjunto. Sin techo medido, cualquier umbral flota en el vacío. Ver §10-ter.

### D3 · RESUELTO por Kristian, **con una honestidad añadida por T-002**

- **Artefacto que se reporta**: recall de cada misconception con su n al lado, sin promediar.
- **Gate numérico**, solo donde la muestra lo soporta: recall ≥ 70% sobre misconceptions
  con n ≥ 3; **cero IDs fuera de catálogo** *(ahora sí medible, gracias al valor de escape
  del enum — antes se pasaba por construcción)*; tope de falsos positivos a fijar en M3.
- **El recall por misconception NO se decide en el gate.** Con ~30 respuestas y 14 clases
  son ~2 por clase. Se declara explícitamente **no medido** y se acumula en sombra hasta
  tener n ≥ 8 por clase.

---

## 10-bis. Registro del debate original (histórico)

### D1 · ¿La decisión 11 aplica a los checkpoints guionados?

**El desacuerdo.** `codex` sostiene que pausar automáticamente en un checkpoint
contradice tu decisión 11 ("el estudiante elige cuándo pausar"). `fable`, `agy` y
`claude` leyeron que la decisión 11 gobierna que el *tutor* no robe el control durante
la reproducción, no la estructura del guion.

**El argumento de fable**: un checkpoint no es una pausa impuesta sobre contenido en
curso, es el **fin guionado de un segmento** — la narración misma formula la pregunta y
ahí termina la oración, así que no hay nada que el estudiante se pierda. La alternativa
de anunciar sin detener produce lo peor de ambos mundos: la narración sigue hablando por
encima de su propia pregunta.

**El argumento de codex**: tu decisión fue explícita y una excepción debería confirmarla
el principal, no inferirla el plan.

Es 3–1, pero es interpretación de tu intención, así que no se resuelve por votos.
**Pregunta concreta: ¿la decisión 11 aplica a los 2–3 checkpoints guionados?**
Si dices que sí, el cambio es un `if` (el cue pasa de `pause()` a `announce()`), no un
rediseño.

### D2 · Umbral del gate de concordancia

`codex` propone ≥85% de acuerdo en correcto/parcial/incorrecto. `claude` y `fable`
proponen ≥80%. Es un parámetro, no arquitectura. **Recomendación: 80% para el PoC**,
subiendo a 85% antes de exponerlo a estudiantes reales.

### D3 · Métrica de misconceptions

`codex` propone macro-F1 ≥ 0.75. `claude` y `fable` sostienen que con ~13 clases y un set
dorado realista de ~30 respuestas, varias clases quedan con n ≤ 2 y el macro-F1 se mueve
decenas de puntos por un solo caso — es ruido, no medición.

**Recomendación (3–1): recall por misconception reportado con su n, sin promediar**, más
acuerdo global y conteo de falsos positivos. Si prefieres una sola cifra, hay que subir
el set dorado a ~10 ejemplos por misconception, o sea ~130 respuestas etiquetadas por ti
a mano.

### Resuelto sin ti

**Vanilla TS vs React**: lo decide el spike de M0–M2. Si el estado del dock más los 4
tipos de pregunta se vuelve inmanejable sin framework, React entra con el mismo
presupuesto de peso. Preferencia inicial registrada, no posición rígida.

---

## 10-ter. Lo que T-002 dejó pendiente de ti

Tres cosas que no puede resolver ningún agente y que **no bloquean empezar a construir**,
pero sí bloquean M3 (el gate del juez) si no se resuelven antes de llegar ahí.

| # | Qué | Por qué importa | Cuándo hace falta |
|---|---|---|---|
| **K1** | **¿Hay un segundo corrector humano?** | El gate reformulado necesita `kappa_humano` como denominador. Si eres el único que etiqueta, no hay techo medido y el umbral vuelve a flotar en el vacío | Antes de M3 |
| **K2** | **Pedir IESA-Micro hoy** | Formulario gratuito, lead time desconocido. Si llega, ahorra gran parte del etiquetado manual de M3 | Ya — es lo único con latencia externa |
| **K3** | **¿Asumimos el riesgo del catálogo sin precedente?** | Ningún instrumento de economía nombra la misconception con un id estable. O lo construimos nosotros, o derivamos los ids de las entrevistas think-aloud que IESA-Micro ya hizo | Antes de M1 |

**K2 es el único urgente**, y solo porque depende de un tercero. Los otros dos se pueden
decidir mientras se construye M0.

---

## 11. Errores cometidos durante el proceso

Se registran porque el plan se apoya en ellos y porque ocultarlos falsearía la calidad
de la evidencia.

| Quién | Error | Cómo se detectó |
|---|---|---|
| claude | El brief afirmaba que AudioExplainer sincroniza por **palabra**. Es por **oración**. La propuesta de claude apoyaba en eso el resaltado de fórmulas | fable leyó el código; claude verificó y corrigió el brief |
| claude | No dio timebox para el bake-off | Los otros tres sí lo dieron |
| claude | "El mastery **se mueve** en ≥4 de 6" acepta movimiento negativo | codex |
| claude | `IC.5 tangency` mezclaba restricción con preferencias | codex |
| claude | Su `[blocker]` de 250 KB mezclaba bytes crudos con gzip | fable — la conclusión sobrevivió por otra vía (fuentes woff2), pero **ninguno de los dos números está medido** |
| claude | La regla de mastery 0.4/0.6 era un número inventado con aire de rigor | claude, en su propia autocrítica |
| codex | 20 sub-skills bloqueantes hacían la sesión incompletable (~40 respuestas juzgadas) | claude y fable; codex se retractó a 12 + 2 |
| agy | Criterio de éxito solo happy path: se cumple aunque el juez diagnostique al azar | claude, codex y fable independientemente; agy concedió |
| agy | 7 sub-skills dejaban misconceptions sin dónde registrarse | fable y codex; agy concedió |
| fable | Presupuesto de 250 KB no cerraba con KaTeX embarcado | claude; fable resolvió sacando KaTeX a build-time |
| fable | Doble penalización por misconception contaba la evidencia dos veces | codex; fable lo corrigió |

**Nota de procedencia.** La propuesta de ronda 1 de `fable` la produjo un subagente
lanzado por Opus 5, porque su wake CLI fallaba (H-001, causa: wake target sin flags de
streaming, escrito de memoria por Opus 5 en vez de copiado del patrón que Kristian ya
usaba en AIstigmergy). Se le prohibió leer el thread y confirmó no haberlo hecho, así que
la ceguera se preservó — pero **su voz de ronda 1 pasó filtrada por Opus 5, y las de
codex y agy no**. Desde la ronda 2, `fable` participa como agente CLI independiente.
