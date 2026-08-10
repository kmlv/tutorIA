# El plan completo, explicado

Kristian, esto es el recorrido por el plan que firmaron los tres revisores. Te lo cuento en el orden en que a mí me parece que se entiende, no en el orden en que está escrito. Y al final te digo dónde el plan es débil, porque estás por decidir si lo autorizas y para eso necesitas lo malo, no solo lo bueno.

## Qué construimos, en concreto

El ciclo por concepto tiene cinco tiempos. Primero el estudiante recibe el concepto en audio con gráficos y fórmulas, dos o tres minutos. Segundo, el tutor le da ejemplos, y no un número fijo: sigue dando hasta que el estudiante diga que ya. Tercero, el estudiante responde preguntas que nunca llevan nota. Cuarto, la inteligencia artificial va juzgando si está aprendiendo, y cuando detecta que no, remedia. Y quinto, se cierra con un resumen formativo, también sin nota.

Los conceptos del proof of concept son línea presupuestaria y curva de indiferencia. No son dos conceptos cualesquiera: se combinan en el óptimo del consumidor, y eso hace que aparezca un error conceptual que solo se puede detectar enseñándolos juntos. Vuelvo a eso más adelante porque es de las cosas más bonitas del plan.

## La decisión arquitectónica central

Aquí está el corazón, y no es la que uno esperaría.

Yo empecé pensando que lo importante era elegir bien la tecnología del video. Fable me corrigió y tenía razón: lo importante es dónde pones la costura entre lo que escribe un humano y lo que consume el programa.

El diseño que quedó es así. Un concepto es una carpeta de texto plano: el guion en Markdown con las fórmulas, y unos archivos de configuración con las preguntas, los ejemplos y el catálogo de errores conceptuales. Eso es la fuente, y la puede editar cualquiera con un editor de texto. Después hay un compilador que toma esa fuente, la pasa por AudioExplainer para generar el audio, y produce el artefacto que consume la aplicación: el empetres, más una línea de tiempo que dice en qué segundo exacto tiene que aparecer cada elemento del gráfico.

¿Por qué esa costura y no otra? Porque las dos cosas que tú quieres a futuro son en realidad la misma propiedad. Que un profesor pueda editar el contenido sin programar, y que un modelo pueda generarlo automáticamente para cada estudiante, ambas operan sobre la fuente en texto, no sobre el artefacto compilado. Nadie edita a mano una lista de marcas de tiempo en milisegundos, y pedirle a un modelo que genere marcas de tiempo coherentes es pedirle que alucine.

Con esa costura, el día que quieras generación personalizada no reescribes nada: cambias de dónde sale la fuente. El programa ni se entera de si la carpeta la escribió un humano o un modelo.

El stack quedó en Python con FastAPI para el servidor, y TypeScript para el navegador. Yo había propuesto Next.js y perdí ese argumento, correctamente: mi razón era que Remotion es React, o sea que estaba subordinando toda la arquitectura a una de las cuatro opciones del bake off, que además podría perder. El argumento que ganó es que el pipeline de contenido ya es Python, porque AudioExplainer y manim lo son, y el destino eventual, InteractiveEduHub, es Django.

## El juez, que es lo que de verdad importa

Aquí es donde el proyecto se juega la vida, así que te lo cuento con detalle.

El conocimiento está dividido en doce sub habilidades. Seis para línea presupuestaria: plantear la ecuación, calcular los interceptos, entender la pendiente como costo de oportunidad, distinguir el conjunto factible, saber que un cambio de ingreso desplaza la línea en paralelo, y saber que un cambio de precio la hace pivotar. Y seis para curva de indiferencia: la definición, la monotonía, por qué dos curvas no se cruzan, la tasa marginal de sustitución, la convexidad, y leer un mapa de curvas.

Hay además tres sub habilidades de integración, sobre el óptimo del consumidor, que no bloquean el cierre. Esas las propuso Codex, y capturan algo real que a los demás se nos había escapado: se pueden dominar los dos conceptos por separado y no saber combinarlos.

Cada sub habilidad tiene un nivel de dominio entre cero y uno, que se actualiza con cada respuesta. Y aquí hay un detalle que me parece el más honesto del plan. La velocidad de actualización es distinta según de dónde venga la evidencia: más rápida cuando la respuesta la corrigió un programa determinista, más lenta cuando la juzgó el modelo de lenguaje. O sea, la fórmula distingue por fiabilidad del instrumento. Yo había propuesto distinguir por dirección del error, castigando más los fallos que premiando los aciertos, y era un número inventado con aire de rigor. La versión de Fable es defendible; la mía no lo era.

