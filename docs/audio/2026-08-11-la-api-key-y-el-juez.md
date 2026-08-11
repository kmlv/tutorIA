# La API key, y en qué quedó el juez

Kristian, gracias, pero no puedo usar esa key, y hay dos razones distintas. Una es urgente y la otra es una decisión tuya.

## Lo urgente

La pegaste en el chat. Eso significa que ya está en el transcript de esta sesión, en los logs que quedan en tu disco, y potencialmente en cualquier telemetría que pase por el medio. Una credencial que estuvo en un chat está quemada, independientemente de quién la vio. Yo no la voy a escribir en ningún archivo.

Lo que te pido es concreto: **entra a la consola de OpenAI y revócala.** Ahora, no después. Toma treinta segundos y es lo único que hace que el problema desaparezca.

Y la regla general, que ya dejé escrita en el `.env.example` del repo: las keys nunca se pegan en un chat, ni en un issue, ni en un commit, ni en un screenshot. Van a un archivo que está en el gitignore, y lo escribes tú, no yo.

## Lo segundo, que es una decisión tuya

Esa es una key de OpenAI, y todo lo que acabo de construir apunta a Claude. No es un descuido tuyo, es que nunca lo discutimos explícitamente: en el plan quedó "el proveedor LLM vive del lado del servidor", pero cuál proveedor nunca lo cerramos.

Ahora bien: la capa que construí hoy es agnóstica a propósito. Hay una interfaz, `LLMProvider`, y encima de ella nadie sabe quién responde. Meter OpenAI es escribir un archivo de unas ochenta líneas al lado del de Claude. No es trabajo perdido ni es una discusión de arquitectura.

Lo que sí cambia según lo que elijas son dos cosas prácticas.

La primera es la salida estructurada. Con Claude uso el esquema JSON del lado del servidor, y el modelo no puede salirse del enum de misconceptions ni inventarse un key point. OpenAI tiene su propio mecanismo equivalente, así que esto no es un bloqueo, pero es código distinto y hay que probarlo por separado.

La segunda es más de fondo. La pregunta del hito tres es si el juez concuerda contigo. Esa medición es por modelo. Si medimos concordancia con un modelo y después cambiamos de proveedor, la medición no se hereda: hay que volver a correrla. Por eso conviene decidirlo antes de que gastes tu tiempo etiquetando el gold set, no después.

Mi recomendación es Claude, y la razón es aburrida pero honesta: es lo que sé verificar bien, la referencia de la API la tengo cargada y actualizada, y el resto del repo ya está escrito contra ella. Si tienes una razón para OpenAI, dímela y lo hago, no hay problema.

## Dónde va la key cuando decidas

En un archivo `.env` en la raíz del repo, que ya está en el gitignore. Copias `.env.example`, pones la línea, y listo. El servidor la lee al arrancar, nunca la imprime, nunca la manda al navegador y nunca la escribe en la base de datos. Hay un test que verifica justamente eso último: mete una key falsa en el entorno, pide el endpoint de salud, y falla si el string aparece en la respuesta.

## Lo que quedó construido hoy

Sesenta y ocho tests en verde y el validador del pack limpio.

La capa de proveedor está completa: la interfaz, un proveedor falso para tests, el de Claude, y un enrutador por rol. Ese enrutador es lo que pediste: el juez de respuestas abiertas usa el modelo fuerte, el chat usa el barato, y hay una tabla de precios al lado, así que cada veredicto queda registrado con su costo en dólares. Todo eso vive en un archivo de configuración, no en el código, para que puedas cambiar de modelo sin pedirme permiso.

Una cosa que te va a sorprender, porque a mí me sorprendió: **temperatura cero ya no existe.** En los modelos actuales de Claude, mandar `temperature` devuelve un error cuatrocientos. El parámetro fue eliminado. Así que la reproducibilidad del juez no viene de ahí, viene de otro lado: la rúbrica es fija, el esquema de salida no se puede violar, el prompt está versionado, y guardo una huella criptográfica del texto del prompt junto a cada veredicto. Esa huella es para atrapar el caso en que alguien edita el prompt y se olvida de subir la versión, que es el caso normal.

El juez en sí tiene una decisión de diseño que quiero que veas, porque es la misma que tomamos con los correctores deterministas. **El modelo no decide si el alumno está bien.** El modelo solo reporta, punto por punto de la rúbrica, si el alumno dijo esa idea, y cita textualmente las palabras donde la dijo. El puntaje lo calcula el código, con reglas que se pueden leer y testear sin llamar a nadie. Si el modelo devolviera un campo que diga "correcto: sí", ni siquiera lo leo.

Y las citas las verifico contra el texto del alumno. Si el modelo dice que el alumno mencionó el precio relativo y cita una frase que el alumno nunca escribió, eso queda marcado. No anula el veredicto, porque no quiero decidir por adelantado qué significa; queda como un dato en el reporte de concordancia. Si resulta que las citas inventadas predicen desacuerdo contigo, entonces ya tenemos una señal barata para filtrar veredictos malos.

El modo sombra está montado y es estructural, no una convención. Cada veredicto se escribe en la base con una columna `shadow` en uno, y la consulta que alimenta el dominio filtra esa columna. O sea: el juez es incapaz de promover a un alumno aunque la configuración esté mal, porque el camino que promueve nunca ve esas filas. Y para pasar a modo vivo hacen falta dos variables de entorno, no una: la segunda solo tiene sentido ponerla después de haber leído un reporte de concordancia.

## Un bug de contenido que encontré leyendo

Uno de los key points de la pregunta abierta del segundo punto de control decía, en los dos idiomas, "gastar todo en café no involucra el precio del café". Eso es exactamente al revés. El intercepto del jugo es la esquina donde se gasta todo en jugo.

Importa más de lo que parece, porque los key points son la rúbrica que ve el juez. Con esa línea, el juez habría premiado justo la confusión que la pregunta existe para detectar. Ya está corregido.

## Lo que sigue, cuando me digas

Falta el gold set y el arnés de concordancia. El arnés no depende del proveedor, pero el gold set sí depende de tu tiempo: son unas treinta respuestas que tienes que etiquetar tú, y no quiero que las etiquetes contra un modelo que después vamos a cambiar.

Hay algo más que quiero decirte de frente sobre ese gold set. Las respuestas de alumno las voy a escribir yo, sintéticas, para que tú solo tengas que etiquetar y no redactar. Eso mide si el juez concuerda contigo, que es lo que el hito pregunta. Pero **no** mide si el juez funciona con cómo escriben los alumnos de verdad, que es más desordenado, más corto y más ambiguo que cualquier cosa que yo invente. Voy a marcar cada ítem con su procedencia para que esa limitación quede visible en el reporte y no se nos olvide.
