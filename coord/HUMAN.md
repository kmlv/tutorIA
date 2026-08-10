# Open Items For Kristian

Use this file only for decisions or information that agents cannot resolve
without the principal.

## Open

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

