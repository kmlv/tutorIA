# Open Items For Kristian

Use this file only for decisions or information that agents cannot resolve
without the principal.

## Open

### H-006 — 2026-08-11: tres cosas del bake-off que solo puedes decidir tu

**1. Los pesos de los criterios.** Los mios estan pre-registrados en
`docs/M4-PREREGISTRO.md`, en un commit ANTERIOR a cualquier medicion — eso se puede
comprobar en git y es el unico motivo por el que los numeros significan algo. Son una
propuesta sustituible: cambia los cinco numeros y `bakeoff/score.py` recalcula. El
barrido ya dice cuanto importan, y hoy importan poco: A gana el 91,7% de las
ponderaciones plausibles.

**2. Si aceptas que estreche M4 sobre evidencia.** Construi B (Remotion) completo y NO
construi C (Manim) ni D (hibrido) como brazos. El razonamiento esta en
`bakeoff/00-barrido-provisional.md` y se puede revocar: si quieres los tres timeboxes,
se hacen.

**3. Las dos pistas de D-1.** `BL-M1` y `BL-M3` en `misconceptions.yaml` llevan un campo
`nudge` marcado **BORRADOR PARA KRISTIAN**. Las escribio el panel de diseno y las revise
yo; las lee un alumno tuyo antes de contestar. Faltan cinco, y con dos el experimento solo
alcanza 2 pares por sesion — medido, no estimado.

### H-007 — 2026-08-11: D-3 medido, y una pregunta que sale de la medicion

El guion del grafico ya es datos (`content/packs/budget-line/graph.yaml`) y un modelo lo
escribe contra el esquema. Tres modelos, seis corridas, cero documentos invalidos: el
formato aguanta. El acuerdo con el guion que escribi a mano es 8/10 con los modelos
fuertes.

**Lo que necesita tu ojo:** dos de las diferencias que quedan apuntan a que el modelo lo
hizo mejor que yo, y son decisiones pedagogicas tuyas, no mias:

1. En `budget_set` la narracion pregunta *"¿que puntos de ese mapa puedes pagar?"*. Los
   modelos muestran la region y NO la recta. Mi guion enciende la recta ahi. ¿Cual es la
   correcta?
2. En `income_shift` la narracion dice *"se desplaza, pero no gira"*. Los modelos dejan la
   pendiente destacada; mi guion la apaga. La regla que yo mismo escribi dice que hay que
   destacar lo que NO se mueve, asi que los modelos siguen mi regla y yo no.

Detalle completo en `docs/D3-GUION-GRAFICO.md`.

### H-005 — 2026-08-11: el gold set NO se etiqueta a mano en el PoC

**Decision de Kristian, textual:** *"no voy a etiquetar. porque este contenido es para
PoC. asume que esta etiquetado por ahora. en el futuro lo haremos con cuidado."*

**Lo que se hizo con esa instruccion.** El campo `human` del gold set **sigue vacio**. No
se rellena con nada, porque escribir ahi una etiqueta que Kristian no miro haria que el
reporte imprimiera "acuerdo con Kristian" sobre una verdad inventada, y ese numero se
citaria despues como si fuera real. En su lugar la compuerta corre en modo
`--vs-intent`: la referencia es la INTENCION con que se escribio cada respuesta, que es
la opinion de otro modelo.

**CONSECUENCIA QUE NO SE PUEDE OLVIDAR.** El numero de M3 obtenido asi **no dice que el
juez concuerde con Kristian**. Dice que concuerda con otro modelo sobre respuestas que
tambien escribio un modelo. Es una prueba de que la maquinaria funciona y de que el juez
no esta groseramente roto; no es evidencia pedagogica. El reporte lo imprime en mayusculas
cada vez que corre en ese modo, y `evals/goldset.py` lo documenta en la cabecera.

**Consecuencia operativa:** el juez se queda en **sombra**. `JUDGE_GATE_PASSED=1` no se
pone: la compuerta no se aprobo, se simulo. Pasar a vivo es una variable de entorno el dia
que haya etiquetado real o una cohorte.

**Cuando se retome:** el etiquetado son ~35 min con `evals/label.py`, el gold set ya esta
construido y barajado, y nada de lo hecho se pierde — `build_goldset.py` conserva las
etiquetas humanas por id y por texto al regenerar.

### H-003 — D-1 y D-3 RESUELTAS 2026-08-11; D-2 sigue abierta

**D-1 (chequeo de transferencia): IMPLEMENTAR.** Kristian lo aprobo. Al cerrar un
concepto, uno o dos items nuevos sin asistencia, sin nota y sin presentarse al alumno como
evaluacion, cuyo resultado alimente solo el diagnostico del instructor. Motivo: hoy el PoC
no tiene ninguna senal capaz de detectar que el tutor este resolviendo en vez de ensenar,
y sin eso no puede afirmar que ensena, solo que gusta. Diseno en `docs/TRANSFER-CHECK.md`.

**D-3 (quien escribe la capa de configuracion de los graficos): EL LLM, CONTRA UN
ESQUEMA.** Kristian define el esquema una vez; el modelo genera el JSON de cada concepto.
Es lo que hace barato el concepto numero 20 — y es exactamente lo que hay que probar,
porque nadie ha medido si sale bien. Implicacion para el bake-off: el criterio 2
(personalizacion barata) pasa a ser el criterio que decide, no un empate.

**D-2 (KGJS como quinta opcion del bake-off): SIGUE ABIERTA.** No bloquea nada hasta que
empiece M4. Se decide al abrir el bake-off, no antes.

### H-004 — RESUELTO 2026-08-10: revision de M1 por Kristian

1. **Guion: APROBADO.** "me parece bien". Queda congelado como fuente del pack
   budget-line, en los dos idiomas, con el ejemplo almuerzo/cafe (p1=3, p2=1, m=100).
2. **Catalogo de misconceptions: SE QUEDA COMO ESTA.** "luego ajustamos cuando estemos
   revisando, ahora estamos en PoC". No se valida contra los examenes de Econ 100A
   todavia; las 7 entradas siguen siendo hipotesis y asi estan marcadas. Por extension,
   BL.EQ conserva su marca `revisar_en_validacion` y los distractores quedan sin
   recalibrar. NO bloquea nada.
3. **IESA-Micro: YA PEDIDO por Kristian.** "no esperemos": el proyecto NO se detiene a
   esperar el cuestionario. Cuando llegue, se usa para el mapeo y como set dorado
   externo; hasta entonces se sigue sin el.

Consecuencia: **M1 cerrado**. Nada del contenido bloquea la construccion.

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

### H-002 — RESUELTO 2026-08-10: Kristian AUTORIZA `implementation`

Kristian autorizo el cambio de `proposal-only` a `implementation` y eligio empezar por
**M1 (guion + catalogo)** en vez de M0, siguiendo la recomendacion de claude: escribir el
guion desde sus notas de S2 y validar el catalogo contra sus examenes es lo unico que solo
puede hacer el, y lo que mas puede invalidar el resto del plan. Mejor saberlo antes de
construir el esqueleto.

Roster de implementacion: claude (Opus 5), codex (GPT-5.6, esfuerzo medio, ya configurado),
agy (Gemini). `fable` no participa en implementacion; firmo el plan y varias de las ideas
mas adoptadas son suyas.

