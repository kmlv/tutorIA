# M4 — informe del bake-off

**Resultado: gana A**, audio MP3 más escenario DOM/SVG, en el **100%** de las
ponderaciones plausibles. Ningún criterio, ni llevándose todo el peso, cambia el ganador.

El barrido provisional —hecho antes de construir nada— daba 91,7%. Medir lo subió a 100.
Eso es lo contrario de lo que suele pasar cuando alguien construye algo y luego lo puntúa,
y merece explicación: las tres celdas que se movieron al medir se movieron **en contra de
lo que yo acababa de construir**.

## Lo que cambió al medir

| celda | provisional | medido | por qué |
|---|---:|---:|---|
| c1 de B (calidad) | sin medir | 3,6 / 5 | la única esperanza de B, y con la rúbrica delante sale por debajo del 4,8 de A |
| c4 de B (accesibilidad) | 2 estimado | 1 medido | sin `aria-label`, cero nodos de texto, cero pistas de texto: el gráfico **no existe** para un lector de pantalla |
| c5 de A (equipos) | 6 estimado | 9 medido | el reconocimiento penalizó a A por "mutar SVG en cada cue"; medido, eso son diez mutaciones en cuatro minutos y cero fotogramas perdidos |
| c2 de B | 2 estimado | 3 medido | **a favor** de B: la mitad de autoría sí está resuelta, los beats se regeneran solos |

## Las cifras

Todas de instrumentos que están en `medir/` y se pueden volver a correr. La lección
completa, a velocidad real, 233 s por corrida.

### Criterio 5 — lo que le cuesta a la máquina

Con la configuración real del producto (cada opción con el mejor reloj que tiene, ya con
el sondeo por rAF en A):

| | A · 1x | B · 1x | A · CPU 4x | B · CPU 4x |
|---|---:|---:|---:|---:|
| fotogramas p50 / p95 | 8,3 / 10 ms | 8,3 / 9,9 ms | 8,3 / 10 ms | 8,3 / 9,9 ms |
| fotogramas sobre 50 ms (de ~28 000) | 0 | 0 | 0 | 2 |
| bloqueo del hilo principal | 0 ms | 0 ms | 0 ms | 50 ms |
| **bytes por la red** | **1,57 MB** | **17,9 MB** | **2,48 MB** | **17,3 MB** |
| desfase de cues p95 | 85 ms | 103 ms | 85 ms | 105 ms |

**Empatan en todo lo que es CPU.** Ni uno ni otro pierde fotogramas de forma apreciable:
dos de veintiocho mil en el peor caso, que es B con la CPU estrangulada cuatro veces. La hipótesis pre-registrada decía que el
vídeo gana en equipos modestos: **refutada**, no hay nada que ganar porque no hay nada que
sufrir.

**Pierden de forma muy distinta en la red.** El MP4 pesa 10,5 MB y el navegador transfiere
entre 1,7 y 2 veces eso, porque la lección se detiene en cada checkpoint y rebuferea al
reanudar. Un alumno con datos móviles descarga **diez veces más** por la misma lección. Y
esa cuenta es un suelo: un estudiante real tarda más en contestar que este arnés, así que
rebuferea más.

La otra mitad de la hipótesis —"el vídeo pesa mucho"— queda **confirmada**, y contra lo
que el reconocimiento había reportado: aquel medía +0,85 MB, y el artefacto que la app
sirve de verdad son +8,7 MB.

### Los dos sesgos de medición que hubo que desactivar

Los dos habrían dado la victoria a B en el criterio 5 por motivos que no tienen nada que
ver con el vídeo.

**El reloj.** `<audio>` no tiene `requestVideoFrameCallback` en ningún navegador y `<video>`
sí. Con el instrumento tal cual, A daba 483–541 ms de desfase y B daba 86–120: cuatro
veces mejor, y el número no habría hablado de vídeo contra SVG sino de qué API admite cada
etiqueta HTML. **Pero al mirarlo de cerca resultó no ser un sesgo sino un fallo nuestro**:
`audio.currentTime` se lee en cada fotograma igual de bien. Diez líneas de sondeo con
`requestAnimationFrame` bajaron a A a **85 ms**, ahora por debajo de B. El bake-off le
arregló medio segundo de desfase al producto.

**Los bytes.** Un `<video>` se sirve por rangos y `transferSize` sale 0 para esas
peticiones: la primera medida dio **0,00 MB para B**, que es exactamente la cifra que uno
querría creer. Se cuenta por CDP, y esa contabilidad se validó descargando el MP4 con
`fetch` y comprobando que las tres cifras coinciden al byte.

