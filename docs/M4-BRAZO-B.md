# Brazo B — la lección pre-renderizada a MP4 (Remotion)

Bitácora de construcción. Lo que se construyó, lo que se rompió, y qué quedó demostrado
que antes solo estaba supuesto.

## Por qué se construyó si el barrido ya tenía ganador

El barrido provisional (`bakeoff/00-barrido-provisional.md`) daba A ganando el 91,7% del
símplex, y ni con un 5/5 en calidad visual B pasaba del 32,5%. Construirlo igual tenía
tres motivos, ninguno de los cuales era "a ver quién gana":

1. **Falsar la hipótesis pre-registrada.** El plan predijo que el vídeo gana en equipos
   modestos *y pesa mucho*. Las dos mitades son comprobables y una ya venía tambaleándose.
2. **Ejercitar la costura.** `MediaAdapter` se diseñó en M0 apostando a que un segundo
   adaptador entraría sin tocar el resto. Nunca se había probado. Una costura que nadie ha
   cruzado no es una costura, es un comentario.
3. **Darle a c1 una respuesta real** en vez de un hueco en la matriz.

## Lo que la costura aguantó, y lo que no

**Aguantó lo esencial.** El motor de cues no cambió ni una línea: el `<video>` es un
`HTMLMediaElement` igual que el `<audio>`, la timeline es el mismo contrato, y los
checkpoints pausan igual. Verificado en vivo: con `?variant=B`, el vídeo se detuvo en
145,02 s por el checkpoint programado en 144,761 y el dock abrió con la pregunta del pack.
Esa era la apuesta entera de M0 y hoy está cobrada.

**No aguantaron tres suposiciones**, todas del lado "se construye una vez", y todas
invisibles hasta que hubo un segundo adaptador:

| Suposición | Qué pasaba | Dónde se arregló |
|---|---|---|
| Las timelines se guardan por idioma | Las cuatro opciones compartían obligatoriamente el ritmo del camino HTML — la promesa del §6 del plan era inalcanzable | clave `<lang>/<variant>` + `Pack.timeline()` |
| El escenario DOM siempre pinta | Cinco sitios pintaban gráfico y ledger sin saber que el vídeo ya los traía dentro: doble dibujo que se separa según se acumula el desfase | `MediaAdapter.ownsStage` |
| `?t=` reconstruye pintando cues | Con el vídeo dueño del escenario no pintaba nada y el vídeo se quedaba en cero — y `?t=` es justo como el bake-off captura el mismo instante en las dos opciones | `main.ts` busca en el medio cuando no es suyo el escenario |

La tercera es la que más cerca estuvo de arruinar la medición sin avisar: la captura para
la rúbrica a ciegas de c1 habría comparado un fotograma renderizado contra uno negro.

## La decisión que hace que el brazo mida algo

Los props de Remotion **no se escriben a mano**. `pipeline/render_b.py` compila
`app/web/src/graph/state.ts` —la máquina de estados de la app, sin DOM— y la ejecuta en
node sobre la misma timeline que reproduce A, emitiendo un beat por cue con el `GraphState`
resultante.

Si hubiera transcrito los beats a mano, el criterio 2 —que pregunta qué pasa al cambiar el
ingreso o un precio— habría medido mi transcripción y no a Remotion: la respuesta sería
"nada, hasta que alguien edite la copia", que no dice nada sobre la tecnología. Alimentado
desde la máquina compartida, la pregunta pasa a ser la real: **dado que los beats se
regeneran gratis, ¿qué sigue costando poner un MP4 nuevo delante de un estudiante?** Y esa
respuesta es un número —el render— en vez de un argumento.

El mismo reparto explica por qué los cues de checkpoint y de predicción **no entran en el
vídeo**. La app los pausa igual que pausa el audio. El MP4 no sabe que existen; la
interacción no queda cocida dentro.

## Lo que contradice al reconocimiento

El reconocimiento reportó **2,5 MB de MP4** contra 1,69 MB del MP3, o sea +0,85 MB por
toda la imagen en movimiento. Ese número entró en la matriz provisional y es la mitad de la
hipótesis que sobrevivía.

El render real de la lección completa, con los ajustes por defecto de Remotion, pesa
**11,06 MB** contra 1,86 MB del MP3: **+9,2 MB**, no +0,85. Un orden de magnitud de
diferencia en la celda que más le importa al criterio 5.

La explicación probable es que el `lesson_lean.mp4` del reconocimiento se produjo con
ajustes de codificación distintos de los que usa `pipeline/render_b.py`. Pendiente de
comprobar; hasta entonces la cifra que vale es la del artefacto que la app sirve de verdad,
que es la de 11 MB. Es una diferencia que importa: 1,86 MB y 11 MB no son la misma
conversación para un estudiante con datos móviles.

## Instrumento, y un fallo del instrumento que vale la pena contar

`bakeoff/medir/medir.mjs` reproduce la lección entera, a velocidad real, y toma las mismas
cuatro medidas para cada opción: distribución de huecos entre fotogramas de animación
(la métrica que de verdad compara, porque es la misma en las dos), desfase de cues, bytes
por la red contados por CDP, y bloqueo del hilo principal. Con `--cpu 4` estrangula la CPU
por CDP, que es lo más cercano al equipo modesto del que habla el criterio 5.

Dos trampas de medición que hubo que desactivar a propósito:

**El reloj.** A monta `<audio>`, que no tiene `requestVideoFrameCallback` en ningún
navegador y sondea con `timeupdate` cada ~250 ms. B monta `<video>`, que sí la tiene y
sondea por fotograma decodificado, ~16 ms. Comparar los desfases tal cual le regalaba a B
el criterio 5 por diez veces, y el número no diría nada sobre vídeo contra SVG: solo sobre
qué API de sondeo admite cada etiqueta HTML. `?reloj=grosero` fuerza el reloj común y
`resumenDesfase()` viaja siempre con la etiqueta de su fuente.

**Los bytes.** Un `<video>` se sirve por rangos, y para esas peticiones `transferSize` de
Resource Timing sale 0. La primera medida dio **0,00 MB para la opción B** — exactamente la
cifra que el criterio 5 más necesita y la más fácil de creerse, porque "el vídeo no pesa
nada" es lo que uno quiere oír. Se cuenta por CDP.

Y un fallo propio, del mismo género y peor: la primera corrida completa leía `duration()`
antes de que cargaran los metadatos, sacaba 0, y el bucle salía en la primera vuelta. Las
cuatro filas salieron **con percentiles de fotograma perfectamente creíbles medidos sobre
un segundo de lección**. No dio error: dio un número. Ahora el arnés espera los metadatos y
además falla si la reproducción no llegó al 90% de lo que iba a medir.
