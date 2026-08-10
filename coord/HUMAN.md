# Open Items For Kristian

Use this file only for decisions or information that agents cannot resolve
without the principal.

## Open

### H-003 — Tres decisiones que salen de la investigacion de prior art (T-002)

**Estado:** abierto desde 2026-08-10T18:52Z. NO bloquea nada; T-002 entrego completa.
**Fuente:** `docs/RESEARCH-PRIOR-ART.md` §4. Los tres carriles estan en
`coord/work/{codex,agy,claude}/T-002-*.md`.

**D-1. El chequeo de transferencia — roza tu decision 10.**
Al cerrar un concepto: uno o dos items nuevos, sin asistencia, **sin nota y sin
presentarse al alumno como evaluacion**, cuyo resultado alimente solo el diagnostico
del instructor que tu decision 6 ya promete.
Lo sostienen dos literaturas independientes que convergen: los logs de los ITS
clasicos (la evidencia obtenida con ayuda no cuenta como dominio; los dos intentos
serios de castigar el gaming cambiaron la conducta y NO el aprendizaje) y un RCT
sobre LLMs (Bastani et al., PNAS 2025: +48% con la IA delante y -17% en el examen
sin ella; con guardarrailes, +127% en practica y plano en el examen).
El problema concreto: **el PoC hoy no tiene ninguna senal capaz de detectar que el
tutor este resolviendo en vez de ensenar.**
Si lo rechazas, conviene registrar que se pierde: el PoC no podra afirmar que ensena,
solo que gusta.

**D-2. ¿Entra KGJS como quinta opcion del bake-off?**
EconGraphs (Christopher Makler, lecturer de Stanford, material de Econ 50) cubre
literalmente tus dos conceptos con ~350 graficos interactivos, embebibles por iframe
sin login. Su motor **KGJS es MIT** (github.com/cmakler/kgjs) y "renderiza diagramas
interactivos definidos como JSON" con D3 y **KaTeX**.
Eso cumple a la vez cuatro cosas que pediste por separado: DOM para accesibilidad y
equipos modestos, KaTeX (decision 21), abstraccion declarativa, y un formato JSON que
es justo lo que un LLM puede generar al vuelo (criterio 2). Ninguna de las opciones
A/B/C/D tiene esa combinacion.
Contra: tu decision 24 exige mismo guion y mismo grafico para todas, asi que anadir
una quinta tiene costo real de protocolo.
Ojo con la frontera legal: **motor MIT si; contenido de Makler con copyright, no.**

**D-3. ¿Quien escribe la capa de configuracion de los graficos: tu o el LLM?**
Es la pregunta que fija de verdad el costo del concepto numero 20, y el PLAN hoy no
la responde.

**D-4. ¿Pedimos IESA-Micro hoy? Es lo unico de todo T-002 que tiene prisa.**
La verificacion adversarial del carril C encontro **IESA-Micro** (Cornell Suite), el
analogo del Force Concept Inventory para micro intermedia. Su seccion III, "The
Consumer's Problem", cubre **literalmente tu alcance** con 22 learning goals, y sus
distractores salieron de **entrevistas think-aloud con estudiantes que ya habian
cursado la materia** — justo la evidencia que nuestro catalogo, escrito por cuatro
modelos de lenguaje, no tiene.
Se pide gratis por formulario en https://www.econ-assessments.org/pages/IESA-Micro.html
con **lead time desconocido**, asi que la prisa es real: si llega, sus items sirven de
set dorado externo pre-etiquetado y reducen mucho lo que tendrias que etiquetar a mano.

**CORRECCION a lo que te dije antes en este mismo item.** La primera version de H-003
decia que el catalogo de misconceptions "no existe publicado" y que lo escribirias tu
desde cero. **Es falso** y lo cazo la verificacion adversarial del carril C. Lo cierto
y mas preciso: existe IESA-Micro del que partir, pero **ningun instrumento de economia
asigna un identificador estable a la misconception** — lo incrustan en el texto del
distractor sin nombrarlo. Ese contrato de `id`, que si necesitamos, no tiene precedente
publico en economia: es la oportunidad y el riesgo a la vez, porque nadie ha validado
que esa taxonomia sea estable.

**Contexto que puede cambiar como lees el bake-off:** el criterio 3 compara
tecnologias de render y **no mira en absoluto** el costo de escribir el modelo
pedagogico — pack de sub-skills, reglas de parada y catalogo de misconceptions. Ese
catalogo **no existe publicado** para linea presupuestaria y curva de indiferencia, y
Eedi, con 20M de respuestas, tampoco pudo derivarlo automaticamente: lo etiquetaron a
mano. Lo escribiras tu, y el PLAN no lo presupuesta.

Lo que NO se puede afirmar, y lo aclaro porque mi primera version de la sintesis si lo
afirmaba: nadie midio ese costo en horas, asi que no se sabe si es mayor o menor que
producir la superficie. codex levanto un [blocker] contra mi conclusion de que "el
bake-off mide la mitad barata" y lo acepte: era una ordenacion comparativa sin
medicion detras, y encima el propio documento cita a PhET consumiendo equipos
profesionales durante meses. La conclusion corregida es mas modesta y mas util:
**el costo de autoria pedagogica es material, esta sin presupuestar, podria dominar, y
medirlo deberia formar parte del bake-off en vez de darse por supuesto.**

