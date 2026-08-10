# M2 funcionando: ya hay algo que mirar

Kristian, esto es lo primero del proyecto que se ve y se oye. Te lo cuento y luego lo abres tú.

## Qué hay corriendo

La opción A del bake off está de punta a punta. El audio se reproduce, y mientras suena, el gráfico se va construyendo solo, sincronizado con lo que la voz está diciendo. Aparecen los ejes cuando la narración plantea la pregunta, la recta cuando habla de combinaciones alcanzables, el conjunto sombreado cuando distingue la línea de la frontera, los interceptos cuando los calcula, y el triángulo de la pendiente cuando explica el precio relativo.

Y en los dos puntos de control el audio se detiene solo y se abre el panel del tutor con la pregunta, que es la decisión que tomaste con el argumento del check de atención.

Está en el navegador ahora mismo, en localhost puerto cinco uno siete tres.

## Las dos cosas que quiero que mires

La primera es el momento del pivote, que creo que quedó bien. Cuando la narración dice que sube el precio del almuerzo, la recta gira, y pasan tres cosas a la vez: la recta anterior se queda dibujada en gris punteado para que se vea de dónde venía, el intercepto del café se queda exactamente donde estaba y **se resalta en azul**, y el triángulo de la pendiente pasa de menos tres a menos cuatro.

Ese resaltado no es decorativo. La confusión número tres del catálogo es justamente creer que subir el precio de un bien mueve el intercepto del otro. En vez de explicarlo, el gráfico obliga a mirar el punto que no se mueve.

La segunda es el contraste con el cambio de ingreso. Ahí la recta se desplaza en paralelo y la anterior también queda punteada, así que las dos situaciones se ven claramente distintas. Para que eso funcione tuve que fijar la escala de los ejes: si los ejes se reescalaran cuando sube el ingreso, un desplazamiento paralelo se vería idéntico a un pivote y el concepto entero se perdería.

## Un bug que salió probándolo

Encontré algo que no habría visto leyendo el código. Si el estudiante salta hacia adelante en el audio, el gráfico se quedaba en blanco, porque los puntos de sincronía anteriores nunca habían disparado.

Lo arreglé de una forma que además simplifica: el estado del gráfico es función pura del tiempo. En vez de ir acumulando cambios, cuando hay un salto se recalcula desde cero plegando todos los puntos de sincronía hasta ese instante. Saltar hacia atrás también funciona bien ahora.

## El desfase, medido

Esto responde a lo que decidiste de no usar el celular para medir. El motor de puntos de sincronía registra, en cada disparo, la diferencia entre el segundo en que debía dispararse y el segundo real del audio.

En esta máquina el percentil noventa y cinco está entre cincuenta y ocho y setenta y tres milisegundos. Es imperceptible: por debajo de cien milisegundos nadie nota desincronía entre audio y gráfico. Y ese número aparece en la esquina de la pantalla mientras corre, así que cuando lo abras en tu equipo viejo vas a ver directamente cuánto se degrada, sin instalar nada.

## Sobre la decisión que este hito tenía que resolver

El plan decía que este hito era el experimento que decide si hace falta React o si alcanza con TypeScript puro.

Por ahora alcanza con TypeScript puro, y con holgura. El estado de la sesión es pequeño y el gráfico se redibuja entero en cada cambio sin que se note. Pero el veredicto todavía no es definitivo: falta montar los cuatro tipos de pregunta y la manipulación del gráfico con arrastre, que es donde el estado se complica de verdad. Si va a hacer falta un framework, va a ser ahí.

## Lo que sigue

Los cuatro tipos de pregunta dentro del panel: opción múltiple, numéricas, abiertas, y la manipulación arrastrando la recta. El banco de dieciséis preguntas ya está escrito, así que es cablearlo.

Ábrelo y dime qué te parece antes de que siga.
