# El bake-off cerrado, y el diseño del chequeo de transferencia

Kristian, con los créditos ya puestos corrió todo. Ciento diecinueve tests en verde, dieciséis commits en la rama, y subido.

## El bake-off, ahora completo

Los tres modelos sobre los sesenta y nueve ítems, con la rúbrica ya fusionada.

El caro, sol: noventa y uno coma tres por ciento, kappa cero coma ochenta y dos, setenta y siete centavos. El intermedio, terra: noventa y dos coma ocho, kappa cero coma ochenta y cinco, veintisiete centavos. El barato, luna: noventa y uno coma tres, kappa cero coma ochenta y dos, tres centavos y medio.

Los tres son **estadísticamente indistinguibles**. La prueba correcta aquí es McNemar exacta sobre los pares donde discrepan, que es lo apropiado cuando dos jueces ven exactamente los mismos ítems, y no es lo mismo que mirar si los intervalos se solapan. Hay entre tres y cinco ítems discordantes en cada par de modelos. Con eso la prueba casi no tiene potencia, así que "indistinguibles" significa que **este** gold set no los separa, no que sean equivalentes.

Lo que sí es sólido: el caro cuesta veintidós veces lo que el barato y no hay ninguna evidencia de que compre nada.

Y sigue midiéndose contra la intención, no contra ti. Eso no cambia hasta que haya etiquetado real o una cohorte.

## Lo que la fusión de la rúbrica hizo

Esto sí es limpio, porque es la misma referencia antes y después de tu decisión.

El acuerdo global subió de ochenta y nueve coma nueve a noventa y uno coma tres. El kappa, de cero coma setenta y nueve a cero coma ochenta y dos. Y el acuerdo punto por punto de rúbrica, de ochenta y nueve coma seis a noventa y dos coma ocho. El punto peor era el que fusionaste, con setenta y seis; ahora el peor es otro, con ochenta y cuatro.

## El diseño del chequeo de transferencia

Lo aprobaste y ya está diseñado. Cuatro propuestas independientes, cada una escrita desde un ángulo distinto, y cada una juzgada por tres lectores con criterios que no se solapan: si el estadístico de verdad mide lo que dice medir, cómo se siente desde el asiento del alumno, y si se puede construir sobre lo que ya existe sin rediseñarlo.

Ganó la que menos se parece a un examen, y por eso mismo.

Se llama emparejamiento aleatorizado de pistas. La idea es esta: en vez de añadir ítems al final, el tutor **ofrece una pista conceptual corta antes de exactamente uno de cada dos ítems emparejados**, y cuál de los dos la recibe lo decide una moneda con semilla registrada. El alumno no ve ninguna diferencia salvo que a veces el tutor dice una frase antes de la pregunta y a veces va directo. El chat sigue abierto en los dos casos. La remediación funciona igual en los dos casos. No se añade nada al final, no se retira nada, y no aparece ni un ítem nuevo.

Lo que se mide es si la ayuda **se transfiere** al ítem que el tutor no tocó.

La razón por la que hace falta la moneda es la que hundió a las otras propuestas. Hoy el sistema ya registra si hubo ayuda en cada respuesta, y la tentación obvia es comparar las respuestas con ayuda contra las que no la tuvieron. Eso da un resultado con el signo **al revés**, y la propuesta que lo analizó lo dijo sin rodeos: la ayuda de hoy la pide el alumno, y la pide justamente en los ítems que le cuestan. Comparar sin aleatorizar no mide si la ayuda sirve; mide que el alumno pide ayuda cuando está fallando.

Las tres perdedoras se rechazaron con motivo, no por gusto. Una necesitaba cirugía en el gráfico y terminaba la sesión con dos fallos sin remediar justo antes de la pantalla de cierre. Otra apagaba el chat, que es la señal más ruidosa posible de que esto es una prueba. Y la tercera daba por hecho que el banco ya estaba parametrizado, lo cual —fui a comprobarlo— **es falso para dieciséis de los veintiún ítems**.

## Dos afirmaciones de la especificación sobre mi código, y las comprobé

Esto me parece lo más útil de haber puesto lectores a mirar el repo de verdad.

La primera decía que mi escalera de remediación elige la sonda socrática por orden alfabético y puede acabar dándole al alumno una sonda de otra sub-habilidad. **Es falsa.** Fui a mirar: el estado de dominio ya intersecta las misconceptions activas con las que la sub-habilidad declara suyas, así que la sonda siempre es del tema correcto. Lo dejé escrito en el documento en vez de "arreglar" algo que no estaba roto.

La segunda decía que el sustituidor de plantillas no toca las opciones de las preguntas de opción múltiple. **Es cierta.** Hoy ninguna opción usa plantilla, así que no era un fallo vivo; era una trampa esperando. El día que alguien escriba "sube de llave llave eme a ciento cincuenta" en un distractor, el alumno lee las llaves en la pantalla y nadie se entera hasta que se entera un alumno. Ya está cerrada por los dos lados: el cargador sustituye también en las opciones, y el validador ahora rechaza cualquier plantilla cuyo nombre no sea uno de los que el cargador conoce de verdad.

## Y lo que la propia especificación admite que no puede

Esto me gustó del documento, porque lo dice él solo.

Con un alumno de proof of concept **no dice nada sobre el alumno**. Lo que un solo pase puede establecer es que el instrumento funciona: que el emparejamiento cabe en el presupuesto de doce preguntas sin ahogar al selector, que el dominio sigue siendo alcanzable, y que la asignación se puede reconstruir entera desde el registro. Eso, y el número de pares que salen, que la aritmética del banco predice en dos o tres. Ese fracaso parcial **es** el hallazgo: es lo que pone precio a la factura de escribir ítems antes de que nadie la pague.

Y no mide lo de Bastani. Bastani es un efecto de tiempo y de ausencia: rendir sin la herramienta, después. Esto se mide sesenta segundos más tarde con el chat todavía en pantalla. Es transferencia cercana, no la lejana, y la especificación exige que el diagnóstico del instructor lo diga en la misma frase en que reporte el número.

No está implementado. Es la especificación, no el código.

## Los dos defectos que dejó el susto de los créditos

El código de error cuatrocientos veintinueve significa dos cosas opuestas y yo las reportaba igual: "vas muy rápido", donde esperar sirve, y "no tienes saldo", donde esperar no sirve jamás. Ahora son tipos distintos, el lote se corta en el primero, y el mensaje trae el enlace de facturación.

Y la tabla del bake-off dividía por cero con una corrida vacía, pero antes de reventar alcanzó a imprimir que el modelo intermedio tenía cien por ciento de acuerdo. Con un ítem. Una corrida que no ocurrió, apareciendo como la mejor fila de la tabla. Eso es peor que fallar.

También cambié el pie del reporte: en modo contra intención ya no dice "aprobada" ni ofrece el comando para pasar a vivo. Dice "simulada". El encabezado avisaba y el pie invitaba justo al malentendido que el encabezado quería evitar.
