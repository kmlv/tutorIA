# Criterio 1 — calidad visual y pedagógica, puntuado

Rúbrica: `bakeoff/RUBRICA-C1.md`, escrita antes de mirar ninguna captura. Capturas en
`bakeoff/medir/c1/`.

## Advertencia sobre el "a ciegas"

**No fue a ciegas.** El sorteo x/y del guion de captura dependía de `t % 2`, y los cinco
instantes que la rúbrica eligió resultaron ser todos pares: `x` salió siendo la opción A
las diez veces. Descubierto al abrir `clave.json`. Ya está arreglado —ahora alterna por
posición en la lista— pero esta ronda se puntuó sabiendo cuál era cuál.

Y aunque hubiera sorteado bien, tampoco habría sido ciego: un vídeo dentro de un recuadro
y un SVG en la página se distinguen a simple vista. Lo único que protege de verdad es que
las capturas y la clave están guardadas y **Kristian puede repuntuar**. La nota de abajo
entra en `results.yaml` marcada como mía.

## Tres correcciones aplicadas ANTES de puntuar

La rúbrica dice que un defecto del andamiaje y no de la tecnología se anota y no se
puntúa. Tres aparecieron en la primera tanda de capturas, y en vez de anotarlos los
arreglé y volví a renderizar, porque los tres hacían perder a B por decisiones mías:

1. **El vídeo era oscuro sobre una app clara.** El reconocimiento lo había autorado en
   oscuro. Un recuadro negro flotando en una página clara habría puntuado mi paleta.
2. **Título y subtítulo duplicados.** El vídeo quemaba su propio título y su propio
   subtítulo, y la app ya pinta los dos. Peor: el subtítulo quemado dura todo el beat
   mientras la banda de la app avanza frase a frase, así que en la captura de t=110 había
   dos textos distintos contradiciéndose. También llevaba el id del cue impreso, que era
   depuración del reconocimiento.
3. **El ledger desaparecía bajo B.** Yo había ocultado la banda de la ecuación y las
   fichas de precios cuando el vídeo era dueño del escenario. Pero el vídeo no dibuja el
   ledger: ocultarlo le quitaba a B la mitad del contenido de cada instante. `ownsStage`
   significa dueño del ESCENARIO, no de la pantalla.

Una cuarta corrección es más discutible y la dejo dicha: con el ingreso a 150 el
intercepto se va a 50 y su etiqueta se montaba sobre el nombre del eje, las dos
ilegibles. Lo arreglé porque el escenario de A ya había pasado revisiones de diseño y el
de B no, así que puntuarlo habría medido cuál de los dos pulí más. Pero el hallazgo de
fondo se queda: **una colisión de etiquetas que solo aparece al cambiar los parámetros es
inmediata de ver y de arreglar en DOM, y en vídeo exige volver a renderizar para
descubrirla.**

## La nota

| dimensión | A (DOM/SVG) | B (vídeo) | por qué |
|---|---:|---:|---|
| Legibilidad del hecho central | 5 | 4 | A codifica cada intercepto con el color de su bien, atado a las fichas de arriba; B los pinta los dos del mismo naranja y se pierde el vínculo. A muestra la pendiente con el triángulo rectángulo —la razón, geométrica—; B la deletrea como fórmula, más explícito y menos visual. |
| Contraste antes/después | 5 | 4 | Los dos dibujan el fantasma punteado bajo la recta viva. El de B queda más pálido. |
| Ausencia de ruido | 5 | 4 | Tras las correcciones, ninguno sobra nada. A B se le ve el borde de su recuadro contra la página. |
| Jerarquía visual | 4 | 3 | A cambia el color del elemento destacado; B solo lo agranda, y un círculo un poco mayor del mismo color no se lee como énfasis. |
| Acabado | 5 | 3 | A es vector a cualquier zoom, con KaTeX en la ecuación. B es un ráster de 1120×920 escalado a ~575 px: el texto queda blando y los subíndices se sientan raro. |
| **media** | **4,8** | **3,6** | |

## Añadido tras verlo en vivo (Kristian, 2026-08-11)

Los cinco instantes de la rúbrica caen todos después del segundo 44, que es cuando la
lección empieza a dibujar. **Ninguno captura los primeros cuarenta y cuatro segundos**, y
ahí la opción B tiene su peor momento:

La lección no dibuja nada hasta `espacio` (t=44,3), a propósito — la narración está
introduciendo la idea antes de que el plano exista. En la opción A eso es fondo de página:
no se ve, no molesta. En B es **un rectángulo blanco opaco** en mitad de la pantalla
durante casi un minuto. El mismo vacío pedagógico se lee como pantalla rota, y le toca al
minuto uno.

Es la misma limitación estructural que ya está anotada abajo —un MP4 no puede ser
transparente ni seguir el tema de la página— pero es su cara más dañina, y la rúbrica no
la habría encontrado porque eligió sus instantes por lo que el guion HACE en ellos. Un
instante donde el guion no hace nada no estaba en la lista.

**No cambio la nota de c1 por esto**, y lo digo para que se pueda revisar: la rúbrica se
pre-registró y modificarla después de ver un resultado es exactamente lo que el
pre-registro existe para impedir. Queda como evidencia adicional, en el mismo sentido que
la nota que ya había.

## Lo que esta nota no dice

No mide aprendizaje. Cinco cuadros fijos no dicen si un alumno entiende mejor el pivote en
vídeo o en SVG. Mide si la superficie **presenta** el hecho con claridad, que es necesario
y no suficiente.

Y hay una limitación de B que las capturas no pueden mostrar porque el sistema estaba en
claro: **el MP4 no puede seguir el tema de la página.** La opción A tiene su bloque
`prefers-color-scheme` y cambia con el sistema. Un alumno en modo oscuro vería exactamente
el problema que la corrección 1 acaba de quitarle a un alumno en modo claro — y para
arreglarlo habría que renderizar y servir dos vídeos.
