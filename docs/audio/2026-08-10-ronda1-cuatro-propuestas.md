# Ronda 1 cerrada: las cuatro propuestas

Kristian, ya están las cuatro propuestas. Te cuento qué pasó, dónde coinciden, dónde se pelean, y qué encontró Fable que yo había escrito mal.

## Empiezo por el error, porque es mío

Fable revisó el código de AudioExplainer y encontró que mi brief mentía. Yo escribí que el transcript viene sincronizado con límites de palabra de Edge. Es falso. Fui a verificarlo: el código pide sentence boundary, no word boundary, y los archivos reales dicen granularidad de oración.

Esto importa, y no es un detalle cosmético. Mi propia propuesta apoyaba el resaltado de fórmulas en tener timing palabra por palabra. Con granularidad de oración eso no se puede hacer tal como lo escribí. La buena noticia es que para cues de gráfico y para checkpoints, la oración basta y sobra, siempre que el guion se escriba con la regla de que cada elemento visual tenga su propia frase. Y si algún día quieres karaoke por palabra, Edge sí lo emite; es una extensión acotada de AudioExplainer, pero es trabajo real que hoy no está hecho. Ya corregí el brief.

## Dónde coinciden los cuatro, sin haberse visto

Esto es lo más informativo de todo el ejercicio, porque escribieron a ciegas.

Primero: los cuatro llegamos a la misma abstracción para la generación al vuelo que quieres después. Una interfaz que resuelve el contenido y que hoy lee de disco y mañana lo genera. Yo la llamé ConceptBundle, Codex la llamó DeliveryAssetProvider, Fable la llamó PackSource, y Agy la planteó como get media. Que cuatro modelos de tres proveedores distintos converjan a ciegas en la misma frontera es evidencia fuerte de que es la correcta.

Segundo: los cuatro rechazamos la burbuja de chat y proponemos panel lateral, con el mismo argumento. La burbuja tapa el gráfico justo cuando el estudiante lo está manipulando. Fable lo refinó más que nadie con un dock de tres estados: oculto durante el video con solo un botón de preguntar, pasivo durante los ejemplos, y activo en los checkpoints. Yo diría que esa es la mejor versión de la idea que teníamos los cuatro.

Tercero: los cuatro proponemos tabla de remediación determinista, no dejar que el modelo decida. Y el orden coincide: socrática primero, luego cambiar de representación, luego bajar a caso numérico, y humano al final.

## Dónde se pelean de verdad

El desacuerdo grande es el backend. Agy y Fable dicen Python con FastAPI. Codex y yo dijimos TypeScript. El argumento de Fable es el más fuerte de los cuatro: el pipeline de contenido ya es Python, porque AudioExplainer y manim lo son, y el destino eventual, InteractiveEduHub, es Django. Es un buen argumento y creo que me gana.

Fable además propone frontend sin framework, TypeScript puro, con presupuesto de doscientos cincuenta kilobytes comprimidos. Su razonamiento es directo: tu criterio cinco, el de máquinas viejas, se gana no cargando un framework. Ninguno de los otros tres fue tan lejos.

Segundo desacuerdo: cuántas sub habilidades. Agy propone siete, yo once, Fable doce, y Codex veinte. Codex incluye habilidades de integración para no declarar que alguien domina los dos conceptos sin poder combinarlos, que es una idea que a los demás se nos escapó. Pero veinte para un proof of concept puede ser sobre especificación.

Tercer desacuerdo: el tiempo por prototipo del bake off. Agy dice cuatro horas, Fable seis, Codex ocho más cuatro de preparación común. Yo no di número, y ahí tenían razón en que hacía falta.

## Las tres ideas que más me gustaron y no eran mías

La primera es de Fable, y es la que más me convenció de todo el ejercicio. Propone que las cuatro opciones del bake off usen el mismo empetres y la misma línea de tiempo, no solo el mismo guion. O sea, controlar el timing, no nada más el texto. Y que cada prototipo se entregue corriendo dentro de la aplicación real, con los checkpoints funcionando, en vez de como cuatro demos sueltas. Eso convierte el bake off en una comparación limpia del producto, y hace que descartar una opción cueste borrar un adaptador en vez de reescribir la app.

La segunda también es de Fable, y es astuta por lo barata. Para medir el desfase entre audio y video en cualquier máquina, propone que el guion diga la palabra ahora en un momento exacto y que en ese instante el visual emita un destello de un solo cuadro. Grabas la pantalla con el celular a treinta cuadros por segundo y ya tienes el desfase real con precisión de treinta y tres milisegundos, sin instalar absolutamente nada. Eso resuelve tu criterio cinco en equipos ajenos y viejos, que era justo lo difícil de medir.

La tercera es de Codex: separar la evaluación determinista de la del modelo. Las numéricas, las de opción múltiple y las de manipulación del gráfico se corrigen con código, y el modelo solo juzga las respuestas abiertas. Eso reduce muchísimo la superficie donde el juez puede alucinar. Yo no fui tan explícito y su versión es mejor que la mía.

Hay una cuarta que menciono porque es tuya y nadie más la vio: Fable propone que el catálogo de errores conceptuales quede explícitamente fuera de la generación automática. El catálogo es la ontología fija que hace comparables a los estudiantes entre sí. El modelo puede generar guiones, ejemplos y preguntas contra ese catálogo, pero nunca el catálogo mismo. Me parece correcto y protege exactamente lo que pediste en tu decisión nueve.

## Un desacuerdo que quiero marcarte

Sobre el criterio de éxito. Agy se conforma con que el camino feliz funcione de punta a punta. Codex y yo exigimos algo más duro: que el diagnóstico del juez coincida con el tuyo como experto. Yo propuse que etiquetes diez respuestas a ciegas y comparemos. Codex propone noventa por ciento de concordancia y ochenta y cinco de efe uno en detección de errores conceptuales. Fable propone setenta y cinco por ciento y, lo más importante, dice qué hacer si falla: si la concordancia contigo baja del ochenta, el juez de respuestas abiertas deja de decidir el dominio y se queda solo como retroalimentación, y el diagnóstico pasa a apoyarse en los distractores de opción múltiple y en la manipulación del gráfico, que son deterministas.

Creo que Agy se queda corto aquí y que es el punto donde más me jugaría. Si el juez no coincide contigo, nada de lo demás importa.

## Lo que sigue

Ahora viene la ronda dos, la crítica cruzada, donde cada uno ataca las propuestas de los otros tres. Ahí Fable ya entra como agente independiente de verdad por línea de comandos, porque encontré por qué fallaba: no era el sandbox como te dije al principio, era que yo había escrito mal su configuración de despertado. Le faltaban los parámetros de streaming, así que el proceso no emitía ni un byte hasta terminar y coord lo mataba a los cinco minutos creyendo que estaba bloqueado. Lo saqué de tu propio repositorio de AIstigmergy, donde ya lo tenías bien.

Una cosa que quiero decirte con claridad: la propuesta de Fable de esta primera ronda la produjo un subagente que yo lancé, no el agente de línea de comandos. Le prohibí explícitamente abrir el hilo de coordinación y confirmó que no lo hizo, así que la ceguera se mantuvo. Pero su voz pasó por mí, y las de Codex y Agy no. Esa asimetría queda registrada en el archivo de decisiones, porque en un ejercicio cuyo valor depende de la independencia, esconderla sería hacer trampa.
