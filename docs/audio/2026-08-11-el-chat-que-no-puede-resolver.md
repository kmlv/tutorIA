# El chat del tutor, y por qué está construido para no poder resolver

Kristian, esta es la última pieza del brief original que faltaba: el alumno puede preguntar en cualquier momento. Ciento dieciséis tests en verde, y probado en vivo contra el modelo de verdad.

## El problema, que no es de comodidad

Todo el diseño gira alrededor de un hallazgo que salió en la investigación de prior art. Bastani y coautores, en PNAS el año pasado, midieron una mejora del cuarenta y ocho por ciento **mientras** la inteligencia artificial estaba delante del alumno, y una caída del diecisiete por ciento en el examen **sin** ella. El mismo estudio con guardarrailes: ciento veintisiete por ciento en práctica, y plano en el examen.

O sea que un chat que responde la pregunta no es una conveniencia neutra. Es el mecanismo por el cual un tutor produce alumnos que no pueden hacerlo solos.

Así que el guardarraíl tiene tres capas, y sólo la primera es estructural.

**La primera: al tutor nunca se le da la respuesta.** El contexto que recibe se arma campo por campo, a mano, y lleva el enunciado y nada más. No lleva la respuesta correcta, ni la verificación, ni los key points, ni cuál de las opciones es la buena. Lo armo a mano en vez de serializar el objeto de la pregunta precisamente por eso: si mañana alguien le agrega un campo a ese modelo, con serialización automática empezaría a llegarle al tutor sin que nadie se entere.

Y cuando la pregunta es de opción múltiple, las opciones le llegan **ordenadas alfabéticamente**, no en el orden en que están guardadas. Si la correcta estuviera siempre primero, el orden solo ya sería la respuesta.

**La segunda: el prompt.** Dice qué hacer —devolver la pregunta más pequeña, señalar dónde mirar, ofrecer otra representación, responder de frente qué significa un término— y qué no hacer nunca. Los prompts orientan, no obligan. Esta capa existe porque funciona casi siempre, no porque se pueda confiar en ella.

**La tercera: una revisión a la salida.** Para las preguntas numéricas podemos calcular la respuesta del lado del servidor, así que reviso si la respuesta del tutor la contiene y la reemplazo si aparece. El bloqueo queda registrado como evento, no se traga en silencio: cuántas veces el tutor intenta resolver es un número que quiero, no una vergüenza que esconder.

## El defecto que encontraron mis propios tests

Escribí el test y falló, y al mirar por qué resultó que el fallo era del diseño, no del test.

La respuesta de una de las preguntas —el intercepto del jugo— es cien. Y cien **es** el ingreso. Es uno de los datos que el tutor tiene que poder decir para enunciar el problema. Con la capa tres tal como la escribí, un tutor que dijera "tienes cien dólares" quedaba bloqueado.

O sea: por proteger una respuesta que el alumno puede leer del propio enunciado, el tutor se quedaba sin poder plantear el ejercicio.

La corrección es que **cuando la respuesta coincide con un dado, la capa tres se abstiene**. Y no se abstiene en silencio: hay una función que dice si la capa alcanza o no a un ítem, y un test que la interroga. Un guardarraíl que está inerte en algunos casos sin avisar es peor que uno que reporta dónde no llega.

Lo mismo vale para las de opción múltiple y las abiertas: ahí no hay un número que buscar, así que la capa tres no aplica y las capas uno y dos cargan solas. Está escrito como test para que la limitación sea visible en vez de asumida.

## El otro defecto, que sólo apareció corriéndolo

Corrí el chat en vivo contra el modelo. Las dos respuestas eran pedagógicamente buenas. Pero la primera decía, textual, "plantea la división", y luego cien dividido tres escrito en LaTeX, con barras invertidas y paréntesis. Y la segunda ponía la palabra intercepto en negrita de markdown, con asteriscos.

Eso no se ve como una fórmula en la pantalla. Se ve como barras invertidas y asteriscos, literales. Es exactamente el tipo de cosa que no se descubre leyendo el código.

Arreglado en dos sitios: una instrucción explícita en el prompt de que escriba prosa plana, y un limpiador a la salida que quita el markup en vez de bloquear la respuesta. Bloquearla sería tirar una buena respuesta por un problema de empaque. Y el limpiador corre **antes** de la revisión de filtración, porque un treinta y tres coma tres envuelto en LaTeX sigue siendo la respuesta filtrada; hay un test para ese orden.

Después del arreglo, volví a correrlo en vivo. Ahora el tutor, ante "dame el intercepto del café nomás", responde qué es el intercepto y devuelve la pregunta: qué división habría que hacer con el ingreso y el precio. Sin la división hecha. Sin markup.

## Lo demás

El presupuesto es de doce preguntas por sesión, y no es un control de costo: el costo es de dieciséis diezmilésimas de dólar por turno, o sea dos milésimas de dólar por sesión completa. Es un control pedagógico. Un chat sin límite es una invitación a tercerizar el pensamiento, y el presupuesto hace que el alumno gaste sus preguntas en lo que de verdad no entiende. Cuando se acaba, el corte no cuesta una llamada al modelo: se revisa antes.

Si el alumno ya mostró una confusión del catálogo, al tutor le llega la sonda socrática que el catálogo trae escrita para ella, pero **no** el identificador ni el nombre del error. Hay un test que falla si algún id del catálogo aparece en lo que ve el tutor. No quiero que le diga al alumno "tienes la misconception be ele eme uno".

## Dónde queda todo

El proof of concept ya tiene sus cuatro piezas: la entrega con audio y gráficos sincronizados, las preguntas con corrección determinista, el juez de respuestas abiertas, el motor de dominio con su política de remediación, y ahora el chat.

Lo que te espera sigue siendo lo mismo: etiquetar los sesenta y nueve ítems, decidir qué hacer con la rúbrica de la pendiente que pide dos veces casi lo mismo, y decirme si commiteo.
