# Barrido provisional — antes de construir ningún brazo

**2026-08-11, de madrugada.** Con los pesos pre-registrados en `docs/M4-PREREGISTRO.md`
y la matriz provisional de `results.yaml`, que sale del reconocimiento y no de medir el
producto terminado.

El pre-registro está en git con su fecha, en un commit anterior a este. Eso se puede
comprobar; es el único motivo por el que estos números significan algo.

## Lo que dice

A —lo que ya existe, audio más DOM/SVG— gana en el **91,7%** de las ponderaciones
plausibles. El único criterio que podría dar la vuelta al resultado es c5, versatilidad
entre equipos.

Y hay una segunda pregunta, más afilada, porque c1 —calidad visual y pedagógica— es la
única celda que el reconocimiento no puede responder y por tanto la única esperanza de
las opciones renderizadas:

| nota de c1 para el vídeo | puntuación A | puntuación B | gana | % del símplex para B |
|---:|---:|---:|---|---:|
| 1/5 | 0.850 | 0.208 | A | 1,1% |
| 3/5 | 0.850 | 0.408 | A | 8,5% |
| **5/5** | 0.650 | 0.408 | **A** | 32,5% |

**Ni con una nota perfecta.** Con c1 al 20% y B perdiendo por construcción en c2 (35%) y
c4 (25%), la rúbrica a ciegas no puede cambiar la decisión. Como mucho puede decirnos
cuánta calidad se cede al elegir A, que es una pregunta distinta y que sigue valiendo la
pena responder — pero no vale seis horas de timebox.

## Por qué esto no es "ya sabíamos la respuesta"

Sí lo era, en parte, y el plan lo dijo antes de que yo corriera nada: bajo estos pesos la
aritmética ya tenía ganador. Lo que el barrido añade es **cuánto** margen hay, y ese
número no se podía adivinar. Un 92% se lee muy distinto de un 55%.

Y hay una falsación real ya medio disparada, que va en contra de lo que el plan predijo.
La hipótesis pre-registrada decía que el vídeo gana en equipos viejos **y pesa mucho**. El
reconocimiento midió el MP4 en 2,5 MB contra los 1,69 MB del MP3 que A ya envía: **+0,85
MB por toda la imagen en movimiento**, y con *menos* trabajo en el hilo principal que A,
que muta SVG en cada cue. Si eso aguanta en la máquina vieja de Kristian, media hipótesis
queda confirmada y la otra media refutada.

## Qué construyo entonces, y qué no

Cambio el alcance sobre evidencia, y lo digo para que Kristian pueda revocarlo:

**Sí construyo B (Remotion), completo.** No por la decisión —que ya está tomada— sino por
tres cosas que solo se consiguen construyéndolo: confirmar o refutar la mitad de la
hipótesis sobre equipos modestos, que es el único sitio donde el plan puede equivocarse;
demostrar que un segundo adaptador entra de verdad por la costura de `MediaAdapter`, que
nunca se ha ejercitado; y darle a c1 una respuesta real en vez de un hueco.

**No construyo C (Manim) como brazo.** Su explorador lo dejó dicho: no puede personalizar
al vuelo *en absoluto*, y ese es ahora el criterio que decide. El artefacto que un modelo
tendría que emitir es Python arbitrario, donde una llamada mal escrita es un no-op
silencioso y un signo cambiado renderiza precioso. Gastar seis horas en confirmar una
predicción es exactamente lo que la regla del timebox existe para evitar.

**No construyo D (híbrido) como brazo.** Su explorador concluyó que nada lo mata
técnicamente y que eso mismo lo descalifica: es una técnica de composición, no una
tecnología contra la que competir. Se puede aplicar sobre el ganador, después.

**KGJS queda fuera de M4 (D-2 resuelta: no).** No tiene reloj, así que su adaptador sería
el de A palabra por palabra y el brazo compararía A contra A. Y falla justo en lo que D-3
promovió: su issue de esquema lleva abierto desde 2023 con el mantenedor diciendo que
generarlo está "muy lejos de su área". Se reprograma como candidato de capa de escenario
para M5, contra `budget_graph.ts` y no contra Remotion, con dos condiciones concretas
anotadas en `docs/M4-PLAN.md`.

## Lo que ya se llevó por delante, y que hacía falta pasara lo que pasara

La compuerta de cues, `pipeline/check_cues.py`. Sin ella el criterio 2 no se puede medir:
una configuración equivocada era **invisible**. `aplicarCue` y `paintLedger` son dos
`switch` sin rama por defecto, así que un cue llamado `budgetLine` en vez de
`budget_line` disparaba, registraba un desfase sano, y no pintaba nada. Ninguna
excepción, ningún aviso. Comprobado renombrando un cue: ahora falla con el id y el
timestamp.
