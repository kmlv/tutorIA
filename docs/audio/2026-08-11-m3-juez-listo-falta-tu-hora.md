# M3: el juez está listo y funcionando. Falta tu hora.

Kristian, la key funciona. Hice una llamada real de prueba: dos coma cuatro segundos, nueve millonésimas de dólar. Y desde ahí construí el resto del hito tres. Te cuento qué hay, qué encontré, y qué necesito de ti.

## Lo que está construido

El juez de respuestas abiertas está completo y probado en vivo contra el modelo de verdad. Setenta y ocho tests en verde, el validador del pack limpio.

La decisión de diseño central quiero repetírtela porque es la que hace que todo lo demás se sostenga: **el modelo no decide si el alumno está bien**. El modelo solo reporta, punto por punto de la rúbrica, si el alumno dijo esa idea, y cita textualmente las palabras donde la dijo. El puntaje lo calcula el código con reglas que se leen y se testean sin llamar a nadie. Si el modelo devolviera un campo diciendo "correcto: sí", ni siquiera lo leo.

Y las citas las verifico contra el texto del alumno, sin acentos y sin mayúsculas para no castigar a quien escribe desde el celular. Si el modelo dice que el alumno mencionó el precio relativo y cita una frase que el alumno nunca escribió, eso queda marcado.

El modo sombra es estructural. Cada veredicto se escribe con una columna que dice "sombra", y la consulta que alimenta el dominio filtra esa columna. El juez es **incapaz** de promover a un alumno aunque la configuración esté mal, porque el camino que promueve nunca ve esas filas. Y para pasar a vivo hacen falta dos variables de entorno, no una: la segunda solo tiene sentido ponerla después de leer un reporte de concordancia.

## El gold set

Aquí es donde se fue la mayor parte del trabajo, y creo que valió la pena.

Generé las respuestas con diecinueve agentes en paralelo, cada uno escribiendo desde un arquetipo distinto de alumno, porque el defecto clásico del dato sintético es que todas las respuestas suenan a la misma persona. Después un auditor adversarial revisó cada respuesta preguntándose dos cosas por separado: ¿la escribiría de verdad un alumno de diecinueve años, o suena a libro de texto? Y ¿la etiqueta que dice traer corresponde a lo que el texto realmente dice?

Y encima de eso, un crítico de completitud miró el conjunto entero. Encontró tres huecos reales, y ninguno lo habría visto yo solo.

El primero: dos de los errores del catálogo tenían apenas dos instancias cada uno, así que el recall sobre ellos era literalmente inmedible.

El segundo es el que más me gustó. **No había trampas.** Todas las respuestas correctas eran limpias en su superficie: ninguna contenía las palabras de un error. Eso significa que el gold set podía medir si el juez *encuentra* errores, pero no si los *inventa*. Un juez tonto que marcara cualquier respuesta que contenga las palabras "un tercio" o "ingreso" o "positivo" habría sacado cien por ciento.

El tercero: el idioma estaba confundido con el registro. Todas las respuestas cortas e informales eran en español, y todas las correctas en inglés eran largas y discursivas. O sea que si el juez castigara el inglés, eso sería indistinguible de que castigara lo informal. Las dos variables se movían juntas y ninguna era medible.

Corrí una segunda ronda dirigida exactamente a esos tres huecos. Y ahí pasó algo que quiero que sepas, porque es el argumento entero a favor de la verificación adversarial.

Escribí seis trampas: respuestas **correctas** que parecen equivocadas en la superficie. Puse tres lectores independientes a intentar refutar que fueran correctas, con la instrucción de que ante la duda las declararan malas. Dos de las seis estaban **de verdad mal**. Una ponía el café en euros cuando el pack entero está en dólares. La otra decía que cien entre cuatro son veinte kilos, cuando son veinticinco. Si esas dos entran al conjunto etiquetadas como correctas, envenenan precisamente la medida de precisión que existen para permitir. Están corregidas y queda el registro de por qué.

El gold set final tiene sesenta y nueve ítems, cada error del catálogo con al menos cuatro instancias, treinta y seis en español y treinta y tres en inglés.

## El resultado preliminar, y por qué no cuenta

Corrí el juez sobre los sesenta y nueve. Ochenta y tres centavos en total, doce milésimas de dólar por veredicto, cuatro segundos de mediana. Cero veredictos inválidos.

Los números: noventa por ciento de acuerdo, kappa cero coma setenta y nueve, recall del cien por ciento en los cinco errores del catálogo, cero ids fuera del enum.