Se declara dominio cuando se cumplen cuatro cosas a la vez: nivel por encima de ochenta centésimas, dos aciertos seguidos, evidencia en al menos dos formatos distintos de pregunta, y ningún error conceptual activo. Lo de los dos formatos es de Codex y es más duro que lo que habíamos propuesto Fable y yo: impide que alguien acierte dos veces el mismo tipo de ejercicio y el sistema declare que entendió.

Y hay un principio de diseño que reduce mucho el riesgo: las preguntas numéricas, las de opción múltiple y las de manipulación del gráfico las corrige código, no el modelo. El modelo solo juzga las respuestas abiertas. Eso achica la superficie donde puede alucinar.

## Cómo remedia cuando algo falla

La remediación es una tabla determinista, no una decisión del modelo. El modelo diagnostica; la tabla dispone. Eso lo propusimos los cuatro por separado, lo cual dice algo.

Si detecta un error conceptual con nombre y es la primera vez, lanza una pregunta socrática dirigida a ese error específico, y esa pregunta ya está escrita en el catálogo; el modelo barato solo la adapta al contexto. Si el mismo error persiste después de la socrática, cambia de representación: si falló en símbolos pasa al gráfico, si falló en gráfico pasa a un caso numérico. Si la respuesta es imprecisa pero encaminada, baja la dificultad a un caso con números concretos. Y si acumula seis intentos, o el mismo error tres veces, o el propio juez reporta poca confianza en su diagnóstico, marca para revisión humana, se lo dice al estudiante con honestidad, congela esa sub habilidad y sigue con las demás. Nadie se queda atascado.

Ese último disparador, el de la baja confianza del juez, es de Codex y me parece de lo mejor: escalar cuando el propio sistema duda es más temprano y más honesto que esperar a que el estudiante se frustre.

## El catálogo de errores conceptuales

Son catorce, siete por concepto. Cada uno tiene nombre, la señal observable que lo delata, la remediación asociada, y un distractor de opción múltiple diseñado específicamente para que quien tenga ese error caiga en él. Eso último es lo que hace que las preguntas de opción múltiple, que son baratísimas de corregir, sean sorprendentemente diagnósticas.

Te menciono el que más me gusta. Se llama interferencia con la línea presupuestaria: es el estudiante que cree que la curva de indiferencia se desplaza cuando sube el ingreso. Es un error precioso porque revela que no distingue lo que depende de sus preferencias de lo que depende del mercado. Y solo se puede detectar si enseñas los dos conceptos juntos. O sea, justifica por sí solo tu decisión de cubrir dos y no uno.

## El bake off de las cuatro opciones

El diseño experimental quedó más estricto de lo que tú pediste. Tú dijiste mismo guion y mismo gráfico. El plan dice además mismo empetres y misma línea de tiempo. O sea que las cuatro opciones comparten el audio idéntico y los tiempos idénticos, y compiten únicamente en la capa visual. Y cada prototipo se entrega corriendo dentro de la aplicación real, con los checkpoints funcionando, no como cuatro demos sueltas. Eso elimina un sesgo que se nos había pasado: cuatro demos sueltas se juzgan por lo bonitas, no por lo que cuesta integrarlas.

Seis horas por opción, tope duro. El guion y el audio se pagan una sola vez, fuera del reloj. Si una tecnología no llega en seis horas, eso es el resultado, y se reporta.

Sobre tu criterio de versatilidad entre equipos, que era el difícil de medir, la solución es de Fable y es astuta por lo barata. El guion dice la palabra ahora en un momento exacto, y en ese mismo instante el visual emite un destello de un solo cuadro. Grabas la pantalla con el celular a treinta cuadros por segundo y obtienes el desfase real entre audio y video, con precisión de treinta y tres milisegundos, en cualquier máquina prestada, sin instalar nada.

Y hay una hipótesis pre registrada que el bake off tiene que poder refutar: que el video ganará en máquinas viejas, porque decodificar video va por hardware y no gasta procesador, y perderá en personalización, porque cada variante exige volver a renderizar; y que el hache te eme ele es exactamente lo inverso. Está escrita antes de medir, precisamente para que no la acomodemos después. Y tú fijas los pesos de los cinco criterios antes de ver resultados, por la misma razón.

