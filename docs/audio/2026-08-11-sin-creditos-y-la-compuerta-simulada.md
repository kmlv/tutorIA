# Se acabaron los créditos, y qué dice el número que sí alcanzó a salir

Kristian, lo primero es lo accionable: **la cuenta de OpenAI se quedó sin créditos.** El error dice, textual, "you have no credits remaining". Hay que recargarla en la consola de facturación de OpenAI. Hasta entonces el juez no puede correr, y el chat del tutor tampoco.

## Qué alcanzó a salir

Corrí los sesenta y nueve ítems por los tres modelos, en secuencia. El primero, el caro, alcanzó a terminar entero: sesenta y nueve veredictos, cero inválidos, setenta y siete centavos. Los otros dos fallaron completos contra el muro del saldo.

Así que hay un resultado, y es del modelo fuerte.

Noventa y uno coma tres por ciento de acuerdo. Kappa cero coma ochenta y dos. Recall del cien por ciento en cuatro de los cinco errores del catálogo y ochenta por ciento en el quinto. Cero identificadores fuera del catálogo. Un solo veredicto con cita inventada de sesenta y nueve.

**Y ahora la parte que importa más que los números.** Ese acuerdo **no es contigo**. Tú decidiste no etiquetar, y yo no inventé tus etiquetas: el campo donde va tu veredicto sigue vacío. La referencia es la intención con que se escribió cada respuesta, que es la opinión de otro modelo sobre respuestas que también escribió un modelo.

O sea que ese noventa y uno por ciento dice dos cosas: que la maquinaria funciona de punta a punta, y que el juez no está groseramente roto. No dice que concuerde contigo, y no es evidencia pedagógica de nada.

Lo dejé escrito en tres sitios para que no se cite mal más adelante: en la cabecera del gold set, en el fichero de decisiones abiertas, y en el propio reporte, que ahora imprime "simulada: pasa contra la intención" en vez de "aprobada" cuando corre en ese modo.

Y por lo mismo el juez **se queda en sombra**. La variable que lo pondría en vivo no la toco: la compuerta no se aprobó, se simuló.

## La fusión de la rúbrica funcionó, y se puede medir

Esto sí es un resultado limpio, porque es una comparación contra la misma referencia antes y después.

Cuando decidiste fusionar los dos puntos de la pregunta de la pendiente, el acuerdo global subió de ochenta y nueve coma nueve a noventa y uno coma tres. El kappa, de cero coma setenta y nueve a cero coma ochenta y dos. Y el acuerdo punto por punto de rúbrica subió de ochenta y nueve coma seis a noventa y dos coma ocho.

El punto peor de todos era el que fusionaste, con setenta y seis por ciento. Ahora el peor es otro, con ochenta y cuatro. O sea que la ambigüedad estaba donde los auditores dijeron que estaba, y quitarla movió el número. Fue una buena decisión y ahora hay dato que lo respalda.

## Dos defectos míos que este fallo destapó

El primero. El código de error cuatrocientos veintinueve significa dos cosas completamente distintas y yo las reportaba igual: "vas muy rápido", donde esperar y reintentar funciona, y "te quedaste sin saldo", donde esperar no sirve para nada. Mi mensaje decía "rate limited" en los dos casos. Costó ciento treinta y siete llamadas fallidas y un bake-off entero antes de que alguien leyera el cuerpo del error. Ahora son dos tipos distintos, con mensajes distintos, y el lote se corta en el primero en vez de estrellarse sesenta y nueve veces seguidas.

El segundo. La tabla comparativa de modelos dividía por cero cuando una corrida no tenía ni un veredicto válido, y antes de reventar imprimió una línea que decía que el modelo intermedio tenía cien por ciento de acuerdo. Con un ítem. Eso es peor que fallar: una corrida que no ocurrió apareciendo como el mejor resultado de la tabla. Ahora se excluye explícitamente y se dice por qué.

Ninguno de los dos es del proveedor. Los dos son míos.

## Lo que quedó registrado

Las tres decisiones que tomaste ya no viven en un mensaje de chat. Están en el fichero de decisiones para el principal, que es donde debieron estar desde el diez de agosto.

La de no etiquetar, con su consecuencia escrita de frente: la compuerta no está aprobada, está simulada.

La del chequeo de transferencia, que aprobaste implementar. Ahora mismo hay cuatro diseños compitiendo por él, cada uno juzgado por tres lectores independientes con criterios distintos: si el estadístico de verdad mide lo que dice medir, cómo se siente desde el lado del alumno, y si se puede construir sobre lo que ya existe. Cuando termine te traigo la especificación.

Y la de que el modelo genere la configuración de los gráficos contra un esquema que definas tú una vez. Esa tiene una consecuencia que conviene ver ahora: convierte el criterio dos del bake-off, el de personalización barata, en el criterio que decide, no en un empate más.

## Lo único que necesito de ti

Recargar la cuenta. Nada más. El resto puede seguir sin ti.