### Criterio 2 — personalización al vuelo

Un profesor cambia el ingreso del ejemplo de 100 a 120:

| | A | B |
|---|---:|---:|
| releer el pack | 0,15 s | 0,15 s |
| regenerar los beats | — | 0,88 s |
| renderizar el MP4 | — | 78,4 s |
| **total** | **0,15 s** | **79,3 s** |

**534 veces.** Y el número es honesto con B precisamente porque los beats **no están
escritos a mano**: se derivan de la misma máquina de estados que pinta A, así que esto no
mide si alguien se acordó de actualizar una copia. Mide lo que queda cuando esa parte ya
está resuelta, y lo que queda es el render.

Un matiz que va en la misma frase que el número: el guion hablado no se toca. Con el
ingreso a 120 la narración sigue diciendo "cien". Arreglarlo de verdad exige regrabar el
audio, y ese costo lo comparten las dos opciones.

### Criterio 4 — accesibilidad

| | A | B |
|---|---|---|
| etiqueta accesible del escenario | "Línea presupuestaria de café y jugo de naranja. Ingreso 100, precios 3 y 1. Intercepto horizontal 33.3…" | **ninguna** |
| nodos de texto seleccionables | 4 | 0 |
| pistas de texto del vídeo | — | 0 |

El gráfico de B no existe para un lector de pantalla, y tampoco se puede seleccionar,
copiar ni buscar un número en él. A ese hecho se le suma otro que las capturas no pueden
mostrar: **el MP4 no puede seguir el tema de la página.** A cambia con
`prefers-color-scheme`; B necesitaría renderizar y servir dos vídeos.

### Criterio 1 — calidad visual

A 4,8 contra B 3,6 sobre 5, con la rúbrica escrita antes de mirar ninguna captura y con
una advertencia grande delante: **no fue a ciegas.** El detalle está en
`01-criterio-1.md`, incluidas las tres correcciones que le apliqué a B antes de puntuar
porque eran andamiaje mío y no limitaciones de Remotion.

## Lo que el brazo B demostró, y que era el motivo de construirlo

**La costura aguanta.** El motor de cues no cambió ni una línea: `?variant=B` sirve la
lección entera, el vídeo se detiene en el checkpoint programado —verificado: pausó en
145,02 s para un cue en 144,761— y el dock abre con la pregunta del pack. Esa era la
apuesta de M0 y estaba sin cobrar.

**Y aguantó tras romper tres suposiciones** que solo se ven cuando existe un segundo
adaptador: las timelines guardadas por idioma en vez de por variante; cinco sitios
pintando el escenario sin saber que alguien más podía ser su dueño; y `?t=` reconstruyendo
por cues, que bajo vídeo no pintaba nada. La tercera habría hecho que las capturas del
criterio 1 compararan un fotograma renderizado contra uno negro.

## Lo que este informe no dice

- **No mide aprendizaje.** Ninguna celda dice si un alumno entiende mejor el pivote en
  vídeo o en SVG. c1 mide si la superficie *presenta* el hecho con claridad, que es
  necesario y no suficiente.
- **c3 lleva una estimación mía**, no un cronómetro: las ~200 líneas del componente de
  Remotion las escribí yo y no me cronometré.
- **C (Manim) y D (híbrido) no se construyeron.** Sus celdas siguen siendo del
  reconocimiento y el marcador lo dice.
- **Las reglas de puntuación de c1, c4 y c5 se escribieron después de ver los datos.** Los
  pesos no: están en git con fecha anterior. Por eso cada celda lleva al lado su número
  crudo — si Kristian puntúa distinto, el barrido recalcula solo.

## La pregunta que M4 respondió, que no es la que preguntaba

La pregunta original era cuál de cuatro tecnologías de render usar. La respuesta es la que
ya estaba: la que había. Pero eso se sabía con un 91,7% antes de construir nada, y lo que
las seis horas de brazo B compraron fue otra cosa:

- medio segundo de desfase arreglado en producción, que nadie habría buscado;
- una compuerta que detecta un vídeo derivado de un guion que ya cambió;
- un bucle infinito descubierto de paso, en el que un ítem abierto se servía para siempre
  y dejaba el concepto entero fuera de alcance;
- y la confirmación, con números, de que la costura `MediaAdapter` admite de verdad una
  segunda tecnología — que es lo que permite volver a preguntarse esto en M5 sin
  reescribir la app.
