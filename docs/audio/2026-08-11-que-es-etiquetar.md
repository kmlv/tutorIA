# Qué es eso de etiquetar

Kristian, es culpa mía. Llevo diez mensajes diciéndote "etiqueta los sesenta y nueve ítems" como si fuera obvio, y nunca te expliqué qué es. Te explicaba el comando, que es lo fácil, y me saltaba la idea, que es lo que importa.

## La idea

Construimos un juez automático. Es un modelo que lee la respuesta escrita de un alumno —una respuesta en prosa, no de opción múltiple— y decide dos cosas: si dijo las ideas que la pregunta pedía, y si muestra alguno de los errores conceptuales del catálogo.

La pregunta que decide si este proyecto tiene sentido es una sola: **¿ese juez coincide contigo?**

Si el juez aprueba respuestas que tú reprobarías, o si dice que un alumno confundió la línea con el conjunto cuando tú ves que no, entonces todo lo demás que construimos es decoración. El motor de dominio, la escalera de remediación, la selección del siguiente ítem: todo eso se apoya en que el veredicto sea confiable. Si el veredicto no lo es, el resto es maquinaria bien hecha alrededor de nada.

Y para saber si coincide contigo hace falta lo obvio: **tu veredicto sobre las mismas respuestas**. Eso es etiquetar. Tú haces de corrector, sobre sesenta y nueve respuestas, y después yo comparo lo tuyo con lo de la máquina, ítem por ítem, y sale un número.

## Cómo se ve en la práctica

El programa te muestra una respuesta cada vez y te hace dos o tres preguntas de sí o no.

Te pongo un ítem real de los que te esperan. La pregunta al alumno fue: explica con tus palabras qué significa que la pendiente sea menos tres, sin usar la fórmula, dímelo en café y jugo.

Y un alumno respondió, textualmente: "o sea yo lo veo como un tipo de cambio entre los dos. si me antojo de un kilo más de café, el jugo me baja tres litros, siempre tres, no importa en qué parte de la recta esté. el menos es porque uno sube y el otro tiene que bajar, con los mismos cien no puedo tener más de los dos. y el tres es lo caro que sale el café comparado con el jugo, no en dólares sino en jugo".

Entonces el programa te pregunta, una cosa a la vez.

Primera: ¿dice esto? Lee la pendiente como una tasa de intercambio: un kilo más de café cuesta tres litros de jugo. Ese es el punto de rúbrica. Tú contestas ese o ene.

Segunda: ¿dice esto? El signo negativo refleja que un bien sube y el otro baja. Ese o ene otra vez.

Y tercera: ¿muestra alguno de estos errores? Cero, ninguno. Uno, pendiente invertida. Dos, pendiente positiva. Tres, un error claro que no está en el catálogo.

Eso es todo. Dos o tres teclas por ítem, sesenta y nueve veces. Guarda después de cada uno, así que puedes cortar cuando quieras y volver con el mismo comando.

## Por qué está barajado y por qué no ves la intención

Dos detalles que vas a notar y que no son caprichos.

El orden viene **barajado**, con una semilla fija para que sea reproducible. Si los ítems llegaran agrupados —todos los de un mismo error seguidos— empezarías a etiquetar por patrón en vez de por lectura, y el acuerdo con el juez saldría inflado por una razón que no tiene nada que ver con el juez.

Y **nunca vas a ver para qué fue escrita cada respuesta**. El gold set guarda esa intención, porque la respuesta se escribió a propósito para mostrar tal o cual error. Pero el programa no te la enseña. Si la vieras, "el juez coincide con Kristian" pasaría a significar, sin que ninguno de los dos lo note, "el juez coincide con quien redactó el ejemplo". Y eso no es lo que queremos medir.

## Lo que este número puede y no puede decir

Puede decir si el juez coincide contigo. Eso es exactamente lo que pregunta el hito tres, y es la compuerta que tú mismo fijaste: ochenta por ciento de acuerdo con el intervalo reportado, recall del setenta por ciento en cada error que aparezca al menos tres veces, y cero identificadores fuera del catálogo.

No puede decir si el juez funciona con alumnos reales. Las sesenta y nueve respuestas las escribieron modelos, con instrucciones bastante duras para que sonaran a alumno de verdad: cortas, con tildes comidas, empezando a media frase. Pero un chico de diecinueve años escribiendo a medianoche es más desordenado y más ambiguo que cualquier cosa que un modelo invente imitándolo. Cada ítem lleva marcada su procedencia y el reporte lo dice arriba del todo, cada vez que corre, para que ese número nunca se cite sin la salvedad pegada.

La prueba de verdad es la primera cohorte. Esto es el paso anterior.

## Y una cosa más que se decide con lo mismo

Cuando termines, el mismo gold set con tus etiquetas vuelve a correr el bake-off entre los tres modelos. Ahora mismo los comparé contra la intención, que es la opinión de otro modelo, y salieron indistinguibles entre sí con el caro costando veintidós veces lo que el barato. Con tus etiquetas delante, esa comparación pasa a ser real, y ahí se decide si el juez puede bajar al modelo barato. Con veinte conceptos y un curso entero, un factor de veintidós no es un detalle.
