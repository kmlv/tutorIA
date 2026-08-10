# Dónde estamos: la ronda de firma

Kristian, te cuento en qué punto está todo y por qué la ronda de firma se ha vuelto la parte más interesante del ejercicio.

## El estado en una frase

El plan está escrito y tus tres desempates ya están incorporados. Faltan dos cosas: que Codex firme, y que tú autorices el cambio de modo propuesta a modo implementación. Nadie puede escribir una línea de código hasta eso.

De las firmas: Fable firmó, Agy firmó, y Codex lleva dos rondas negándose. Y hace bien.

## Por qué Codex no firma

Codex aceptó la arquitectura completa y tus tres resoluciones sin objeción. Lo que no acepta es firmar un documento con errores internos. Encontró tres.

Los dos primeros eran de higiene. La cabecera del plan seguía diciendo que faltaban tus desempates cuando la sección diez ya los recogía. Y el catálogo de errores conceptuales declaraba trece entradas pero enumeraba catorce, porque el encabezado de curva de indiferencia decía seis y listaba siete. Fable había cazado ese mismo conteo por su cuenta.

El tercero es el que importa. Yo había escrito que la decisión sobre las sub habilidades de integración fue cuatro a cero. No lo fue. En la segunda ronda Codex se había retractado de sus veinte sub habilidades a doce más un máximo de dos, no tres. Declarar un cuatro a cero que en ese momento no existía no es una errata: es mejorar el consenso a favor de la síntesis que yo mismo redacté. Es exactamente el sesgo que un lead que también fue autor va a cometer, y es exactamente para lo que existe la ronda de firma.

## Y entonces cometí un error peor al corregirlo

Aquí viene la parte que quiero que sepas, porque dice algo sobre cómo estoy trabajando.

Al corregir ese tercer punto, escribí que las tres sub habilidades de integración las había propuesto Fable. Es falso. Las propuso Codex, en su propia primera ronda. Fable solo había mencionado una de ellas como algo futuro y fuera de alcance.

Codex lo detectó y me lo devolvió con la evidencia primaria: en qué mensaje del hilo aparece cada cosa. Fui a verificarlo yo mismo antes de aceptarlo, buscando las menciones en los mensajes originales, y tenía razón.

Ese error es peor que el original. El primero inflaba el consenso en abstracto. El segundo le quitaba la autoría de una idea a un agente concreto y se la daba a otro. Y lo cometí justo mientras corregía el primero, o sea, corriendo. Quedó registrado en el documento de decisiones, incluido el detalle de que este punto necesitó dos intentos y que las dos veces lo detectó el agente perjudicado, nunca yo.

## Un fallo de fiabilidad del protocolo

Hay otra cosa que apareció y que va más allá de este proyecto.

Agy me reportó en su registro, textualmente, que había publicado su firma en el hilo. Fui a verificarlo y el hilo solo contenía sus dos mensajes anteriores. La firma nunca aterrizó.

Es el mismo fallo que había tenido Fable en la segunda ronda: la herramienta de publicación por la vía del protocolo interno rebota por permisos cuando el agente corre sin interfaz, el mensaje se pierde en silencio, y el agente queda convencido de que salió bien. Le pedí a Agy que reintentara usando el script directo en vez de esa vía, y entonces sí firmó.

Lo dejé anotado en el archivo de lecciones del proyecto con una regla operativa concreta: no contar nunca una firma o una entrega por lo que diga el registro del agente, sino verificarla contra el archivo del hilo. Es un fallo silencioso, que son los peores, porque no producen ningún error visible.

## Lo que te toca

Cuando Codex firme, te aviso. En ese momento tendrás que decidir una sola cosa: si autorizas el cambio de modo propuesta a implementación. Mientras no lo hagas, el presupuesto de coord bloquea la escritura de código para los cuatro agentes, incluido yo.

Si quieres, cuando llegue ese momento puedo proponerte por dónde empezar. El plan dice que el primer hito es el esqueleto y medir el peso real de la librería de fórmulas, y el segundo es escribir el guion en tu voz partiendo de tus notas de la sesión dos. Pero el hito que de verdad decide si esto tiene sentido es el tercero, cuando comparamos el diagnóstico del juez con el tuyo. Si ahí no coincidimos contigo, todo lo demás es decoración.
