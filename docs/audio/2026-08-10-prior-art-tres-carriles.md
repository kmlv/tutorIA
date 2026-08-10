# Prior art: lo que ya resolvió el mundo, en tres carriles

Kristian, me pediste investigar sistemas de aprendizaje parecidos al nuestro, con Codex y Agy ayudando, y dijiste una cosa concreta: cuidado no se pisen los pies. Te cuento cómo lo monté, qué salió, y qué se me cayó por el camino.

## Cómo evité el pisotón

Abrí una tarea nueva y la partí en tres carriles que no se tocan. Codex se llevó el motor: cómo deciden por dentro los sistemas de tutoría inteligente que un estudiante domina algo, cuándo remediar y cuándo parar. Agy se llevó la superficie: quién ya explica matemáticas con narración, gráfico y manipulación directa, a qué costo y en qué equipos corre. Yo me quedé con el juez: los tutores con inteligencia artificial que ya están desplegados con estudiantes reales.

Tres reglas, y son las que hicieron el trabajo. Cada sistema tiene un solo dueño. Cada agente escribe un único archivo, el suyo, y nadie toca el del otro. Y cada uno recibió una ficha de reclamo con una sección que nombra explícitamente los sistemas que son del otro, para que la frontera no dependiera de la intuición de nadie.

Las fronteras que sabía que iban a rozar las resolví antes de empezar, no sobre la marcha. El motor de ejercicios de Khan Academy es de Codex; Khanmigo, que es su tutor conversacional, es mío. El modelo adaptativo de Duolingo es de Codex; sus funciones de inteligencia artificial son mías. Manim es de Agy, aunque aparezca en el bake-off.

Resultado: ninguna colisión. Los tres lo declararon por escrito y es consistente con lo que hay en los archivos. Y el plan firmado quedó congelado todo el rato: nadie tocó una línea.

## El hallazgo con más peso, y llegó por dos caminos que no se hablan

Este es el que quiero que te lleves.

Codex, desde los registros de los sistemas clásicos de los años dos mil: en ASSISTments, pedir una pista invalida esa oportunidad para la racha de dominio. En Cognitive Tutor, la respuesta que sale después de agotar las pistas no cuenta como evidencia. Y los dos intentos serios de castigar el hacer trampa fracasaron en lo que importa. Uno bajó la trampa observada de treinta y tres por ciento a dieciocho, sin ninguna mejora de aprendizaje. El otro redujo el ir directo a la última pista de setenta y dos por ciento a cuarenta y seis, con una significancia altísima, y tampoco mejoró el aprendizaje. Lo único que se asoció con ganancias fue volver a medir el paso que el estudiante se saltó, con un ejercicio nuevo.

Yo, desde un ensayo aleatorizado sobre modelos de lenguaje publicado en PNAS, con mil estudiantes de secundaria y tres grupos. Con el chat sin restricciones, los estudiantes iban cuarenta y ocho por ciento mejor durante la práctica asistida, y diecisiete por ciento peor en el examen sin ayuda. Con la versión tutorizada, con salvaguardas, iban ciento veintisiete por ciento mejor en práctica, y planos en el examen. Cero.

Una literatura de registros de comportamiento de hace veinte años y un ensayo aleatorizado sobre inteligencia artificial de este año, que no se citan entre sí, llegan a lo mismo: el rendimiento del estudiante con el tutor delante no dice nada sobre si aprendió.

Y de ahí sale el problema concreto de tu proyecto. Tú cerraste, con buena razón pedagógica, que nunca hay nota. El efecto secundario que no buscabas es que todo lo que vamos a medir ocurre con el tutor delante. Un tutorIA que produjera exactamente el resultado del grupo sin salvaguardas se vería, en nuestra telemetría actual, idéntico a uno excelente. No tenemos ninguna señal capaz de detectar ese fallo.

## Lo que el prior art confirma de tu plan

Esto es barato de decir y valioso de saber. Tu decisión de que el tutor interrumpa en puntos diseñados del guion, en vez de dejar un chat abierto, queda respaldada por el dato más contundente que encontré: Khanmigo, el despliegue más grande que existe, consigue que solo el quince por ciento de los estudiantes elegibles lo use de forma activa, pese a acumular ciento ocho millones de interacciones. Y lo están rediseñando precisamente para que esté visible durante la tarea en vez de esperar a que el estudiante pregunte. Tu decisión doce ya era la correcta; ahora tiene el número que le faltaba.

También quedan respaldadas tu decisión sobre el catálogo de errores conceptuales con distractores que los delatan, que es exactamente el diseño de las preguntas diagnósticas de Eedi; tu cuarta vía de remediación, marcar para revisión humana, que resultó ser la de mejor evidencia de todo mi carril; y tu exigencia de alternativa textual al gráfico, para la que PhET tiene un marco de descripciones de estado ya construido.