## La secuencia, y el hito que decide todo

Son siete hitos. El cero es el esqueleto y medir el peso real de la librería de fórmulas. El uno es el guion en tus dos idiomas, escrito desde tus notas de la sesión dos para conservar tu voz docente, y validar el catálogo de errores contra material real de tu curso. El dos es la opción hache te eme ele funcionando de punta a punta. El tres es el juez. El cuatro es el bake off. El cinco es el segundo concepto, y su criterio de salida es precioso: tiene que cerrarse sin tocar código, solo escribiendo contenido. Si eso funciona, has demostrado que el costo marginal de un concepto nuevo es contenido y no ingeniería, que es lo que decide si esto escala a un curso entero. Y el seis es accesibilidad y pulido.

Pero el hito que decide si el proyecto tiene sentido es el tres. Ahí tú etiquetas unas treinta respuestas a ciegas, el juez etiqueta las mismas, y se compara. El gate que fijaste es ochenta por ciento de acuerdo, reportando el intervalo de confianza, más recall por cada error conceptual con su ene al lado, más cero identificadores inventados.

Y lo importante es que el juez corre en modo sombra hasta pasar ese gate. O sea, diagnostica pero no se le permite mover el estado de dominio del estudiante hasta que demuestre que coincide contigo. Si falla dos calibraciones, se degrada: deja de decidir dominio, el diagnóstico pasa a apoyarse solo en las preguntas deterministas, y las abiertas quedan como comentario formativo sin peso. Esa contingencia está escrita de antemano, no se improvisará el día que falle.

## Dónde el plan es débil

Ahora lo que no te va a gustar, que es lo que necesitas para decidir.

Primero. Los parámetros del modelo de dominio son hipótesis, no constantes calibradas. Los números de velocidad de actualización, el umbral de ochenta centésimas, los seis intentos: nadie los midió. Están todos en un solo archivo de configuración para que puedas cambiarlos sin tocar código, y el plan lo dice explícitamente en vez de fingir precisión, pero son inventados.

Segundo. El catálogo de catorce errores conceptuales es teoría de cuatro modelos de lenguaje. Ninguno de nosotros ha visto un examen tuyo. Está marcado para validarse contra material real de tu curso en el hito uno, y ese trabajo es tuyo, no puedo hacerlo yo.

Tercero, y este lo levanto yo ahora porque nadie lo levantó en las tres rondas. Con doce sub habilidades núcleo, y exigiendo dos evidencias en dos formatos distintos para cada una, el mínimo absoluto para cerrar los dos conceptos son veinticuatro respuestas juzgadas, y eso suponiendo que el estudiante no se equivoque nunca. Con errores y remediación, bastante más. Eso es del orden de cuarenta y cinco minutos a una hora de sesión. Codex fue criticado, con razón, porque sus veinte sub habilidades daban dos horas; con doce estamos mejor, pero no estamos claramente bien. Es algo que hay que medir en el hito dos con una persona real, no calcular en una hoja.

Cuarto. Los números del peso de la librería de fórmulas nunca se midieron, porque el entorno bloqueó la descarga. Yo afirmé una cifra mezclando bytes crudos con comprimidos, Fable me corrigió el número pero llegó a la misma conclusión por otra vía, y ninguno de los dos pudo verificarlo. Quedó marcado para medir en el hito cero, antes de que ese presupuesto sea un criterio de corte.

Y quinto, el riesgo estructural: el bake off de cuatro prototipos puede comerse el proyecto. La mitigación es que la opción hache te eme ele no es un prototipo sino el producto, así que se construye igual, y solo las otras tres viven dentro del tope de seis horas. Pero si el tope se relaja, ahí se va el tiempo.

## Lo que yo haría

Si me preguntas, autorizaría, pero reordenando una cosa: haría el hito uno antes que el cero. Escribir el guion y validar el catálogo contra tus exámenes reales es lo único que solo puedes hacer tú, y es lo que más puede invalidar el resto del plan. Si resulta que las confusiones que de verdad aparecen en tu curso no son las que los cuatro modelos imaginamos, quiero saberlo antes de construir el esqueleto, no después.
