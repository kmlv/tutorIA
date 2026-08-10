# Súper-plan cerrado: qué decidieron los cuatro y qué te toca a ti

Kristian, terminaron las tres rondas. Te cuento el resultado, los tres desempates que te tocan, y una cosa incómoda sobre el proceso que prefiero decirte de frente.

## Lo más informativo del ejercicio

Antes que nada, esto: en la primera ronda, escribiendo a ciegas, sin verse entre ellos, los cuatro modelos llegaron por separado a las mismas tres conclusiones.

La primera es la frontera para la generación al vuelo que quieres después. Cada uno le puso un nombre distinto, pero es la misma interfaz. La segunda es el rechazo de la burbuja de chat a favor del panel lateral, y con idéntico argumento: la burbuja tapa el gráfico justo cuando el estudiante lo está manipulando. Y la tercera es que la remediación debe ser una tabla determinista y no una decisión del modelo, con el mismo orden de escalada en los cuatro.

Cuatro modelos de tres proveedores distintos convergiendo a ciegas es lo más fuerte que produjo todo esto. Cuando cuatro razonamientos independientes caen en el mismo sitio, o los cuatro comparten un sesgo, o el sitio es el correcto.

## Los cuatro desacuerdos quedaron resueltos

El backend es Python con FastAPI, cuatro a cero. Codex y yo cambiamos de voto. Y el argumento que nos ganó no fue afinidad de lenguaje, sino algo más agudo de Fable: la generación al vuelo significa que el runtime tiene que invocar el pipeline, y el pipeline es AudioExplainer y manim, o sea Python. En TypeScript eso obliga a levantar un servicio Python aparte, con frontera de red y despliegue propio, justo el día en que generar debería ser barato.

Las sub habilidades quedaron en doce núcleo más tres de integración que no bloquean el cierre. Codex se retractó de sus veinte cuando le mostramos el daño concreto: con veinte, cerrar los dos conceptos exige unas cuarenta respuestas juzgadas, o sea una sesión de hora y media que ningún estudiante termina. Y Agy subió de siete a doce cuando le señalamos que con siete no había dónde registrar la confusión más común del tema, la de creer que la línea presupuestaria es el conjunto factible.

El timebox quedó en seis horas por opción, con el guion, el audio y la línea de tiempo como costo compartido pagado una sola vez. Y el criterio de éxito quedó en concordancia medida contigo, con contingencia pre registrada por si falla. Agy concedió ese punto, que era donde yo más me había jugado.

## Las tres cosas que te toca decidir

La primera y más interesante. Codex sostiene que pausar automáticamente en un checkpoint contradice tu decisión once, la de que el estudiante elige cuándo pausar. Fable, Agy y yo lo leímos distinto: que tu decisión gobierna que el tutor no robe el control durante la reproducción, no la estructura del guion.

El argumento de Fable es bueno: un checkpoint no es una pausa impuesta sobre contenido en curso, es el final guionado de un segmento. La narración misma hace la pregunta y ahí se acaba la oración, así que no hay nada que el estudiante se pierda. Y la alternativa de anunciar sin detener da lo peor de ambos mundos, porque la narración sigue hablando por encima de su propia pregunta.

Va tres a uno, pero es interpretación de tu intención, no cuestión de votos. Por eso te lo paso. Si dices que la decisión once sí aplica a los checkpoints, el cambio es un condicional, no un rediseño.

La segunda es el umbral del gate de concordancia. Codex pide ochenta y cinco por ciento de acuerdo contigo, Fable y yo proponemos ochenta. Mi recomendación es ochenta para el proof of concept y subir a ochenta y cinco antes de ponerlo frente a estudiantes reales.

La tercera es cómo medir la detección de errores conceptuales. Codex propone efe uno macro por encima de cero coma setenta y cinco. Fable y yo argumentamos que con trece categorías y un conjunto realista de treinta respuestas etiquetadas, varias categorías quedan con uno o dos ejemplos, y un efe uno macro sobre eso es ruido: un solo caso mueve la métrica decenas de puntos. Proponemos reportar el recall de cada error conceptual con su ene al lado, sin promediar. Si quieres una sola cifra, hay que subir el conjunto a unas ciento treinta respuestas etiquetadas por ti a mano, y eso es mucho pedirte.

## La parte incómoda

Registré once errores cometidos durante el proceso, en la sección once del plan. Seis son míos, y yo soy quien redactó la síntesis. Te los digo porque el plan se apoya en ellos.

El más serio: mi brief afirmaba que AudioExplainer sincroniza palabra por palabra. Es falso, sincroniza por oración. Fable lo detectó leyendo el código y yo lo verifiqué. Importaba porque mi propia propuesta apoyaba en ese timing el resaltado de fórmulas, que no se puede hacer así.

El segundo: mi criterio de éxito decía que el mastery se mueve en cuatro de seis sub habilidades. Moverse incluye moverse hacia abajo, o sea que un estudiante que empeora habría satisfecho mi criterio. Lo cazó Codex.

El tercero: le puse un blocker a Fable diciendo que su presupuesto de doscientos cincuenta kilobytes no cerraba con KaTeX, y mezclé bytes crudos con bytes comprimidos en la aritmética. Fable me corrigió el número, pero llegó a la misma conclusión por otra vía que yo no había visto, que es que las fuentes tipográficas no se comprimen. Lo resolvió mejor de lo que yo había propuesto: renderizar las fórmulas en tiempo de compilación y no embarcar la librería en absoluto. Detalle importante: ninguno de los dos números está medido, porque el sandbox bloqueó la descarga del paquete. Quedó marcado para medir en el primer hito, antes de que ese presupuesto sea un criterio de corte.

Y el error de proceso: el despertado de Fable falló en la primera ronda y yo te dije que era el sandbox. No lo era. Yo había escrito mal su configuración, de memoria, en vez de copiar el patrón que tú ya tenías funcionando en tu repositorio de AIstigmergy. Le faltaban los parámetros de streaming, sin los cuales el proceso no emite nada hasta terminar y coord lo mata a los cinco minutos creyendo que está bloqueado.

Eso tuvo una consecuencia que quiero que sepas: la propuesta de primera ronda de Fable la produjo un subagente que yo lancé, no el agente independiente. Le prohibí leer el hilo y confirmó que no lo hizo, así que la ceguera se mantuvo intacta. Pero su voz de esa ronda pasó por mí, y las de Codex y Agy no. En un ejercicio cuyo valor entero depende de la independencia, esa asimetría hay que decirla, no esconderla. Desde la segunda ronda Fable ya entró como agente de línea de comandos de verdad.

## Qué sigue

Mandé el plan a ronda de firma. Les pedí específicamente que verifiquen que sus posiciones y sus disensos están representados fielmente, porque distorsionar el argumento de otro es el fallo más probable de un lead que también fue autor, y ese soy yo.

Nada se implementa hasta que tú desempates los tres puntos y autorices el cambio de solo propuestas a implementación. El presupuesto de coord sigue bloqueado en modo propuesta, así que ningún agente puede escribir código aunque quisiera.