## Lo que Codex encontró mal calibrado

Dos números de tu plan no tienen base empírica, y no la tienen porque no existe. No hay umbral de dominio ni tope de intentos universal. MATHia usa cero coma noventa y cinco, pero promociona al agotar un máximo de problemas, no de oportunidades por habilidad. ASSISTments usa tres correctas seguidas y pausa a las diez preguntas. Khan usa estados discretos que además pueden bajar.

La prueba de que el corte fabrica el resultado es preciosa: dos definiciones razonables de patinar en el sitio, aplicadas a los mismos datos, etiquetaron seis coma seis por ciento y veinticuatro coma dos por ciento. Es decir, casi todo lo que mides depende de dónde pusiste la raya.

Codex propone retirar el intentos mayor o igual a seis del plan y sustituirlo por tres salidas distintas: dominio provisional, presupuesto agotado, e indeterminado. Y tratar las doce sub habilidades más tres de integración como hipótesis, no como decisión.

## Lo mejor salió de desconfiar

A Agy le verifiqué los números en vez de aceptarlos. Dos venían etiquetados como verificados y no lo estaban: un costo de cien mil dólares y quinientas horas por simulación de PhET, que no aparece en ninguna fuente pública, y un tiempo de respuesta en navegadores viejos que nadie ha medido. Aceptó los dos y corrigió. Sus conclusiones sobrevivieron; las cifras no.

Pero al verificar apareció el hallazgo más directo de toda la tarea: EconGraphs, de Christopher Makler, profesor de Stanford y autor del material de Econ cincuenta, que es micro intermedia, tu mismo nivel. Unos trescientos cincuenta gráficos interactivos cuya sección de teoría del consumidor cubre literalmente tus dos conceptos. Embebibles sin necesidad de cuenta. Y su motor, que se llama KGJS, tiene licencia MIT y renderiza diagramas interactivos definidos como JSON, usando KaTeX para las fórmulas.

Eso cumple a la vez cuatro cosas que tú pediste por separado: el árbol del documento para accesibilidad y equipos modestos, KaTeX, una abstracción declarativa, y sobre todo un formato JSON, que es justo lo que un modelo de lenguaje puede generar al vuelo, que es el futuro que declaraste. Ninguna de tus cuatro opciones del bake-off tiene esa combinación. Ojo con la frontera legal: el motor es abierto, el contenido de Makler no.

## Existe un inventario para tu materia exacta, y no lo estábamos usando

Este es el hallazgo con la única prisa real de todo el trabajo, y apareció al pasar mi propio carril por verificación adversarial.

Se llama IESA Micro, del Cornell Suite, y es el equivalente del Force Concept Inventory pero para microeconomía intermedia. Su sección tres, El problema del consumidor, cubre literalmente tu alcance con veintidós objetivos de aprendizaje: conjunto presupuestario y cómo cambia, pendiente como costo de oportunidad, preferencias y utilidad, tangencia, soluciones de esquina, Slutsky. Correlaciona con la nota del examen final en cero coma cuarenta y cinco, cero coma cincuenta y seis y cero coma treinta y tres, en tres cohortes.

Pero lo que de verdad importa no son sus preguntas, es cómo las construyeron. Primero escribieron los objetivos de aprendizaje, y solo después los ejercicios. Los sometieron a profesores de dentro y de fuera de Cornell. Y luego hicieron entrevistas en voz alta con estudiantes que ya habían cursado la materia, y de ahí sacaron los distractores. O sea, sus opciones incorrectas vienen de errores observados en estudiantes de carne y hueso. Es exactamente la fuente de evidencia que nuestro catálogo, escrito por cuatro modelos de lenguaje, no tiene.

Se pide gratis, por formulario, y el tiempo de espera es desconocido. Por eso corre prisa: si llega, sus ejercicios de elección del consumidor te sirven de conjunto de referencia ya etiquetado, y eso reduce muchísimo lo que tendrías que etiquetar tú a mano.

## Y ahora la parte donde me equivoqué yo

Sometí la síntesis a los dos y les pedí explícitamente que intentaran tumbar mi conclusión más fuerte. Codex lo hizo, y tenía razón.

Yo había escrito que el bake-off mide la mitad barata del costo, y que lo caro es el modelo pedagógico. Codex me devolvió lo siguiente: lo que la evidencia sostiene es que el bake-off omite el costo de autoría pedagógica. Eso es una omisión. Decir cuál mitad es la barata es una ordenación comparativa, y ningún carril midió horas de nada. No hay unidad de costo común entre los tres. Y peor: mi propio documento cita, dos secciones más arriba, que una simulación de PhET consume equipos profesionales durante meses. O sea, me estaba contradiciendo dentro del mismo texto.

