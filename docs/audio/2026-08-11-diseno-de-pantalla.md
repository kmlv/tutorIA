# El rediseño de la pantalla: qué dijeron los cuatro

Kristian, la consulta terminó. Cuatro propuestas independientes y una síntesis. Te cuento qué salió, qué descarté y por qué, y las dos cosas que te tocan decidir.

## Los cuatro llegamos al mismo diagnóstico

Y creo que vale la pena decirlo con tus palabras, porque diste en el clavo sin nombrarlo: la pantalla muestra el **final** de una cadena y esconde el medio.

El estudiante ve una recta sobre unos ejes que dicen café y jugo, y se le pide que ya crea tres traducciones que la pantalla nunca ejecuta. Que un bien físico se convierte en una cantidad medida. Que una cantidad medida se convierte en un símbolo. Y que un par de símbolos se convierte en un lugar del plano.

Esas tres traducciones **son** el concepto. La línea presupuestaria es la última consecuencia. Construimos la consecuencia y nos saltamos el concepto. Y el panel lateral se siente como un añadido porque estructuralmente lo es: comenta el gráfico en vez de participar en la cadena.

## La estructura en la que coincidimos los cuatro

Tres bandas horizontales. Arriba, alrededor de un dieciocho por ciento, un libro mayor con una tarjeta por bien y, entre las dos tarjetas, la ecuación. En el medio, unos dos tercios, el escenario con el gráfico. Y abajo, un quince por ciento, los subtítulos a todo lo ancho, siempre presentes.

La tarjeta de cada bien es la traducción hecha permanente. Se lee de izquierda a derecha: el dibujo del bien, luego "se mide en kilos", luego el símbolo equis uno, luego el precio. Y no desaparece nunca, así que en cualquier momento posterior una mirada a la izquierda recupera qué significa equis uno sin volver a deducirlo.

## Las tres ideas que me llevo, y cada una es de otro

La primera es de Fable y es la más fuerte de toda la consulta. La llama el invariante de procedencia, y dice: **nada aparece de la nada**. Todo objeto que importa entra a la pantalla una vez, se queda, y cualquier aparición posterior suya es visiblemente derivada de donde ya vive. La etiqueta del eje no simplemente está: el estudiante ve salir la ficha de la unidad desde la tarjeta del café y aterrizar en el eje. El número tres de la ecuación llega volando desde la etiqueta de precio.

Y es más fuerte que la mía por una razón precisa que quiero reconocer. Yo había propuesto resaltar el mismo término en tres sitios a la vez, pero eso es un efecto que se aplica en momentos elegidos. Lo de Fable es una regla que obedece el diseño entero. Además trae su propia restricción falsable: el fotograma final de cada momento tiene que llevar el significado completo sin la animación. Eso convierte el modo de movimiento reducido en un caso de primera clase en vez de una degradación.

La segunda es de Codex, y responde literalmente a lo que pediste. La ecuación dimensional: mostrar primero tres dólares por kilo, por equis uno kilos, más un dólar por litro, por equis dos litros, igual a cien dólares. Y luego la forma compacta. Tú pediste "las magnitudes que van dentro de la ecuación", y esto pone las unidades **dentro**, no al lado. De paso hace que la unidad de la pendiente, litros por kilo, sea algo que se lee en vez de algo que se afirma.

Codex aporta además dos cosas finas: que el vínculo bien-símbolo lleve también una forma y no solo un color, para que funcione con daltonismo; y que el cierre colapse la lección en una cadena de cinco instantáneas de izquierda a derecha.

La tercera es mía, y es solo el mecanismo: como las fórmulas ya se renderizan en tiempo de compilación, se puede envolver cada término en una etiqueta con identificador estable. Sin eso, nada del resaltado cruzado es posible. Cuesta cero en tiempo de ejecución.

## Lo que rechacé, y por qué

Agy propuso usar emojis para los bienes, con el argumento de que cuestan cero bytes. Lo rechacé por tres razones y la tercera es la seria. Se ven distintos en cada sistema, justo en los equipos viejos que protege tu criterio cinco. No se pueden teñir con el tema. Y los lectores de pantalla los anuncian por su nombre Unicode: el emoji de naranja se lee "mandarina", que es el bien equivocado.

También rechacé su propuesta de que los subtítulos sean una línea destilada y que la narración literal vaya solo a los lectores de pantalla. Eso parte la experiencia en dos: el estudiante que ve lee un texto y el que escucha oye otro. Y una línea destilada no es un subtítulo, es un encabezado. Como ya tenemos los tiempos por oración, la frase literal viene sincronizada gratis en los dos idiomas.

Y una tercera cosa de Agy que no rechacé sino que marqué: adoptó en silencio el cambio de equis uno y equis dos que mencionaste, mientras Codex y yo lo señalamos como pendiente. El problema no es cuál asignación es correcta. Es que tomar una frase dicha al pasar como especificación, sin preguntar, es exactamente el error que este proyecto lleva registrando desde el principio.

## Un fallo que encontró Fable y que explica media sesión

Esto no es de diseño, pero es importante.

Fable encontró que el script con el que los agentes deben publicar en el hilo **no existía en el repositorio**. El protocolo les dice que usen la herramienta interna o ese script; la herramienta interna rebota por permisos cuando corren sin interfaz; y el script vivía en el kit, no aquí. Yo lo invocaba por ruta absoluta y por eso nunca noté que para ellos no existía.

Eso explica un patrón que yo había estado tratando como tres incidentes sueltos. Explica por qué la firma de Agy en el plan se perdió en silencio mientras él reportaba haberla publicado. Yo había escrito en el archivo de lecciones que hay que verificar contra el hilo y no contra el registro del agente, o sea que traté el síntoma y nunca busqué la causa. Fable la encontró. Ya está arreglado.

## Lo que te toca decidir

Dos cosas.

La primera. Dijiste "onzas de café, equis dos" y "jugo de naranja, equis uno", que es **al revés** de como está el paquete, donde el café es el bien uno. Agy adoptó tu versión, Codex y yo la marcamos. Importa más de lo normal aquí, porque todo el rediseño consiste en hacer explícito ese vínculo: si el que tienes en la cabeza es el contrario al de la pantalla, el diseño falla justo contigo. Mi preferencia es débil: dejar el café como bien uno, porque pone el bien caro en el eje horizontal y la pendiente sale más inclinada que uno, lo que hace el intercambio más fácil de ver. Pero es tuya.

La segunda es cuánta coreografía quieres. El invariante de procedencia es la mejor idea de la consulta y también la más cara y la menos portable: en el bake-off, Manim y Remotion son pre-renderizados, así que reproducir esos vuelos es trabajo de animación real por cada concepto.

Hay tres niveles. Solo estados, con fundidos en vez de vuelos, que conserva todo lo que pediste pero pierde el "verlo ocurrir". Estados más los dos verbos baratos, que son transformar un símbolo y proyectar una consecuencia. O los cuatro verbos completos.

Yo recomiendo el intermedio. Transformar y proyectar son los que cargan las afirmaciones causales: un símbolo que cambia, y un término que proyecta su consecuencia geométrica. Los otros dos comunican sobre todo procedencia, y eso las tarjetas permanentes ya lo dicen sin moverse.