### H-002 — Autorizar (o no) el paso de `proposal-only` a `implementation` en T-001

**Estado:** abierto desde 2026-08-10T18:23Z. Bloquea toda escritura de codigo.

`docs/PLAN.md` y `coord/decisions/D-001-sintesis-super-plan.md` estan firmados por
los tres revisores (fable rev 17, agy rev 23, codex rev 26), verificado contra el
thread. El edit budget sigue en `proposal-only`, asi que ningun agente escribe
codigo del PoC hasta que tu lo cambies.

Esto ya se declaraba en el thread (rev 28) pero no estaba anotado aqui, que es el
unico sitio donde coord lo hace visible como item tuyo. Corregido.

**Decision que solo tu puedes tomar:**

1. `implementation` — se empieza a construir segun docs/PLAN.md.
2. Seguir en `proposal-only` — el plan espera.
3. Volver al plan con los hallazgos de T-002 antes de construir.

T-002 (prior art) corre en paralelo bajo `proposal-only` y no depende de esta
decision.

**Estado real 2026-08-10 (claude):** Kristian eligio la opcion 2 por ahora —
**quiere leer `docs/PLAN.md` completo antes de autorizar**. No es indecision: es
la opcion correcta dado que el plan lo escribieron cuatro modelos y el redactor
(claude) ya introdujo cuatro errores de registro que tuvo que cazar codex.

**Roster de implementacion, ya decidido por Kristian aunque la autorizacion siga
pendiente:**

| Agente | Modelo | Configuracion pendiente |
|---|---|---|
| `claude` | Opus 5 | — |
| `codex` | Sol Ultra / GPT-5.6 | **esfuerzo medio**: anadir `-c model_reasoning_effort=medium` al wake target |
| `agy` | Gemini | — |

`fable` **no** aparece en ese roster. Participo como autor y firmo el plan, y varias
de las ideas mas adoptadas de la sintesis son suyas: `MediaAdapter`, mismo MP3 y
mismo `timeline.json` para las cuatro opciones, catalogo de misconceptions fuera de
la generacion, dock de 3 estados, y el metodo del flash para medir desfase A/V.
Si la exclusion fue deliberada no hay nada que hacer; si fue un olvido al dictar,
decirselo a claude. Se registra aqui para que la decision sea visible, no inferida.

**Al autorizar hacen falta tres pasos, no uno:**
1. Cambiar `Edit budget` a `implementation` en `OPERATING_MODE.md`.
2. ~~Anadir `-c model_reasoning_effort=medium` al wake target de `codex`.~~
   **HECHO 2026-08-10T18:25Z (claude).** Tu decision sobre el esfuerzo de codex no
   dependia de la autorizacion, y T-002 ya despierta a codex, asi que se aplico
   ahora. Flag verificado contra `codex exec --help` (codex-cli 0.144.1) antes de
   escribirlo, no de memoria.
3. Decidir el reparto por hitos. M0 es andamiaje y lo hace un solo agente; el
   bake-off de M4 es donde el paralelismo si paga (una opcion de media por agente).

## Resolved

### H-001 — Wake de `fable` fallaba: wake target mal construido (NO era sandbox)

**Síntoma:** `coord-pulse.sh --agent fable` moría con exit 124 y el diagnóstico
ISSUE-004 "sandbox/auth blocked: no stdout/stderr byte within 300s".

**Causa raíz:** el wake target lo escribió Opus 5 de memoria en vez de copiar el
patrón que Kristian ya usa en otros proyectos. Faltaba `--output-format stream-json
--verbose`. Sin esos flags `claude -p` no emite un solo byte hasta terminar, así que
el guard de no-output de coord-pulse lo mata a los 300s aunque el proceso esté sano.
El sondeo de sandbox que hizo Opus 5 (red, HOME, CLI) daba verde y aun así concluyó
"sandbox no es problema" — conclusión correcta que luego contradijo al ver el
ISSUE-004, en vez de sospechar de su propia configuración.

**Corregido** copiando el patrón de `~/GithubRepos/AIstigmergy/coord/OPERATING_MODE.md`
(el repo del propio kit):

    fable: claude -p --output-format stream-json --verbose --model claude-fable-5
           --max-budget-usd 25.00 --permission-mode acceptEdits
           --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*)
           --no-session-persistence {prompt}

Precedente adicional en `~/GithubRepos/Feriados-Vacaciones` (roster
`codex,claude,agy,opus5,fable5`), que confirma el patrón de separar Opus y Fable
como agentes distintos del roster.

**Lección para el kit:** el mensaje de ISSUE-004 atribuye a sandbox/auth lo que
también puede ser simplemente un wake target sin streaming. Vale la pena que
`coord-doctor` valide que los targets `claude -p` lleven `--output-format stream-json`.

**Consecuencia sobre la ronda 1:** el wake ya funciona, pero coord embebe el thread
en el prompt, así que un `fable` despertado ahora vería las tres propuestas y
rompería la ceguera. Por eso:

- **Ronda 1**: la propuesta de `fable` viene del subagente Fable-5 que Opus 5 lanzó
  con instrucción explícita de no abrir `coord/threads/`. Ceguera preservada, pero
  su voz pasa filtrada por Opus 5. Asimetría a registrar en la decisión final.
- **Rondas 2 y 3**: `fable` participa como agente CLI independiente vía coord-pulse.
  Ahí ver las otras propuestas no es un defecto, es el requisito.

