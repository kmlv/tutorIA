# Cómo vamos

Kristian, estado honesto, incluida la parte que no avanzó.

## Lo que está hecho y probado

Ciento dieciséis tests en verde, el validador del pack limpio, y todo corriendo en vivo contra el proveedor de verdad, no contra un simulacro.

El backend del proof of concept tiene sus cinco piezas completas.

La entrega, con audio y gráficos sincronizados, que ya viste funcionando.

Las preguntas con corrección determinista, que son dieciocho de las veintiuna del banco y son las que cargan el criterio de dominio.

El juez de respuestas abiertas, en modo sombra, donde el modelo no decide si el alumno está bien: sólo reporta punto por punto de la rúbrica y cita textualmente, y el puntaje lo calcula el código.

El motor de dominio, que evalúa el criterio cláusula por cláusula, dice cuál bloquea, elige el siguiente ítem y sube la escalera de remediación cuando una confusión se repite.

Y el chat del tutor, construido para no poder resolver, con tres capas de guardarraíl de las cuales sólo la primera es estructural: al tutor nunca se le da la respuesta.

Además hay un gold set de sesenta y nueve respuestas de alumno, un arnés de concordancia con la compuerta del hito tres, y un bake-off entre tres modelos.

## Lo que no avanzó, y por qué

Dije que seguía con la interfaz web y **no la empecé**. El turno se cerró cuando me auto-agendé, y el despertar todavía no produjo trabajo. No quiero que te enteres de eso leyendo el código.

Concretamente: la web hoy llama a cuatro endpoints —crear sesión, traer el pack, registrar eventos y enviar una respuesta— y **no** llama a los tres nuevos: el que dice qué preguntar después, el que da el estado de dominio, y el del chat. O sea que todo el motor que construí anoche existe, está probado, y todavía no lo toca ninguna pantalla. Hay un componente de chat en el frontend de antes, pero está desconectado del endpoint nuevo.

Es lo siguiente que hago.

## Lo que te espera a ti

Tres cosas, y la primera es la que de verdad importa.

**Etiquetar los sesenta y nueve ítems.** Van cero. Es lo único que convierte el noventa por ciento preliminar en un resultado de verdad, porque ese noventa por ciento es acuerdo con la intención con la que se escribieron las respuestas, o sea la opinión de otro modelo, no la tuya. Se corre con un comando, guarda después de cada ítem, y son unos treinta y cinco minutos que puedes partir en dos.

**Decidir qué hacer con la rúbrica de la pregunta de la pendiente.** Pide dos veces casi lo mismo: renunciar a tres litros por un kilo, y conectarlo con el precio relativo. Dos auditores lo señalaron por separado y en los datos es el punto de rúbrica con peor acuerdo de todos, setenta y seis por ciento. No es problema del juez: dos correctores humanos tampoco coincidirían ahí. Qué cuenta como "conectarlo con el precio relativo" lo decides tú.

**Decirme si commiteo.** Hay cincuenta y siete archivos sin commitear. No lo he hecho porque no me lo pediste y no quise asumirlo, pero ya es bastante trabajo colgando de un árbol sucio.

## Y una decisión que se puede tomar sola

El bake-off dijo que los tres modelos son indistinguibles en este gold set, y que el caro cuesta veintidós veces lo que el barato. Con la salvedad de siempre: hay cinco o seis ítems discordantes, así que la prueba casi no tiene potencia, y "indistinguibles" significa que este gold set no los separa, no que sean equivalentes. Cuando etiquetes, esa comparación se vuelve a correr contra tu verdad y ahí sí se decide con datos.
