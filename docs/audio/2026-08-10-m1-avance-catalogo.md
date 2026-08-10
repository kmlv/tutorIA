# Avance: el catálogo y el manifiesto ya están

Kristian, seguí con lo que no dependía de tu validación. Te cuento qué quedó y, sobre todo, dos cosas que aparecieron al construirlo y que necesitan tu ojo.

## Qué se construyó

El manifiesto del concepto ya existe. Tiene las seis sub habilidades de línea presupuestaria, cada una con su umbral, y el criterio de dominio actualizado con todo lo que salió de la investigación de prior art: tres aciertos consecutivos en vez de dos, evidencia en dos modalidades distintas, al menos un acierto sin ningún tipo de ayuda, y el tope de que el juez de lenguaje aporta como mucho una de las tres evidencias.

También metí ahí los parámetros de tu ejemplo, precio tres, precio uno, ingreso cien, en un solo lugar. Cambiarlos ahí debería bastar para regenerar el guión, el gráfico y los ejercicios numéricos. Eso no es cosmético: es exactamente la prueba del criterio dos del bake off, el de personalización al vuelo. Si cambiar un número obliga a tocar cinco archivos, ya sabemos que ese camino no escala.

Y el catálogo de errores conceptuales quedó escrito, con siete entradas para línea presupuestaria. Cada una tiene identificador estable, la señal observable que la delata, la pregunta socrática ya redactada, el caso numérico de respaldo, y el distractor de opción múltiple diseñado para que quien tenga ese error caiga justo ahí. Todo en los dos idiomas.

## Lo primero que quiero que sepas: un hueco de verdad

Al escribir el catálogo apareció algo que ninguno de los cuatro modelos había visto en las tres rondas de plan.

De las seis sub habilidades, hay una que se quedó sin ningún error conceptual asociado: la de plantear la ecuación e interpretar sus términos. Las otras cinco tienen entre uno y tres errores mapeados; esa tiene cero.

Eso puede significar dos cosas muy distintas y no quiero resolverlo adivinando. Una: que falte una entrada en el catálogo, y que sí exista una confusión típica al plantear la ecuación que simplemente no se me ocurrió. Dos: que esa sub habilidad no sea diagnosticable por separado, porque en la práctica un estudiante que plantea mal la ecuación lo revela al calcular los interceptos, y entonces sobra como sub habilidad independiente y habría que fusionarla.

Es literalmente el caso que Codex describió en la investigación: cuando dos sub habilidades siempre aparecen juntas, no se fusionan automáticamente, se marcan para fusión o rediseño, porque las dos salidas piden cosas distintas. Lo dejé marcado así en el manifiesto, y se decide con tus exámenes delante, no antes.

## Lo segundo: metí la pata y lo arreglé con un validador

Escribí el manifiesto, lo comiteé, y después lo validé. En ese orden. El archivo tenía YAML inválido, una clave suelta dentro de una lista, así que el commit entró roto.

En vez de solo arreglarlo, escribí un validador que ahora corre antes de comitear. Comprueba cuatro cosas: que el esquema de cada error conceptual esté completo y en los dos idiomas; que la integridad referencial funcione en las dos direcciones, o sea que ninguna sub habilidad apunte a un error que no existe y que ningún error apunte a una sub habilidad que no existe; que los puntos de control declarados en el manifiesto existan de verdad como marcas en los guiones de ambos idiomas; y que el criterio de dominio sea internamente coherente, por ejemplo que no pida más aciertos sin ayuda de los aciertos totales que exige.

Ahora mismo el paquete pasa con cero errores y un solo aviso, que es precisamente el hueco de la sub habilidad sin error conceptual.

## Lo que sigue pendiente de ti

Sigue siendo lo mismo, y no ha cambiado: escuchar el guión y decirme si suena a ti. Y pedir el cuestionario de IESA-Micro, que es lo único del proyecto que depende de un tercero y tiene una espera que no controlamos.

De mi lado, lo que queda del hito uno es el banco de preguntas: los ejercicios numéricos, los de opción múltiple con los distractores que ya están escritos en el catálogo, y las preguntas abiertas de los dos puntos de control. Eso puedo hacerlo sin ti. Después de eso el hito uno estaría cerrado salvo por tu validación.
