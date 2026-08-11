# La web conectada, y un bug serio que encontré haciéndolo

Kristian, sí, la estaba haciendo y ya está. Y de paso apareció un bug que me importa más que la web.

Primero lo que corresponde: las dos veces anteriores dije "sigo con la web" y el turno se cerró sin que yo tocara una línea de código. Dos veces el mismo error. Esta vez está hecho y verificado en el navegador, no solo escrito.

## Lo que faltaba conectar

El motor entero existía en el servidor y ninguna pantalla lo tocaba. La web llamaba a cuatro endpoints y ninguno era de los nuevos. Ahora hay tres piezas más.

**El bucle de práctica.** Cuando termina la narración ya no se acaba la sesión: el cliente le pregunta al servidor qué toca ahora, lo pinta, recoge la respuesta y vuelve a preguntar. El cliente no decide qué preguntar, no conoce el criterio de dominio, y no sabe qué sub-habilidad está floja. Eso no es prolijidad: un selector viviendo en el navegador enviaría las reglas de dominio en el bundle, y esas reglas referencian la clave de respuestas.

**El cuadro de texto libre en el chat.** El dock tenía cinco botones de intención —no entiendo, otro ejemplo, más despacio— y eso no es lo que promete el brief. El brief dice que el alumno puede preguntar lo que quiera, cuando quiera. Los dos conviven a propósito: un toque cuesta menos que una frase, y un alumno atascado y un poco avergonzado toca antes de escribir. Los botones son el piso bajo, el texto es el techo alto.

**Las preguntas abiertas en los puntos de control.** Antes se quedaban ahí, con el enunciado impreso y ninguna forma de responder, porque el juez no existía. Ahora se responden, se juzgan en sombra, y el veredicto deliberadamente no se le devuelve al alumno.

## Tres bugs que aparecieron al verlo funcionar

**El primero, y era grave.** Cuando el selector pidió una pregunta de manipulación, el bucle se colgaba. El arrastre del gráfico no estaba cableado en ninguna parte del programa, ni siquiera en la entrega. O sea que el bucle habría llegado a la segunda pregunta y se habría quedado ahí para siempre. Ahora el servidor manda **qué gesto** montar —arrastrar un punto o arrastrar la recta— y nunca dónde debería terminar; eso ya lo dice el enunciado en voz alta, y la recta objetivo y la tolerancia se quedan del lado del servidor.

**El segundo.** En modo práctica el gráfico salía vacío, sin ejes y sin recta, porque la narración nunca corrió. Nada que arrastrar. Se ve mirándolo, no leyendo el código.

**El tercero, en el respondedor.** Una pregunta abierta en sombra devuelve "registrada", no "correcta". Yo lo estaba forzando al mismo tipo, así que "correcta" salía indefinido, que es falso, y el alumno habría recibido "vamos a pensarlo distinto" **cada vez que respondiera bien** una pregunta abierta.

## El bug que de verdad importa

Mientras probaba, la base de datos se corrompió. Tres veces. `database disk image is malformed`.

Me equivoqué dos veces buscándolo. Primero culpé a que la base estaba en la carpeta temporal del sistema. La moví, y volvió a pasar. Después culpé al recargador automático del servidor, pensando que mataba el proceso a mitad de una escritura. Fui a mirar el registro y había cero recargas. Tampoco era.

La pista que lo delató: una tanda de comandos secuenciales pasaba **siempre**, y el navegador la rompía **siempre**. La diferencia entre los dos no es el contenido, es que el navegador dispara varias peticiones a la vez.

Y ahí está. La clase que habla con la base abre la conexión desactivando la única red de seguridad que trae el módulo de SQLite: la comprobación de que una conexión se use desde el hilo que la creó. Y FastAPI corre en un pool de hilos todo endpoint declarado sin async, que son todos los nuestros. O sea que dos peticiones simultáneas del navegador usan **la misma conexión desde hilos distintos, al mismo tiempo**. Eso corrompe el archivo.

Esto no era un problema del entorno de desarrollo. Es un bug del producto que habría corrompido datos de alumnos reales, en silencio, y la corrupción no se nota al escribir: aparece en una lectura posterior, que puede ser de otra sesión y de otro día.

La corrección es un candado reentrante que serializa todo acceso a la conexión. Reentrante porque crear una sesión llama a asegurar el estudiante y a registrar un evento, y los dos vuelven a tomarlo. Para el proof of concept el costo es nulo: un alumno, escrituras diminutas. Cuando haya concurrencia real la salida es una conexión por hilo, o Postgres, y esa clase sigue siendo la única que hay que tocar.

Y dejé el test de regresión que lo reproduce: ocho hilos escribiendo y leyendo entrelazados. Falla ruidosamente contra la versión sin candado. Lo que lo atrapa no es el contador de errores sino la verificación de integridad de la base, justo porque la corrupción es silenciosa cuando ocurre.

Hay algo incómodo que quiero decir de frente: ese bug llevaba ahí desde el hito cero, y los ciento diecinueve tests pasaban todos. Ninguno hacía dos peticiones a la vez. Un test que solo llama al código en secuencia no puede ver un bug de concurrencia, por muchos que sean.

## Un error mío de operación

En medio de esto maté el servidor de desarrollo del frontend sin querer. Usé el comando que lista procesos por puerto y le pasé todo a matar, pero ese comando devuelve también a los **clientes** del puerto, no solo a quien escucha. Vite tenía una conexión abierta contra el backend, así que cayó con él. Había que filtrar por estado de escucha.

## Estado

Ciento diecinueve tests en verde, el chequeo de tipos del frontend limpio, el validador del pack limpio.

Verifiqué el ciclo completo contra la API real: tres respuestas correctas en tres modalidades distintas y la sub-habilidad queda en **dominada**, con la probabilidad en ochenta, la racha en tres y ningún bloqueador. El selector pasa sola a la siguiente sub-habilidad y dice por qué la eligió. Y en el navegador se ve la secuencia entera: practicamos, pregunta de opción múltiple, correcto, y la de manipulación con el gráfico dibujado y los tiradores puestos.

Queda un detalle visual: en modo práctica el gráfico se ve recortado por abajo, se pierde el eje horizontal. Es de disposición, no de lógica, y lo miro en la siguiente.

Lo que te espera sigue igual: etiquetar los sesenta y nueve ítems, decidir lo de la rúbrica de la pendiente, y decirme si commiteo.
