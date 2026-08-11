# El motor de dominio, y el bake-off que cambia una decisión de plata

Kristian, dos cosas construidas desde el último audio. Noventa y ocho tests en verde. Ninguna de las dos depende de tu etiquetado, que sigue siendo lo único que te espera.

## El motor de dominio

Es la pieza que consume al juez. Hasta ahora el criterio de dominio existía declarado en el pack pero no había código que lo evaluara, así que las respuestas se registraban y no pasaba nada con ellas.

Lo escribí para que se pueda discutir. Cada regla está enunciada y justificada, y todas salen del pack en vez de estar clavadas en el código, porque el criterio de dominio es una afirmación pedagógica y quien tiene derecho a hacerla eres tú, no un archivo.

### Por qué no usé BKT

El modelo obvio para esto es Bayesian Knowledge Tracing, y no lo usé. Necesita cuatro parámetros por habilidad —prior, aprendizaje, desliz, adivinanza— ajustados con datos. Nosotros no tenemos datos. Correr BKT con los valores por defecto de un paper produce un número que **parece** principiado y no lo es, y eso es peor que un estimador simple que admite lo que es.

Lo que uso es la media posterior de una Beta-Binomial con prior uniforme: aciertos más uno, sobre intentos más dos. Es transparente, no necesita ajustar nada, y es conservador cuando hay poca evidencia. Cuando haya transcripts reales, ajustar BKT contra ellos es un paso bien definido, y este estimador es la línea base que tendría que superar.

Hay un detalle bonito que salió solo. Con prior uniforme, exactamente tres aciertos de tres da cero coma ochenta, que es exactamente el umbral que fijamos. O sea que la evidencia mínima que permite la regla de la racha es también la mínima que permite la regla de la probabilidad. Las dos restricciones se encuentran en el mismo punto en vez de que una domine a la otra en silencio.

### Tres decisiones que quiero que sepas

La primera: **las modalidades, el mínimo sin andamiaje y el tope del juez se miden sobre la racha**, no sobre toda la historia. Es lo mismo que ya hacía el validador del pack. Si se contaran sobre todo, un alumno podría cumplir "dos modalidades" con dos respuestas separadas por veinte minutos y cuatro errores en medio, que no es lo que el criterio quiere decir.

La segunda: **una misconception está activa si lo último que el alumno hizo sobre ella fue mostrarla.** "Sobre ella" significa responder un ítem que la vigila. Una respuesta correcta a uno de esos ítems la limpia; equivocarse en otra cosa distinta no la limpia, porque fallar en otro sitio no es evidencia sobre esta. La alternativa —activa para siempre una vez diagnosticada— haría el dominio inalcanzable después de un solo error, y eso vuelve el criterio inservible en una lección de tres minutos.

La tercera es sobre el andamiaje, y ahí seguí lo que dice el esquema aunque la literatura sugiere algo más duro. Una respuesta correcta con ayuda cuenta como evidencia, pero al menos una de la racha tiene que ser sin ayuda. La lectura fuerte de la investigación de tutores inteligentes —que la evidencia obtenida con ayuda no cuente **nunca**— la puedes activar poniendo el mínimo sin andamiaje igual al largo de la racha. O sea, es un cambio de configuración, no de código. Me pareció importante que esa puerta quedara abierta sin tocar nada.

### La escalera de remediación

Cuando hay una confusión activa, hay cuatro peldaños. Primero la sonda socrática que el catálogo ya trae escrita. Si vuelve, otra representación, la que el catálogo dice para esa misconception. Si vuelve otra vez, bajar la dificultad. Y a la cuarta, revisión humana: el tutor deja de adivinar y levanta la bandera para el instructor, que es la señal que la decisión seis te prometía.

Y sube un peldaño por **repetición de la misma** confusión, no por errores totales. Un alumno que muestra dos confusiones **distintas** no ha fallado dos veces en lo mismo, y repetirle la misma remediación sería el tutor no escuchando.

Cada acción queda registrada con la regla que la produjo. La tabla ya tenía una columna para eso, y la razón es simple: una política que no puede explicar por qué hizo algo no se puede depurar ni defender ante un instructor que no esté de acuerdo.

### Dos endpoints, no uno

Separé la vista del instructor de la del alumno a propósito. La del instructor lleva los ids crudos del catálogo, los bloqueadores, las remediaciones. La del alumno lleva el ítem y, cuando hay una confusión en medio, la sonda socrática. Nada más. Hay un test que recorre la respuesta del endpoint del alumno buscando cualquier id del catálogo y falla si aparece uno.

Y hay un test que me importa más que los otros: sigue la política respondiendo siempre bien hasta llegar al dominio. Un selector que nunca propusiera el ítem que quita el bloqueo pasaría todos los tests unitarios y se colgaría exactamente ahí.

## El bake-off, que es una decisión de plata

Corrí los sesenta y nueve ítems del gold set por los tres modelos.

El caro, sol, ochenta y nueve coma nueve por ciento de acuerdo, ochenta y tres centavos. El intermedio, terra, noventa y uno coma tres, veintisiete centavos. Y el barato, luna, noventa y dos coma ocho, cuatro centavos.

Sí: **los baratos salieron mejor.** Y aquí es donde tengo que frenar, porque la lectura fácil de eso está mal.

Comparé los tres con la prueba correcta, que es McNemar exacta sobre los pares discordantes. No es lo mismo que mirar si los intervalos de confianza se solapan, y la diferencia importa. Los intervalos ignoran que los tres modelos vieron exactamente las mismas respuestas. Los ítems donde los tres coinciden no dicen nada sobre cuál es mejor, y son casi todos. Lo único informativo son los ítems donde uno acierta y el otro no.

Y hay cinco o seis de esos, de sesenta y nueve. El resultado es que los tres son **estadísticamente indistinguibles**. Pero con tan pocos discordantes la prueba casi no tiene potencia, así que "indistinguibles" significa que **este** gold set no los distingue, no que sean equivalentes. El reporte imprime esa salvedad sola, sin que nadie tenga que acordarse, porque "indistinguibles" leído rápido se convierte en "iguales" y esa es una conclusión más fuerte de la que el dato aguanta.

Dicho todo eso, el dato que sí es sólido es el otro: **el modelo caro cuesta veintidós veces lo que el barato**, y no hay evidencia de que compre nada. Cuando etiquetes, esa comparación se vuelve a correr contra tu verdad en vez de contra la intención, y ahí la decisión se toma con datos de verdad. Si aguanta, bajar el juez a luna te ahorra un factor de veintidós en el costo por alumno, que en un curso completo no es un detalle.

## Lo que sigue y lo que te espera

Sigo con el chat del tutor, que es la pieza del brief original que falta construir y tampoco depende de ti.

Lo que te espera cuando vuelvas son tres cosas. Etiquetar los sesenta y nueve ítems, que son unos treinta y cinco minutos y se puede cortar a la mitad. Decidir qué hacer con la rúbrica de la pregunta de la pendiente, que pide dos veces casi lo mismo y por eso es el punto con peor acuerdo de todos. Y decirme si commiteo: hay unos veinticinco archivos sin commitear porque no me lo pediste y no quise asumirlo.
