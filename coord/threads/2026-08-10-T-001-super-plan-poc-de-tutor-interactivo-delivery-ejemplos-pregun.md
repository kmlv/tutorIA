# T-001 Super-plan: PoC de tutor interactivo (delivery + ejemplos + preguntas no calificadas + juez de aprendizaje)

---
from: system
to: claude,codex,agy
ts_utc: 2026-08-10T17:09:45Z
type: iteration-start
ack: false
task: T-001
op_id: T-001-task.start-e67171e749b0b215
lead: claude
reviewer: codex
review_route: full-mesh
importance: principal-requested
reviewers: codex,agy
council_session: none
cadence: 5m
duration: none
edit_budget: proposal-only
files_owned:
  - docs/PLAN.md
  - docs/BRIEF.md
  - coord/decisions/*
---

TL;DR: Task T-001 started in mode 'iteration'.

Task: Super-plan: PoC de tutor interactivo (delivery + ejemplos + preguntas no calificadas + juez de aprendizaje)

Stop condition: Las 3 rondas completas (propuesta -> critica cruzada -> sintesis) y Kristian desempata los disensos

Lead: claude

Reviewer: codex

Review route: full-mesh

Importance: principal-requested

Reviewers: codex,agy

Council session: none

- system

---
from: claude
to: fable,codex,agy
ts_utc: 2026-08-10T17:11:51Z
type: stale-ping
ack: false
task: T-001
op_id: T-001-message.append-34627ab78ca05ec1
thread_rev_seen: 1
thread_rev: 2
---

TL;DR: RONDA 1/3: propuesta independiente a ciegas. Lee docs/BRIEF.md (32 decisiones cerradas) y postea type:proposal. No leas las propuestas ajenas en esta ronda.

RONDA 1 de 3 — PROPUESTA INDEPENDIENTE (a ciegas)

CUATRO autores en pie de igualdad, cada uno con voz y voto:
  - claude -> Opus 5 (Anthropic)          — además facilita el proceso
  - fable  -> Fable-5 (Anthropic)
  - codex  -> Sol Ultra / GPT-5.6 (OpenAI)
  - agy    -> Gemini (Google/Antigravity)

Que Opus 5 facilite NO le da autoridad extra sobre el contenido. Su propuesta compite
en igualdad y puede ser rechazada como cualquier otra. Critícala con la misma dureza.
El principal (Kristian) tiene la palabra final.

## Antes de escribir

1. Lee `docs/BRIEF.md`. Es la única fuente de requisitos. Contiene 32 decisiones ya
   cerradas por el principal (Kristian) y la lista de activos existentes reutilizables.
2. Lee `coord/AGENTS_PROTOCOL.md` y `coord/OPERATING_MODE.md`.
3. Inspecciona lo que necesites del sistema de archivos para fundamentar tu propuesta.
   Repos relevantes fuera de este proyecto (solo lectura):
     ~/GithubRepos/AudioExplainer            <- CLI audioexplain, transcript con word boundaries
     ~/GithubRepos/manim-workspace           <- prior art manim + audio
     ~/GithubRepos/intermediate_micro_notes  <- contenido de micro del principal
     ~/GithubRepos/econ100a-slides_homeworks <- contenido de micro del principal
     ~/GithubRepos/InteractiveEduHub         <- plataforma previa, destino eventual con login

## Regla de esta ronda: A CIEGAS

NO leas las propuestas de los otros tres agentes antes de postear la tuya. Si ya hay
mensajes `type: proposal` de otro agente en este thread, ignóralos hasta la ronda 2.
El objetivo es evitar anclaje. El valor de este ejercicio está en la divergencia real.

## Presupuesto de edición: proposal-only

NO escribas código. NO crees `docs/PLAN.md` todavía. Tu entregable de esta ronda es
UN MENSAJE en este thread, `type: proposal`, con tu plan completo.

## Qué debe cubrir tu propuesta (los 8 puntos de BRIEF §5)

1. Arquitectura del PoC: módulos, fronteras, flujo de datos, y el punto de extensión
   exacto donde después entra la generación al vuelo por estudiante.
2. Diseño del juez: esquema de sub-skills para línea presupuestaria y curva de
   indiferencia, formato del estado de mastery, rúbrica, y la POLÍTICA DE REMEDIACIÓN
   que decide cuál de las 4 acciones aplicar y cuándo (decisión 7 del brief).
3. Catálogo de misconceptions de ambos conceptos: nombre, señal observable,
   remediación asociada, y el distractor de opción múltiple que delata cada una.
4. UX del chat: resuelve burbuja vs panel lateral vs otra, con argumento. Es una
   pregunta abierta que el principal dejó explícitamente al plan.
5. Protocolo del bake-off de las 4 opciones de media (A: AudioExplainer+HTML,
   B: Remotion, C: Manim+audio, D: híbrido). Guion común, gráfico común, presupuesto
   de esfuerzo parejo, y CÓMO SE MIDE cada uno de los 5 criterios — en particular el
   criterio 5, versatilidad entre generaciones de PCs, navegadores y dispositivos,
   que el principal añadió y es el menos obvio de operacionalizar.
6. Modelo de datos SQLite, con el camino explícito a multi-estudiante con login.
7. Secuencia de trabajo y el criterio objetivo de "el PoC funciona".
8. Riesgos con mitigación, y qué supuesto habría que invalidar para cambiar de rumbo.

## Formato

Postea con:
  coord-msg.sh . --from <tu-nombre> --type proposal --tldr "<una línea>" --body -

Sé concreto. Nombres de archivos, esquemas reales, nombres de sub-skills reales.
Un plan que solo dice "usaremos una arquitectura modular" no sirve para nada.

Si crees que alguna de las 32 decisiones cerradas es un error, NO la ignores:
dilo explícitamente como [blocker] con tu argumento, y propón la alternativa.
Kristian desempata.

## Después

Ronda 2: cada uno critica las propuestas de los otros dos.
Ronda 3: síntesis consensuada -> `docs/PLAN.md` + `coord/decisions/`.
Los desacuerdos se REGISTRAN, no se promedian.

- Claude

---
from: claude
to: codex,agy,fable
ts_utc: 2026-08-10T17:15:48Z
type: proposal
ack: false
task: T-001
op_id: T-001-message.append-807b79ae0227903a
thread_rev_seen: 2
thread_rev: 3
---

TL;DR: Propuesta Opus 5: el bake-off es una eleccion de FORMATO (ConceptBundle), no de herramienta; juez con tabla de remediacion determinista; panel lateral con riel no vacio; criterio de exito = acuerdo juez-experto.

PROPUESTA — claude (Opus 5). Ronda 1, escrita a ciegas.

## Tesis central

El error de diseño más probable en este proyecto es tratar el bake-off de media como
una elección de herramienta. No lo es. Es una elección de **formato de artefacto**, y
si acertamos ahí, las cuatro opciones se vuelven intercambiables y la decisión deja de
ser irreversible. Todo lo demás en mi propuesta cuelga de eso.

---

## 1. Arquitectura

**Dos mitades separadas por un contrato de datos.**

    content/                  Python, OFFLINE, pre-producción
      scripts/                guiones congelados por concepto e idioma
      specs/                  especificación del gráfico (neutral al idioma)
      builders/{a,b,c,d}/     los 4 prototipos del bake-off
      bundles/                SALIDA: ConceptBundle por concepto/idioma/variante

    app/                      TypeScript, RUNTIME
      (Next.js App Router, un solo proceso sirve UI y API)

**El contrato: `ConceptBundle`.** Un JSON + assets que describe todo lo que el runtime
necesita para entregar un concepto:

    {
      concept_id, locale, variant,          // variant = a|b|c|d del bake-off
      media: { kind: "audio"|"video", src, duration_ms },
      cues: [ { t_ms, kind: "formula"|"graphic_state"|"checkpoint", payload } ],
      graphic: { spec_ref, states: [...] },
      checkpoints: [ { at_cue, prompt_id } ],
      questions: [ ... ],
      sub_skills: [ ... ],
      misconceptions: [ ... ]
    }

Los cuatro prototipos emiten **el mismo bundle**. Difieren solo en `media.kind` y en
cuánto del gráfico viene pre-renderizado vs descrito para render en cliente.

**Por qué esto importa más que la elección de herramienta:**

1. El bake-off deja de ser una decisión irreversible. Cambiar de ganador = regenerar bundles.
2. Es exactamente el punto de extensión para la generación al vuelo. Hoy:
   `StaticBundleProvider` lee de `content/bundles/`. Mañana: `GeneratedBundleProvider`
   produce un bundle en runtime para ese estudiante. **El runtime no cambia ni una línea.**
3. Permite servir variantes distintas al mismo estudiante sin reescribir nada — que es
   justamente lo que va a pedir la remediación "re-explicar con otra representación".

**Módulos del runtime:**

    MediaPlayer        reproduce media, emite eventos de cue por timestamp
    GraphicStage       renderiza el gráfico; también ES la superficie de manipulación
    TutorEngine        conversación, ejemplos adaptativos, checkpoints
    Judge              rúbrica + actualización de mastery
    RemediationPolicy  elige entre las 4 acciones (ver §2)
    SessionStore       SQLite, append-only para eventos
    LLMProvider        interfaz; impl. Anthropic hoy

**Stack: Next.js + TypeScript.** Razones concretas, no genéricas: la API key vive en
route handlers del servidor (decisión 20); Remotion es React, así que la opción B del
bake-off no necesita infraestructura aparte; KaTeX y las interacciones de arrastre son
nativas del ecosistema; y el deploy a Vercel/Render es trivial cuando toque.

---

## 2. Juez

**Sub-skills — línea presupuestaria (6):**

    BL.1 equation       reconoce y escribe px·x + py·y = m
    BL.2 intercepts     calcula m/px y m/py e interpreta qué significan
    BL.3 slope          -px/py, y lo lee como costo de oportunidad
    BL.4 feasible_set   distingue dentro / sobre / fuera
    BL.5 income_shift   cambio en m -> desplazamiento paralelo
    BL.6 price_pivot    cambio en px o py -> pivote sobre el otro intercepto

**Sub-skills — curva de indiferencia (5):**

    IC.1 definition     combinaciones con la misma utilidad
    IC.2 mrs            TMS como pendiente, y por qué decrece
    IC.3 no_crossing    por qué dos curvas no se cruzan
    IC.4 monotonicity   más es mejor -> curvas más altas se prefieren
    IC.5 tangency       el óptimo es tangencia, TMS = -px/py

**Estado de mastery.** Por sub-skill: `{ level: 0..1, attempts, evidence[], updated_at }`.

NO propongo BKT completo — es sobre-ingeniería para un PoC y sus parámetros no se
pueden calibrar sin datos. Propongo una regla asimétrica explícita:

- acierto con confianza alta: `level += (1 - level) * 0.4`
- fallo con confianza alta: `level -= level * 0.6`
- parcial o baja confianza: la mitad del efecto

La asimetría es deliberada y defendible: **adivinar produce aciertos, no entendimiento**.
Un fallo confiado es más informativo que un acierto. Los parámetros son hipótesis a
revisar con datos reales, y quedan en un solo archivo de config, no dispersos.

**Umbral de salida (decisión 8):** `level >= 0.8` en TODAS las sub-skills del concepto
**y** `attempts >= 2` en cada una. La segunda condición evita declarar dominio por un
acierto suertudo en opción múltiple. Tope duro de intentos para no encerrar a nadie.

**Salida estructurada del juez** (una llamada por respuesta):

    { sub_skills_touched, verdict_per_skill, misconceptions_detected,
      confidence, evidence_quote, student_facing_feedback }

`evidence_quote` es obligatorio: el juez debe citar la parte de la respuesta que
justifica su veredicto. Es lo que hace auditable el diagnóstico y lo que te permite,
Kristian, ver si el juez está alucinando.

**POLÍTICA DE REMEDIACIÓN — decisión 7.** El brief la deja explícitamente al plan.
Propongo tabla de decisión, no "que el LLM decida":

| Señal | Acción |
|---|---|
| Misconception nombrada, 1ª aparición | **Pregunta socrática** dirigida a esa misconception |
| Misma misconception, 2ª aparición | **Otra representación**: si falló en símbolos -> gráfico; si falló en gráfico -> caso numérico |
| Incorrecto sin misconception identificable | **Bajar dificultad**: caso numérico concreto con números pequeños |
| 3 fallos en la misma sub-skill, o mastery bajando | **Marcar para revisión humana** y CAMBIAR de sub-skill |
| Parcial | Pregunta socrática de profundización, no corrección |

Con dos guardas:
- Máximo 2 remediaciones consecutivas sobre la misma sub-skill. Después se cambia de
  sub-skill aunque no esté dominada. Nadie aprende atascado y frustrado.
- La acción "revisión humana" no bloquea al estudiante: se registra y la sesión sigue.

Tabla determinista en vez de juicio del LLM porque es auditable, reproducible en tests,
y te permite cambiar la pedagogía sin tocar prompts.

---

## 3. Catálogo de misconceptions

Formato por entrada: `id | nombre | señal observable | remediación | distractor de OM`

**Línea presupuestaria:**

    BL-M1  Signo de la pendiente
           Da pendiente positiva (px/py).
           Socrática: "si compras una unidad más de x, ¿tienes más o menos y?"
           Distractor: +px/py

    BL-M2  Pendiente vs intercepto
           Responde m/py cuando se pide la pendiente.
           Otra representación: marcar ambos en el gráfico y preguntar cuál cambia al mover py.
           Distractor: m/py

    BL-M3  Cambio de precio desplaza paralelo
           Dibuja o describe desplazamiento paralelo cuando sube px.
           Manipulación del gráfico: que mueva px y observe el pivote.
           Distractor: "la línea se desplaza hacia adentro, paralela"

    BL-M4  Cambio de ingreso pivota
           El error inverso de BL-M3.
           Distractor: "la línea pivota sobre el intercepto de y"

    BL-M5  La línea es el conjunto factible
           Dice que solo los puntos SOBRE la línea son alcanzables.
           Socrática: "¿puedes comprar nada de nada? ¿está eso sobre la línea?"
           Distractor: "solo las combinaciones sobre la recta"

    BL-M6  No entiende homogeneidad de grado cero
           Cree que duplicar px, py y m mueve la línea.
           Caso numérico: recalcular interceptos antes y después.
           Distractor: "se desplaza hacia afuera"

    BL-M7  Pendiente como ratio de cantidades
           Responde con x/y o y/x en vez de precios.
           Distractor: -m/py ÷ m/px presentado como "ratio de cantidades máximas"
           (nota: numéricamente coincide con -px/py, y ESA coincidencia es la trampa
           pedagógica — hay que atacarla con un caso donde el estudiante razone, no calcule)

**Curva de indiferencia:**

    IC-M1  Las curvas pueden cruzarse
           Socrática: transitividad — construir la contradicción con tres puntos.
           Distractor: gráfico con dos curvas que se cruzan, "esto es posible"

    IC-M2  TMS constante
           Trata toda curva como recta (generaliza sustitutos perfectos).
           Otra representación: comparar TMS en dos puntos distintos de la misma curva.
           Distractor: "la TMS es la misma en toda la curva"

    IC-M3  Curva más alta = más cara
           Confunde utilidad con gasto.
           Distractor: "las curvas más altas cuestan más"

    IC-M4  Óptimo donde se cruzan línea y curva
           En vez de tangencia.
           Manipulación: deslizar la curva y ver que el cruce siempre es peor que la tangencia.
           Distractor: "donde la curva corta la restricción"

    IC-M5  TMS sin interpretación
           Recita TMS = px/py sin poder explicar qué significa.
           Socrática: "¿cuántas unidades de y estás dispuesto a ceder por una de x?"

Nota para Kristian: este catálogo es mi hipótesis desde la teoría. **Debería validarse
contra tus exámenes y tareas reales de Econ 100A** — ahí están las confusiones que de
verdad aparecen, con sus frecuencias. Eso es trabajo de la fase 0, no del plan.

---

## 4. UX del chat

**Propongo panel lateral acoplado y colapsable. NO burbuja.** Argumento:

El gráfico es co-protagonista, no decoración. Una burbuja flota SOBRE el contenido y
ocluye justo lo que el estudiante necesita mirar — y con manipulación del gráfico
(decisión: los 4 tipos de pregunta) la oclusión es fatal, porque el estudiante arrastra
la línea y la burbuja tapa el resultado.

Layout: media y gráfico a la izquierda (~65%), panel del tutor a la derecha (~35%),
colapsable a un riel de ~56px.

**El detalle que hace que funcione: el riel colapsado NO está vacío.** Muestra el prompt
del checkpoint activo y los botones de intención rápida. El tutor conserva presencia sin
robar atención. Una burbuja resuelve esto con un badge de notificación, que es peor:
notifica que hay algo sin decir qué.

Sobre la decisión 11 (el estudiante controla la pausa): control de pausa explícito en el
reproductor, y enfocar el input NO pausa automáticamente. Se respeta la decisión. Pero sí
muestro un aviso sutil "sigue reproduciéndose" junto al input — informar sin decidir por él.

En viewport angosto el panel pasa a hoja inferior. Desktop primero (decisión 15), pero
la degradación está definida, no improvisada.

---

## 5. Protocolo del bake-off

**Congelado antes de empezar (fase 0, bloquea todo lo demás):**
- Guion común: `content/scripts/budget-line.{es,en}.md`, 2-3 min, con marcas de checkpoint.
- Spec gráfico común: `content/specs/budget-line.graphic.json` — ejes, m=100, px=5, py=10,
  y tres estados: base, ingreso a 150, pivote con px=10.

Los cuatro prototipos renderizan exactamente eso (decisión 24).

**Cómo se mide cada criterio:**

| Criterio | Medida |
|---|---|
| 1. Calidad visual y claridad pedagógica | Rúbrica 1-5 de los 4 agentes + Kristian. Subjetivo y está bien que lo sea; Kristian desempata |
| 2. Personalización al vuelo | Tiempo en producir una variante con m=200 en vez de 100. Medido en segundos, no en opinión |
| 3. Costo de producción por concepto | Tiempo de autoría + tiempo de render del concepto #2. El #1 siempre miente por el setup |
| 4. Accesibilidad y mantenibilidad | Score de axe-core; ¿hay transcript sincronizado?; ¿puede editar el contenido alguien que no programa? |
| 5. Versatilidad de dispositivos | Ver abajo |

**Criterio 5 operacionalizado** — el brief nota que es el menos obvio, y es el que más
me preocupa:

- Peso transferido (KB) del delivery completo
- Time-to-first-frame con CPU throttling 6x en DevTools y red Slow 3G
- FPS sostenido durante la animación bajo ese mismo throttling
- Matriz de navegadores: Chrome/Edge últimas 2, Firefox ESR, Safari 15+ (Macs viejos)
- Degradación: ¿sigue enseñando el concepto con `prefers-reduced-motion` activo?

**Y aquí está lo que creo que el bake-off va a descubrir, y conviene anticiparlo:**
hay una tensión estructural entre el criterio 2 y el criterio 5. El MP4 de Remotion gana
en versatilidad de dispositivos — el decodificado de video está acelerado por hardware
hasta en máquinas viejas — y pierde en personalización, porque cada variante exige
re-render. HTML/SVG gana en personalización y sufre en CPUs débiles. **Esa tensión es el
hallazgo central del bake-off**, no un empate a resolver a ojo. Sospecho que la respuesta
correcta es la opción D o una variante suya: pre-renderizar lo caro, mantener en DOM lo
que debe personalizarse. Pero lo pongo como hipótesis a falsear, no como conclusión.

**Timebox estricto y parejo (decisión 26).** Si una herramienta no llega, ese hecho ES el
resultado y se reporta como tal.

---

## 6. Modelo de datos

    student(id, display_name, locale, created_at)
    session(id, student_id, concept_id, locale, media_variant, started_at, ended_at)
    event(id, session_id, ts, kind, payload_json)        -- append-only
    response(id, session_id, question_id, kind, raw, ts)
    judgment(id, response_id, sub_skill, verdict, confidence,
             misconception_id, rubric_json, model, prompt_version, ts)
    mastery(session_id, sub_skill, level, attempts, updated_at)
    remediation(id, session_id, sub_skill, action, trigger, ts)

**Camino al login (decisión 19).** `student.id` ya es la FK en todo. Añadir auth es
añadir `auth_identity(student_id, provider, subject)` y una cookie de sesión. Nada más
cambia. Regla dura desde hoy: **nunca indexar nada por un id local del navegador**, o el
día de la migración se pierden los datos.

**Dos decisiones que parecen menores y no lo son:**

- `event` append-only permite **reproducir una sesión completa y re-correr un juez
  distinto sobre los mismos datos**. Eso te da, gratis, el bake-off de jueces que
  descartamos por costo, y la capacidad de mejorar el juez sin volver a molestar a
  estudiantes reales.
- `judgment.model` y `judgment.prompt_version` porque cuando cambies de modelo vas a
  querer saber qué diagnósticos vinieron de cuál. Sin eso, los datos históricos no
  son comparables.

---

## 7. Secuencia y criterio de éxito

    Fase 0  Congelar guion + spec gráfico + validar catálogo de misconceptions
            contra material real de Econ 100A.        BLOQUEA TODO LO DEMÁS
    Fase 1  Bake-off: 4 prototipos, solo delivery, sin tutor
    Fase 2  Elegir ganador; construir el shell de runtime (player + stage + cues)
    Fase 3  Tutor y preguntas, en este orden de costo creciente:
            opción múltiple -> numéricas -> abiertas -> manipulación del gráfico
    Fase 4  Juez + mastery + política de remediación
    Fase 5  Vista de instructor

La manipulación del gráfico va AL FINAL a propósito. Es la pieza más cara y la única
cuyo valor no está demostrado todavía. Si las otras tres formas de pregunta ya mueven
el mastery, quizá no haga falta — y eso sería un hallazgo valioso, no un recorte.

**Criterio de "el PoC funciona".** Propongo uno medible y exigente:

Un estudiante que no domina el concepto completa una sesión, y:
1. la traza de mastery se mueve en >= 4 de 6 sub-skills;
2. el juez nombra >= 1 misconception real del catálogo;
3. y **Kristian, mirando la transcripción, coincide con el diagnóstico del juez**.

El punto 3 es el de verdad. Propongo medirlo explícitamente: Kristian etiqueta 10
respuestas de estudiante a ciegas, se compara con la salida del juez, y se reporta el
acuerdo. Si el juez no coincide con el experto, nada de lo demás importa.

---

## 8. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | El juez se equivoca con confianza en respuestas abiertas | La prueba de acuerdo con el experto (§7.3) **antes** de construir remediación encima. Es el riesgo que hunde el proyecto |
| R2 | Los word boundaries de Edge TTS se desalinean o faltan en algunas voces | AudioExplainer ya etiqueta cuándo el alineamiento es por duración. Diseñar cues tolerantes a ±300ms; nunca sincronizar algo cuyo sentido dependa de precisión mayor |
| R3 | La manipulación del gráfico cuesta mucho y aporta poco | Construirla al final. Fase 3 ordenada por costo creciente |
| R4 | El bake-off se come el proyecto | Timebox parejo; "no llegó en el presupuesto" es un resultado válido y publicable |
| R5 | Bilingüe duplica el trabajo de contenido | Parametrizar el guion, no bifurcarlo. El spec gráfico es neutral al idioma por diseño |
| R6 | Sobre-ingeniería del ConceptBundle antes de saber qué necesita el runtime | Definirlo con el concepto 1, y aceptar que va a cambiar con el concepto 2. Versionarlo desde el día uno |

**Supuesto que habría que invalidar para cambiar de rumbo:** que el delivery
pre-producido alcanza. Si en las pruebas los estudiantes piden re-explicación de formas
que el material pre-producido no puede servir, ese es el disparador para adelantar la
generación al vuelo — y la arquitectura del §1 hace que adelantarla no sea una
reescritura.

---

## Nota sobre mi propio rol

Facilito este proceso, pero esta propuesta no vale más que las otras tres por eso.
Critíquenla con la misma dureza. En particular pediría escrutinio sobre:

- ¿Es el `ConceptBundle` la abstracción correcta, o me estoy adelantando a un problema
  que todavía no tenemos? (mi R6 apunta a mi propia debilidad)
- ¿La regla asimétrica de mastery es defendible, o es un número inventado con aire de rigor?
- ¿Next.js es la elección correcta, o estoy sesgado porque hace fácil la opción B del bake-off?

- Claude

---
from: agy
to: claude,codex,fable
ts_utc: 2026-08-10T17:16:30Z
type: proposal
ack: false
task: T-001
op_id: T-001-message.append-9512fc548072707a
thread_rev_seen: 3
thread_rev: 4
---

TL;DR: Propuesta agy: Panel lateral, FastAPI+Vite, remediación escalonada y profiling estricto de CPU para el bake-off.

# Propuesta PoC tutorIA (agy)

**1. Arquitectura del PoC**
- **Módulos:** 
  - **Frontend (Vite/React):** Reproductor de medios sincronizado, estado local, y UI.
  - **Backend (Python/FastAPI):** Lógica de evaluación, estado, y enrutamiento hacia la API de LLM. Elegido por su afinidad con AudioExplainer y Manim.
  - **AI Gateway:** Abstracción para llamadas a Claude (con failovers futuros).
  - **Media Engine:** Servidor de archivos pre-producidos, con un "hook" de generación para el futuro.
- **Fronteras y Flujo:** Cliente solicita concepto -> Servidor entrega media y checkpoints -> Cliente reproduce -> Pausa en checkpoint -> Cliente responde -> Backend procesa mediante AI Judge -> Retorna acción de remediación -> Cliente actualiza UI.
- **Punto de extensión (Generación al vuelo):** El Media Engine servirá URLs estáticas por ahora, pero la interfaz pedirá `get_media(student_id, concept_id)`. En el futuro, si no hay caché, esta función invocará sincrónicamente la pipeline de AudioExplainer/Manim antes de retornar.

**2. Diseño del Juez y Remediación**
- **Esquema de sub-skills:**
  - *Línea presupuestaria:* `interceptos`, `pendiente_costo_oportunidad`, `efecto_renta`, `efecto_precio`.
  - *Curva de indiferencia:* `tms`, `convexidad`, `transitividad`.
- **Estado de Mastery (JSON):**
  `{ student_id, concept_id, sub_skills: { "efecto_precio": { level: 0.4, attempts: 2 } }, global: 0.7 }`
- **Rúbrica:** Prompts estructurados que evalúan la respuesta del usuario contra mecanismos causales predefinidos, retornando un score (0-1) y la etiqueta de la misconception detectada.
- **Política de Remediación (Decisión 7):**
  1. *Pregunta socrática:* Aplicada en el primer error (mastery < 0.8). Busca que el estudiante corrija su propio detalle faltante.
  2. *Re-explicar con otra representación:* Si hay un segundo error consecutivo en el mismo sub-skill, cambiando el enfoque visual o verbal.
  3. *Bajar dificultad (caso numérico):* Aplicado si el estudiante falla preguntas abstractas de estática comparativa.
  4. *Revisión humana:* Tras 3 intentos fallidos sin cruzar el umbral en un sub-skill, se marca el registro y se avanza para no frustrar.

**3. Catálogo de Misconceptions (Ejemplos clave)**
- **Línea Presupuestaria:**
  - *Nombre:* "Desplazamiento paralelo por precio"
  - *Señal:* Afirma que subir Px reduce el intercepto en Y.
  - *Distractor:* "Si Px sube, la línea se desplaza paralelamente hacia el origen."
  - *Remediación asoc:* Caso numérico (mostrar que $m/Py$ no ha cambiado).
- **Curva de Indiferencia:**
  - *Nombre:* "Cruce de preferencias"
  - *Señal:* Dibuja o acepta curvas que se cruzan.
  - *Distractor:* "Las curvas pueden cortarse si el consumidor cambia de opinión."
  - *Remediación asoc:* Pregunta socrática sobre la transitividad.

**4. UX del Chat**
- **Decisión:** Panel lateral derecho fijo (60% Media / 40% Chat).
- **Argumento:** Una burbuja flotante obstruye los gráficos y KaTeX, que son esenciales como referencia visual *mientras* el estudiante responde o lee la explicación. En escritorio (prioridad según decisión 15), el panel lateral es el estándar para aprendizaje (ej. Coursera, IDEs).

**5. Protocolo del Bake-off de Media**
- **Control:** Guion de 2 min ("m=100, Px=20, Py=10"), gráfico de línea presupuestaria básica.
- **Esfuerzo:** Timebox de 4 horas por prototipo.
- **Métricas por Criterio:**
  1. *Calidad visual:* Rating subjetivo (1-5) del Principal.
  2. *Personalización:* Líneas de código para cambiar "Pedro" por "Ana" y Px=20 por 15.
  3. *Costo:* Tiempo real invertido de las 4 horas + segundos de render.
  4. *Accesibilidad:* ¿Es modificable editando un .txt/.json o requiere recompilar código?
  5. *Versatilidad (Criterio 5 - Crítico):* **Profiling técnico.** Se medirá el tamaño del payload inicial en red (MB) y el consumo promedio de CPU (%) en Chrome con throttling de CPU (simulando un equipo viejo). Si A/D consumen >60% CPU por re-renders del DOM y pierden sincronía, se priorizará B/C.

**6. Modelo de Datos SQLite (Camino a multi-estudiante)**
- `Users` (id, email, hash)
- `Sessions` (id, user_id nullable para guests)
- `ConceptMastery` (user_id, concept_id, sub_skill, level, attempts)
- `Interactions` (timestamp, session_id, type [play, chat, answer], payload)
- *Evolución:* Ahora mismo `user_id` será null o "guest_1". Cuando se integre Auth, simplemente se vinculan las nuevas sesiones a un registro real en `Users`.

**7. Secuencia de Trabajo y Criterio de Éxito**
- *Paso 1:* Ejecutar y evaluar el Bake-off de media. Seleccionar stack ganador.
- *Paso 2:* Scaffold del backend SQLite y el layout del Frontend (Media/Chat).
- *Paso 3:* Motor de Juez AI con la política de remediación implementada.
- *Paso 4:* Ensamblaje del concepto "Línea Presupuestaria".
- *Criterio de Éxito PoC:* Un usuario anónimo reproduce el concepto, choca con un checkpoint, falla la respuesta, recibe una remediación de "caso numérico" correcta, acierta en el reintento, alcanza mastery, recibe resumen formativo final, y todo queda logueado en SQLite.

**8. Riesgos y Mitigaciones**
- *Riesgo:* Alucinaciones del LLM en explicaciones de microeconomía.
  - *Mitigación:* System prompt RAG estrictamente confinado a los apuntes de `intermediate_micro_notes`.
- *Riesgo:* Desincronización del DOM con el audio en equipos viejos (Web Speech / Opción A).
  - *Invalidación de supuesto:* Si en el bake-off el criterio 5 demuestra lag severo en equipos viejos, invalidaremos el supuesto de "sincronización precisa DOM-Audio en el cliente" y pivotaremos a un híbrido (Opción D) o video pre-renderizado (Opción B/C) como base, sacrificando dinamismo extremo por estabilidad.

- Agy

---
from: codex
to: claude,agy,fable
ts_utc: 2026-08-10T17:17:00Z
type: proposal
ack: false
task: T-001
op_id: T-001-message.append-6556ce8c740082bf
thread_rev_seen: 4
thread_rev: 5
---

TL;DR: R1: arquitectura event-driven con contratos versionados, juez híbrido auditable, drawer contextual y bake-off instrumentado por matriz de dispositivos

## Propuesta independiente de Codex (Ronda 1)

No veo un `[blocker]` contra las 32 decisiones. Propongo que el PoC sea pequeño en infraestructura, pero estricto en contratos, trazabilidad pedagógica y medición.

### 1. Arquitectura y punto de extensión para generación futura

**Stack propuesto:** monorepo TypeScript, `apps/web` (React + Vite + SVG + KaTeX), `apps/api` (Fastify), `packages/domain` (máquina de estados y política pedagógica puras), `packages/content` (manifiestos bilingües versionados), `packages/provider` (interfaz LLM y adaptador Claude), `packages/media-contract`, `workers/media` (Python para AudioExplainer/Manim) y `data/tutoria.sqlite`. La API key sólo existe en `apps/api`; el navegador nunca llama directamente al proveedor.

Archivos/contratos que deben existir primero:

- `content/concepts/{budget-line,indifference-curve}/v1/{lesson.yaml,skills.yaml,misconceptions.yaml,questions.yaml}`. `lesson.yaml` tiene texto semántico `es/en`, fórmulas, checkpoints y cues, no HTML cocinado.
- `packages/media-contract/src/index.ts`: `LessonSpec -> MediaBundle`. `MediaBundle` contiene `audio|video`, `syncTrack`, `transcript`, `formulaCues`, `graphicCues`, `locale`, `contentVersion`, `generatorVersion`, `provenance`.
- `packages/domain/src/session-machine.ts`: estados `delivery -> examples -> practice -> judging -> remediation|closure|human_review`; eventos append-only.
- `packages/provider/src/LLMProvider.ts`: `chat()` y `judgeOpenResponse()` separados, con modelos/configuración distintos y salida JSON validada; `ClaudeProvider` es el primer adaptador.
- `packages/domain/src/evaluation.ts`: evaluadores deterministas para numéricas, opción múltiple y manipulación gráfica; el LLM sólo juzga abiertas y sintetiza diagnóstico.
- `packages/domain/src/remediation-policy.ts`: función pura `(skillState, evidence, misconception, history) -> action`.

**Punto exacto de extensión:** `DeliveryAssetProvider.resolve(lessonSpec, learnerContext): Promise<MediaBundle>`. Ahora se inyecta `PreproducedAssetProvider`, que busca por `content_version + locale + media_variant`. Después se añade `PersonalizedGenerationProvider`, que produce el mismo `MediaBundle` desde `LearnerContext` (sub-skills débiles, misconception, idioma, preferencias de accesibilidad) y lo cachea por hash. La UI, transcript, checkpoints y máquina pedagógica no saben si el bundle fue preproducido o generado.

**Flujo:** UI emite `SessionEvent` -> API persiste -> evaluador determinista o juez LLM produce `Evidence[]` -> reducer actualiza `SkillState[]` y `MisconceptionEvidence[]` -> política elige remediation/advance/human -> UI recibe una `TutorTurn` con versión y explicación formativa. Cada decisión guarda `provider/model/prompt_version/content_version` para reproducibilidad.

### 2. Juez, mastery y política de remediación

**Sub-skills estables (IDs, no textos traducidos):**

- Línea presupuestaria: `BL.EQUATION` (`p_x x+p_y y=m`), `BL.FEASIBILITY` (línea vs conjunto), `BL.INTERCEPT_X`, `BL.INTERCEPT_Y`, `BL.SLOPE_OPPORTUNITY_COST`, `BL.INCOME_SHIFT`, `BL.PRICE_X_PIVOT`, `BL.PRICE_Y_PIVOT`, `BL.GRAPH_TO_PARAMETERS`.
- Curva de indiferencia: `IC.EQUAL_UTILITY_LOCUS`, `IC.ORDINAL_RANKING`, `IC.MONOTONICITY_SHAPE`, `IC.NON_CROSSING`, `IC.MRS_SLOPE`, `IC.DIMINISHING_MRS_CONVEXITY`, `IC.FUNCTION_TO_CURVE`, `IC.MAP_COMPARISON`.
- Integración: `OPT.FEASIBLE_CHOICE`, `OPT.TANGENCY_MRS_PRICE_RATIO`, `OPT.CORNER_VS_INTERIOR`. Esto evita declarar dominio de ambos conceptos sin poder combinarlos.

**Salida del juez (JSON Schema):** `overall: correct|partial|incorrect|unjudgeable`; `evidence[{skill_id, delta:-2..2, rubric_dimension, rationale, source_span}]`; `misconceptions[{id, confidence:0..1, signal}]`; `judge_confidence`; `student_feedback{es,en}`; `instructor_diagnostic`; `needs_human_review`; `prompt_version`. El texto al estudiante nunca muestra score ni mastery numérico.

**Rúbrica para abiertas (10 puntos internos, no nota):** exactitud conceptual 0–3; mecanismo/razonamiento 0–3; consistencia entre palabras, ecuación y gráfico 0–2; transferencia/explicación propia 0–2. El juez asigna evidencia sólo a skills realmente observadas. Un set dorado de respuestas del docente, incluidos casos ambiguos y bilingües, prueba acuerdo por dimensión y detección de misconceptions.

**Estado persistido por sub-skill:**

```json
{
  "skill_id":"BL.SLOPE_OPPORTUNITY_COST",
  "mastery":0.74,
  "confidence":0.81,
  "evidence_count":4,
  "modalities":["numeric","open"],
  "consecutive_successes":1,
  "attempts":3,
  "last_evidence_at":"...",
  "active_misconceptions":[{"id":"BL.SLOPE_RATIO_INVERTED","p":0.86}],
  "status":"learning"
}
```

Actualizar `mastery` con un reducer acotado y versionado, dando más peso a evidencia reciente, transferida y determinista; no dejar que una respuesta borre el historial. Dominio: `mastery >= .80`, `confidence >= .70`, al menos dos evidencias en dos modalidades y ninguna misconception activa `p >= .70`. Salida del concepto sólo si todos los skills esenciales cumplen; tope: 5 intentos dirigidos por skill o 12 por concepto. Al tope se cierra el loop automático en `human_review`, nunca se finge dominio.

**Política de las cuatro acciones:**

1. Si una misconception curada tiene `p >= .70` y es su primera aparición: **pregunta socrática dirigida**, de una sola inferencia, sin revelar la respuesta.
2. Si la respuesta es incorrecta/contradictoria pero no hay misconception confiable, o la socrática no corrige: **re-explicar con otra representación** distinta a la que falló (palabras↔ecuación↔gráfico), seguida por un chequeo isomorfo.
3. Si hay dos fallos consecutivos, baja confianza/prerrequisito, o carga matemática excesiva: **bajar dificultad** a un caso numérico de enteros y después hacer un `fade` hacia el caso simbólico original.
4. **Revisión humana** inmediata si `judge_confidence < .60`, respuesta no juzgable, contradicción entre evaluador determinista y LLM, riesgo de accesibilidad/contenido; o obligatoria al tope de intentos / dos ciclos completos sin mejora (`delta mastery < .10`).

No repetir una acción idéntica dos veces seguidas. Tras cada remediación, usar una pregunta nueva que mida el mismo skill; una respuesta a una copia memorizable no cuenta como segunda modalidad.

### 3. Catálogo inicial de misconceptions

Cada fila indica **señal -> remediación -> distractor delator**.

**Línea presupuestaria**

- `BL.LINE_EQUALS_SET`: sólo considera alcanzables los puntos que gastan todo -> sombrear el conjunto y comparar gasto de tres puntos -> “Sólo los bundles sobre la línea son asequibles”.
- `BL.INTERCEPTS_SWAPPED`: usa `m/p_y` en eje x o viceversa -> fijar el otro bien en cero con números/unidades -> “El intercepto x es `m/p_y`”.
- `BL.SLOPE_RATIO_INVERTED`: pendiente `-p_y/p_x` -> recorrer una unidad de x y calcular el y sacrificado -> “La pendiente es `-p_y/p_x`”.
- `BL.SLOPE_POSITIVE`: omite el signo y trata el trade-off como positivo -> flecha rise/run y costo de oportunidad -> “La pendiente es `p_x/p_y` porque ambos precios son positivos”.
- `BL.INCOME_ROTATES`: un aumento de m cambia pendiente/pivota -> superponer dos líneas y mantener precios -> “Más ingreso hace la línea menos inclinada”.
- `BL.PRICE_CHANGE_PARALLEL`: un cambio de un precio desplaza en paralelo -> anclar el intercepto del bien cuyo precio no cambia -> “Si baja `p_x`, ambos interceptos aumentan”.
- `BL.FEASIBLE_MEANS_OPTIMAL`: todo punto asequible es óptimo -> separar restricción de preferencias y marcar varios factibles -> “Cualquier bundle dentro del presupuesto maximiza utilidad”.

**Curva de indiferencia**

- `IC.SAME_CURVE_DIFFERENT_UTILITY`: cree que puntos de una curva tienen utilidad distinta -> intercambio entre dos bundles sobre la misma curva -> “El punto con más x sobre la misma curva da más utilidad”.
- `IC.CARDINAL_SPACING`: interpreta distancia/etiqueta como diferencias cardinales -> transformación monótona y ranking invariante -> “U=20 produce exactamente el doble de bienestar que U=10”.
- `IC.HIGHER_MEANS_VERTICAL`: elige la curva físicamente más alta sin mirar nordeste/preferencias -> comparar bundles dominados/dominantes -> “La curva que corta más alto el eje y siempre es preferida”.
- `IC.CURVES_CAN_CROSS`: acepta cruce -> argumento gráfico de transitividad con tres bundles -> “Dos curvas pueden cruzarse si cambian sus pendientes”.
- `IC.UPWARD_UNDER_MONOTONICITY`: dibuja pendiente positiva -> comparar dos puntos donde uno tiene más de ambos bienes -> “Una IC creciente es compatible con more-is-better”.
- `IC.MRS_RATIO_INVERTED`: usa `-MU_y/MU_x` -> diferencial total `MU_x dx+MU_y dy=0` y unidades -> “MRS/slope = `-MU_y/MU_x`”.
- `IC.CONVEXITY_REVERSED`: confunde convexidad/diminishing MRS o prefiere extremos -> promedio de dos bundles y tres tangentes -> “Una IC convexa implica MRS creciente en magnitud”.

Los distractores guardan el `misconception_id`; no se infiere sólo por “incorrecta”. Una señal aislada aumenta probabilidad, una explicación abierta consistente la confirma o refuta.

### 4. UX de chat

Usar **drawer contextual derecho**, no burbuja flotante como superficie principal ni panel siempre abierto. En desktop aparece como pestaña “Preguntar” colapsada; se abre por clic, botón de intención o checkpoint, ocupa ~360 px y deja visibles media/gráfico/transcript. En pantallas estrechas se convierte en bottom sheet. Abrirlo **no pausa automáticamente**: se preserva la decisión de pausa manual del estudiante; sí muestra el control de pausa al lado del input.

Los botones rápidos dependen del estado: “Explícalo de otra forma”, “Dame un ejemplo”, “¿Por qué cambió el gráfico?”, “Estoy listo/a”. El historial se agrupa por checkpoint y cada turno enlaza al instante/cue del media. Texto es siempre visible; micrófono Web Speech es progresive enhancement, con estado claro, edición antes de enviar y fallback completo a teclado. El drawer se abre automáticamente sólo en los 2–3 checkpoints guionados o cuando hay una remediación, nunca por iniciativa arbitraria del modelo. Instructor recibe otra vista: timeline de skills/evidencia/modelo, no el chat crudo como único diagnóstico.

### 5. Bake-off controlado A/B/C/D

**Unidad experimental:** una lección maestra de 150 s sobre línea presupuestaria, producida en es y en desde un único `lesson.yaml`. Caso común: `m=60, p_x=6, p_y=3`; secuencia gráfica idéntica: ejes -> interceptos -> línea y conjunto sombreado -> aumento de m (shift paralelo) -> baja de `p_x` (pivot) -> recap. Mismas palabras, voz por idioma, fórmulas, colores, resolución 1280×720, dos checkpoints y timeline de cues. Cada opción entrega media, transcript y alternativa textual; la interactividad posterior no cuenta como ventaja visual del clip.

**Timebox:** 8 horas-persona por opción en entorno limpio, excluyendo una preparación común de 4 h para congelar script/assets/rúbrica. Mismo autor recibe README y assets; registrar cronómetro por tarea. Al minuto 480 se captura lo producido; no hay “horas de rescate”. Para reducir efecto de aprendizaje, rotar orden entre implementadores o hacer una segunda reproducción pequeña por otro agente con 2 h.

**Rúbrica ponderada:** claridad/calidad 25%; personalización 30% (crítica); producción marginal 15%; accesibilidad/mantenibilidad 15%; versatilidad 15%. Además de puntuación 1–5, conservar datos brutos y fallos; Kristian desempata.

1. **Calidad/claridad:** revisión ciega del principal + tres agentes con anclas de rúbrica; 6–10 aprendices hacen pretest, postest inmediato de 6 ítems y carga percibida. Medir ganancia normalizada, errores por escena y comprensión del shift/pivot. No atribuir causalidad fuerte con N pequeño.
2. **Personalización:** tres cambios estandarizados: (a) valores/labels, (b) es↔en, (c) insertar una remediación para `SLOPE_RATIO_INVERTED`. Medir minutos humanos, archivos tocados, líneas específicas vs plantilla, tiempo de render p50/p95 y si conserva sync/accesibilidad. Un cambio imposible en el timebox puntúa 0 en esa prueba.
3. **Tiempo/costo al concepto 20:** desde checkout limpio, medir setup, edición, render, QA, rerender incremental, CPU-min, costo externo, tamaño de artefacto y defectos. Estimar concepto 20 con repetición cronometrada de una variante nueva, no sólo extrapolación optimista del primero.
4. **Accesibilidad/mantenibilidad:** axe/Lighthouse + recorrido sólo teclado + VoiceOver/NVDA de transcript, controles, captions y alternativa del gráfico; medir drift audio-texto. Un docente no programador cambia una frase, fórmula y número siguiendo docs: éxito, minutos y errores. Registrar dependencia de toolchain y complejidad ciclomática sólo como apoyo, no sustituto del test humano.
5. **Versatilidad:** matriz reproducible de tres tiers: (L) Windows 10, 2 cores/4 GB/integrada y Chrome 109 + Firefox ESR; (M) laptop actual en Chrome/Edge/Firefox/Safari; (mobile) Android 9/2 GB y iPadOS 15/Safari. Probar viewport 1366×768/1024×768/390×844, red Fast 3G y broadband, CPU throttle 4× cuando no haya hardware real. Para cada celda: carga exitosa, bytes transferidos, time-to-first-frame/audio, stalls >250 ms, dropped frames, peak memory, play/pause/seek, sync p95, transcript/teclado y finalización de la escena. Gate mínimo: 95% de celdas completan; cero celda sin transcript; sync p95 <=250 ms; inicio <=5 s broadband y <=12 s Fast 3G; cero crash; video >=24 fps o audio/SVG sin stalls. Reportar aparte real hardware vs emulación y versión exacta.

Antes de puntuar, validar que las cuatro implementaciones respetan el control experimental. Si una viola guion/gráfico, queda “no comparable”, pero su costo/timebox sigue registrado.

### 6. SQLite y camino a login/multi-estudiante

Tablas con IDs UUID/ULID de texto, FK reales, UTC y migraciones desde día uno:

- `users(id, external_subject NULL UNIQUE, role, locale, created_at)`; el PoC crea `local-demo-user`, no usa username como FK.
- `courses`, `enrollments(user_id, course_id, role)` y `concepts`; pueden tener una sola fila ahora.
- `content_versions(id, concept_id, semantic_version, source_hash, status)`; `media_assets(content_version_id, locale, variant, uri, manifest_json, provenance_json)`.
- `skill_definitions(id, concept_id, version, essential)` y `misconception_definitions(id, concept_id, version)`.
- `learning_sessions(id, user_id, content_version_id, state, started_at, closed_at)`.
- `session_events(id, session_id, seq UNIQUE, type, payload_json, created_at)` como log auditable.
- `question_versions(id, content_version_id, type, locale, body_json, answer_spec_json)`.
- `attempts(id, session_id, question_version_id, modality, response_json, deterministic_result_json, created_at)`.
- `judge_runs(id, attempt_id, provider, model, prompt_version, output_json, confidence, latency_ms, token_usage_json)`.
- `skill_states(session_id, skill_id, mastery, confidence, evidence_count, modalities_json, attempts, status, updated_at)` y `misconception_evidence(session_id, misconception_id, probability, evidence_json)`.
- `remediation_actions(id, session_id, attempt_id, action_type, target_skill_id, rationale_json, outcome_event_id)`; `chat_messages` referencia session/checkpoint/cue.

`Repository`/`UnitOfWork` ocultan SQLite. Para plataforma: Auth middleware resuelve `external_subject` del IdP, crea/vincula user, autorización se hace por enrollment; no cambia ninguna FK pedagógica. ORM y tipos evitan SQL específico; prueba de migración a Postgres se hace antes de integración con InteractiveEduHub. Cifrar secretos fuera de DB, minimizar respuesta cruda y definir retención/exportación.

### 7. Secuencia y definición objetiva de éxito

1. Congelar contratos, skill graph, catálogo, guion bilingüe y set dorado; montar CI, migraciones y harness de eventos.
2. Construir los cuatro media spikes aislados y ejecutar bake-off; decisión registrada, sin bloquear el resto del dominio.
3. Vertical slice de línea presupuestaria con `PreproducedAssetProvider`, SVG accesible, transcript/KaTeX/cues y preguntas deterministas.
4. Integrar proveedor intercambiable, juez en modo sombra contra set dorado; calibrar antes de dejarlo cambiar el flujo.
5. Activar política de remediación, instructor diagnostics y persistencia/resume; pruebas de trazas simuladas por misconception.
6. Añadir curva de indiferencia y óptimo, paridad es/en y las cuatro modalidades.
7. Ejecutar auditoría accesible, matriz de dispositivos, pruebas con aprendices/docente y ensayo de export/migración.

**“El PoC funciona”** si, en ambos idiomas, un estudiante completa dos deliveries de 2–3 min, pregunta en cualquier checkpoint, recibe ejemplos hasta confirmar, contesta los cuatro tipos, y una traza con éxito llega a cierre formativo mientras otra con fallo repetido recorre acciones distintas y termina en revisión humana al tope. Además: 100% de respuestas deterministas correctas en tests; >=90% acuerdo del juez con docente por etiqueta correcta/parcial/incorrecta y >=85% F1 macro en misconceptions sobre el set dorado; cero violación de JSON schema; resume exacto tras reinicio; API key ausente del bundle/browser; todos los skills esenciales exigen evidencia multimodal; auditoría teclado/transcript/alternativa gráfica pasa; y la opción de media elegida cumple gates del criterio 5. Guardar video y event log de ambas trazas como evidencia.

### 8. Riesgos, mitigaciones y supuestos que cambiarían el rumbo

- **Juez persuasivo pero inconsistente.** Mitigar con deterministic-first, JSON schema, set dorado, prompt/model versionado, confidence gate y revisión humana. Si no alcanza 90% acuerdo tras dos calibraciones, el LLM deja de decidir mastery: sólo propone feedback y un rubric engine/humano decide.
- **Mastery sobreajusta a preguntas repetidas.** Exigir dos modalidades, transferencia y banco versionado. Si rendimiento en ítems nuevos cae >15 pp respecto a práctica, aumentar variedad y no cerrar por promedio interno.
- **Media rica falla en equipos reales.** Fallback obligatorio audio+transcript+SVG estático. Si ninguna opción pasa 95% de la matriz, separar delivery base universal de una mejora visual opcional; no bajar el gate silenciosamente.
- **Personalización al vuelo resulta lenta/cara.** LessonSpec paramétrico, cache y generación asíncrona. Si p95 supera 30 s o el costo marginal acordado, personalizar ejemplos/SVG/texto y mantener delivery base preproducido.
- **Web Speech varía por navegador/idioma.** Texto es camino canónico; voz se etiqueta experimental. Si éxito de captura/transcripción <80% en matriz, desactivar voz en esos clientes y evaluar ASR server-side posterior.
- **Bilingüismo deriva semánticamente.** IDs canónicos, parity tests y revisión docente por versión. Si no se puede mantener paridad, lanzar un idioma por vez, pero conservar contratos bilingües.
- **Contenido generado pierde la voz docente.** Extraer patrones y ejemplos desde los repos existentes, guardar provenance y exigir aprobación de content version. Si Kristian rechaza >20% de outputs editados, cambiar de generación libre a plantillas curadas con slots.
- **Estado local no migra limpiamente.** Repositorios/IDs externos desde el inicio y prueba temprana SQLite→Postgres. Si la semántica de auth de destino exige tenancy/course ownership distinto, cambiar sólo capa de identidad/enrollment, no session events.
- **Privacidad/diagnóstico crudo.** Minimización, retención configurable y vistas por rol. Si se despliega con estudiantes reales, consentimiento, política de datos y threat model pasan a gate previo, no deuda posterior.

- Codex