**Pero eso no es la compuerta y no cuenta como evidencia de nada.** Ese noventa por ciento es acuerdo con la *intención* con la que se escribió cada respuesta, que es la opinión de otro modelo. Sirve exactamente para dos cosas: ejercitar todo el camino del reporte antes de que tú inviertas una hora, y detectar que el juez esté groseramente roto mientras todavía sale barato arreglarlo. El reporte lo dice en mayúsculas cada vez que corre en ese modo, para que nadie lo cite después como si fuera el resultado.

Dicho eso, hay una asimetría en esos números que sí me parece señal, y es preocupante. El juez aprobó siete respuestas que la intención decía que estaban mal, y reprobó **cero** que la intención decía que estaban bien. Es un sesgo indulgente sistemático. Y de los dos modos de fallar, ese es el caro: promover a alguien sin evidencia hace más daño que pedirle que lo intente otra vez.

## Dos cosas que corregí de mí mismo

La primera: implementé la compuerta **más estricta de lo que tú la fijaste**. Tú dijiste "ochenta por ciento con intervalo reportado", y yo la programé exigiendo que el límite inferior del intervalo llegara al ochenta. Eso es otra cosa, y bastante más dura: con sesenta y nueve ítems habría hecho falta un noventa y dos por ciento observado para pasarla. No me toca endurecer tu criterio por mi cuenta. Ya está como tú lo pusiste, sobre la estimación puntual, con el intervalo impreso al lado y, cuando el límite inferior no llega, una línea que dice cuántos ítems harían falta para cerrar esa brecha. Así la diferencia entre "pasó" y "está demostrado" queda a la vista en vez de esconderse en un número.

La segunda es de contenido. La rúbrica de la pregunta de la pendiente tiene tres puntos, y dos de ellos —el intercambio de tres litros por un kilo, y la conexión con el precio relativo— se solapan casi por completo. Dos auditores lo señalaron por su cuenta, y en los datos aparece: ese es el punto de rúbrica con peor acuerdo de todos, setenta y seis por ciento, muy por debajo del resto. **No es un problema del juez, es un problema de la rúbrica**: pide dos veces casi lo mismo, así que dos correctores humanos tampoco coincidirían. Te lo dejo señalado en vez de arreglarlo yo, porque decidir qué cuenta como "conectarlo con el precio relativo" es tuyo, no mío.

Y antes de todo esto, leyendo el banco, encontré un key point que decía en los dos idiomas "gastar todo en café no involucra el precio del café". Es exactamente al revés: el intercepto del jugo es la esquina donde se gasta todo en jugo. Como los key points son la rúbrica que ve el juez, esa línea habría premiado justo la confusión que la pregunta existe para detectar. Corregido.

## Lo que necesito de ti

Etiquetar los sesenta y nueve ítems. Es lo único que hace que el hito tres signifique algo, porque tu etiqueta es la única verdad contra la que se mide el juez.

Se hace en el terminal, con un comando. Te muestra la pregunta, la respuesta del alumno, y te pregunta punto por punto de la rúbrica si el alumno dijo eso, y después si muestra alguno de los errores del catálogo. Guarda después de cada ítem, así que puedes cortar cuando quieras y volver con el mismo comando. Calculo entre media hora y tres cuartos.

Dos detalles que no son de comodidad. **El orden viene barajado** con semilla fija: si los ítems llegaran agrupados por tipo de error, etiquetarías por patrón en vez de por lectura, y el acuerdo saldría inflado por una razón que no tiene nada que ver con el juez. Y **nunca vas a ver para qué fue escrita cada respuesta**: el gold set guarda esa intención, pero el programa no te la muestra. Si la vieras, "el juez concuerda con Kristian" pasaría a significar, sin que nadie lo note, "el juez concuerda con quien redactó el fixture".

## La limitación que no quiero que se nos olvide

Las sesenta y nueve respuestas las escribieron modelos, no alumnos. Eso mide si el juez concuerda contigo, que es lo que el hito pregunta. Pero **no** mide si funciona con cómo escribe un alumno de verdad, que es más corto, más desordenado y más ambiguo que cualquier cosa que un modelo invente cuando le pides que imite a un alumno.

Cada ítem lleva marcada su procedencia y el reporte lo dice arriba de todo, cada vez. La prueba real es la primera cohorte. Hasta entonces, ese número se cita con la salvedad pegada.
