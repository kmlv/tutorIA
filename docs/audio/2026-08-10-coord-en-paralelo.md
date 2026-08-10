# Coord en paralelo: lo que encontró Codex

Kristian, tenías razón en el reproche. Llevaba desde el hito cero construyendo solo, con tres agentes disponibles y sin usarlos. Lo corregí, y el resultado justifica de sobra la queja.

## Cómo repartí

Abrí una tarea con propiedad de archivos estricta y disjunta, para que pudiéramos editar los tres a la vez sin pisarnos. A Agy le di la manipulación del gráfico, que es una pieza autocontenida: arrastrar la recta con el ratón y con el teclado. A Codex le di revisión de solo lectura de los correctores deterministas y del esquema del paquete. Y yo me quedé con el cableado de las preguntas al panel del tutor.

Agy entregó. El archivo funciona, pasa el chequeo de tipos, usa eventos de puntero para que sirva con dedo, agrupa los repintados por cuadro para no matar procesadores lentos, y no filtra ninguna respuesta al navegador. Le devolví dos observaciones menores: el texto accesible que puso está en español cuando el proyecto ya es en inglés, y el elemento que recibe el foco del teclado mide cero por cero, lo cual lo hace difícil de enfocar y no da ningún indicador visible.

## Lo que encontró Codex, que es la parte importante

Cuatro bloqueantes. Los cuatro reales. Te los cuento porque dicen algo sobre cómo estaba escribiendo yo el código.

El primero: el corrector de manipulación del gráfico aceptaba basura. Si el cliente mandaba un objeto vacío, lo calificaba como **correcto**, porque las cantidades tomaban valor cero por defecto y cero gasto está dentro del presupuesto. También aceptaba cantidades negativas. Y si el precio del segundo bien llegaba en cero, reventaba con una división por cero que le habría salido al estudiante como un error del servidor.

El segundo es el más serio y el que más me interesa. El diagnóstico direccional, del que yo estaba orgulloso, sobre atribuía. Yo comparaba pendiente e intercepto contra los valores esperados y, si los dos estaban mal, declaraba una confusión concreta. Codex demostró que con eso una recta arbitraria cualquiera, sin ninguna relación con el ejercicio, quedaba etiquetada como si el estudiante tuviera un error conceptual específico. Y al revés: un estudiante que sí giraba cuando debía desplazar, pero con el intercepto algo impreciso, se quedaba sin diagnóstico.

Eso no es un fallo cosmético. Ese diagnóstico alimenta el estado de dominio. Nombrar una confusión que el estudiante no cometió es peor que no nombrar ninguna, porque envenena el modelo que después decide qué remediación aplicar.

Lo reescribí como él indicó: ahora la comparación es contra la recta original **y** contra la recta objetivo, y solo se declara una confusión cuando lo que el estudiante construyó coincide con la firma de esa confusión. Si giró en una tarea de desplazamiento, eso es una firma. Si conservó la pendiente en una tarea de pivote, eso es otra. Cualquier otra cosa es simplemente incorrecta, sin etiqueta.

El tercero: mi evaluador de expresiones. Yo lo había escrito con lista blanca de operaciones y estaba satisfecho porque no permitía ejecutar código. Codex confirmó eso, pero señaló que no era seguro en recursos: elevar dos a mil millones reventaba, dividir entre cero reventaba, un error de sintaxis se escapaba, y la palabra verdadero se evaluaba como uno, porque en Python los booleanos son enteros. Todo eso llegaba al estudiante como error del servidor.

## El cuarto, que rechazó nuestro propio contenido

Este merece párrafo aparte.

Yo tenía una validación que comprobaba que cada sub habilidad tuviera banco suficiente para alcanzar el dominio. Codex demostró que era una cota inferior parcial: se saltaba las sub habilidades sin ninguna pregunta, y comprobaba las condiciones por separado en vez de comprobar que existiera un conjunto que las cumpliera todas a la vez.

Lo reescribí para que busque de verdad un conjunto de tres ítems que satisfaga simultáneamente las dos modalidades, el tope de un solo ítem juzgado por el modelo, y el mínimo de un acierto sin ayuda.

Y al correrlo, **rechazó nuestro propio paquete**. Dos sub habilidades tenían dos preguntas cada una, y el criterio exige tres aciertos consecutivos. O sea que el banco prometía un criterio de dominio que era imposible de cumplir, y llevaba así desde que lo escribí. Añadí las preguntas que faltaban.

## Lo que esto dice

Los tests pasaron de treinta a cuarenta y tres, y los nuevos son los casos adversariales que Codex especificó. Su observación de que mi batería solo probaba caminos felices era exacta.

Van tres documentos seguidos en los que Codex encuentra errores míos, y en dos de ellos la corrección que yo escribí estaba a su vez mal. La lección práctica, y por eso tenías razón: **revisar por otro agente no es un adorno del protocolo, es lo que impide que este proyecto se construya sobre diagnósticos falsos.** Y el diagnóstico es literalmente el producto.

## Estado

Todo verde: cuarenta y tres pruebas, el validador del paquete limpio, el servidor y la interfaz funcionando. El ciclo completo se puede probar: llega el punto de control, se monta la pregunta que declara el paquete, el estudiante elige mal, el servidor detecta la confusión y devuelve la pregunta socrática que estaba escrita en el catálogo curado.

Queda un pendiente de la revisión que no hice: validar al cargar el paquete que las expresiones del diagnóstico no colisionen entre sí. Importa para paquetes generados automáticamente, no para este.