Lo acepté y lo corregí. La conclusión nueva es más modesta y más útil: el costo de escribir el modelo pedagógico es material, hoy no está presupuestado en tu plan, podría dominar el costo del concepto veinte, y medirlo debería formar parte del bake-off en vez de darse por supuesto en cualquiera de las dos direcciones.

Hay un detalle que merece registro. Agy había respaldado explícitamente mi versión original. Codex la refutó. No promedié: me puse del lado de Codex, porque la objeción de Agy era sobre si sonaba plausible y la de Codex era sobre qué puede sostener la evidencia, que es el estándar que yo mismo había impuesto en el encargo.

Y hubo una segunda ronda de correcciones, también contra mí. Mi propio carril se rehízo con verificación adversarial: ciento sesenta y dos afirmaciones pasadas por verificadores independientes instruidos para refutarlas. Ciento cuarenta y tres confirmadas, nueve refutadas, diez no verificables. Y dos de esas refutaciones me obligaron a corregir la síntesis.

La primera es la que más te afecta. Yo había escrito que no existe ningún catálogo publicado de errores conceptuales para tus dos conceptos, y que lo tendrías que escribir tú desde cero. Es falso: existe IESA Micro, del que acabo de hablarte. Lo cierto, y es más preciso, es que ningún instrumento de economía le asigna un identificador estable al error conceptual; lo incrustan dentro del texto del distractor sin nombrarlo. Ese contrato de identificadores, que nosotros sí necesitamos, no tiene precedente público en economía. Es la oportunidad y el riesgo a la vez, porque nadie ha validado que esa taxonomía sea estable.

La segunda: yo había dicho limpiamente que el juez automático queda por debajo del acuerdo entre dos humanos. Los dos números no son comparables así, porque uno se mide pareja a pareja y el otro contra un consenso agregado. La consecuencia práctica cambia: el proyecto tiene que medir su propio techo humano en vez de importarlo de otra disciplina.

Y el patrón vale la pena. Tres rondas de corrección, las tres sobre afirmaciones mías, ninguna sobre el trabajo de Codex o de Agy. Lo que venía con fuente primaria aguantó; lo que era inferencia mía sin medición, no. Es el mismo dato que ya salió en la tarea anterior, y es un dato sobre el redactor.

## Un fallo de la herramienta que te toca saber

Cuando anoté en el archivo de decisiones pendientes que faltaba tu autorización, coord dejó de poder despertar a Codex. Al haber un asunto abierto para ti, cambia el modo de arranque a sesión nueva, y por ese camino el proceso hijo muere a los tres segundos sin escribir un solo byte. Descarté que fuera la configuración ejecutando yo mismo el comando resuelto, que funciona perfectamente.

Lo peligroso no es el fallo, es el síntoma: desde el hilo de coordinación es indistinguible de un agente que decide ignorar el encargo. Solo lo delata la duración en el registro de trazas, tres mil doscientos milisegundos frente a los ochenta y cinco mil de un despertar sano. Lo desbloqueé con un arranque manual documentado. No cerré tu asunto pendiente para arreglarlo, porque eso sería borrar una decisión tuya para tapar un fallo de herramienta.

## Lo que te toca decidir

Cuatro cosas, en el archivo de asuntos pendientes, y ninguna bloquea nada. Pero una tiene prisa.

Primera. El chequeo de transferencia: uno o dos ejercicios nuevos al cerrar un concepto, sin ayuda, sin nota, y sin presentarse al estudiante como evaluación, cuyo resultado alimente solo tu diagnóstico de instructor. Es lo único que distingue que el estudiante aprendió de que el tutor resolvió por él. Roza tu decisión de que nunca hay nota, y por eso no lo apliqué. Si lo rechazas, conviene registrar qué se pierde: el proyecto no podrá afirmar que enseña, solo que gusta.

Segunda. Si el motor KGJS entra como quinta opción del bake-off.

Tercera. Quién escribe la capa de configuración de los gráficos, tú o el modelo. Es la pregunta que de verdad fija el costo del concepto veinte, y hoy el plan no la responde.

Y cuarta, la que corre prisa: si pedimos hoy el cuestionario de IESA Micro. Es gratis y por formulario, pero el tiempo de espera es desconocido, así que cada día que pasa sin pedirlo es un día que podría bloquear el primer hito.

El plan sigue intacto. Nada de esto se aplicó.
