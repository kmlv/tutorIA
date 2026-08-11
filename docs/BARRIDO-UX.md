# Barrido de UX — 2026-08-11

Ocho agentes condujeron la app en el navegador, uno por superficie. Cada fallo reportado
pasó por otro agente cuyo trabajo era **refutarlo**: por defecto falso salvo que lo viera
reproducirse desde carga limpia. **74 reportados, 68 confirmados, 6 descartados.**

Los arreglados están tachados y con su commit. Lo demás sigue abierto.

## Callejones sin salida (12)

**1.** ~~Pulsar «Listo» en una pregunta de arrastrar sin haber arrastrado: el sistema no contesta, no registra nada y repite la misma pregunta para siempre~~  ✔ arreglado
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) En consola: __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();  (o dejar terminar la narración de 3:52). Arranca «Vamos a practi
   - observado: Cada clic en «Listo» no genera NINGUNA petición a /api/session/{id}/answer (solo un evento de telemetría con correcta:false). El tutor no dice absolutamente nada: no hay «Correcto.», ni socrática, ni aviso. El cliente resuelve el veredicto por su cuenta (main.

**2.** Fallando todo, la práctica entra en un ciclo de 3 ítems y a los 40 se detiene en silencio, con todos los botones deshabilitados
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Contestar MAL todo: en las MCQ elegir siempre una opción incorrecta; en la
   - observado: El selector cicla exactamente tres ítems, todos de la misma sub-habilidad BL.CS.M, indefinidamente: q_cp1_income_direction → q_cs_m_manip → q_cs_m_numeric → repetir. 13 vueltas completas. La socrática es la MISMA frase literal 14 veces («Te duplican la mesada.

**3.** ~~«Listo, sigamos» (y el botón «Seguir» del reproductor) durante la práctica reinicia la narración desde 0:00, esconde el panel del tutor y deja la pregunta fuera de la pantalla~~  ✔ arreglado
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Con cualquier pregunta de práctica abierta, pulsar el botón «Listo, sigamo
   - observado: currentTime pasa de 232.7 s a 2.2 s y el audio arranca de nuevo: se reinicia la lección entera de 3:52. El dock pasa a estado «oculto», así que el panel del tutor y la pregunta pendiente desaparecen de la vista. Además el layout revienta: la página crece de 12

**4.** Usar el chat expulsa de la pantalla el gráfico y la pregunta del checkpoint
   - *chat* · Abrir http://localhost:57330/?lang=es y pulsar «Empezar». Dejar correr hasta 2:25 (t=144.8), donde se abre el checkpoint cp1: «Tu ingreso sube de 100 a 150. ¿Qué le pasa a la línea?» con sus cuatro op
   - observado: .dock no tiene tope de altura, así que .dock-body nunca llega a ser contenedor de scroll (clientHeight == scrollHeight == 1637 px tras 4 turnos) y quien crece es el documento entero. Además el composer hace this.input.focus() en el finally de send(), lo que ar

**5.** ~~El tirador (o el punto) se puede arrastrar fuera del lienzo y ya no se puede recuperar con el ratón~~  ✔ arreglado
   - *manipulacion* · Llegar al manipulativo de recta (pasos del fallo anterior, item #1). Agarrar el tirador del intercepto de x1 (anillo blanco sobre el eje horizontal, en 33.3) y arrastrarlo hasta el borde derecho de la
   - observado: No hay tope superior en ningún eje. El tirador de x1 acaba en cx=1071 dentro de un viewBox de 560 de ancho: queda recortado por el SVG, invisible, y document.elementFromPoint sobre su posición devuelve DIV.dock-body (el panel del tutor). El tirador vertical ac

**6.** Al llegar al tope de 40 ítems la práctica termina en silencio con el botón deshabilitado
   - *manipulacion* · Arrancar la práctica y contestar 40 ítems; la vía más rápida es la del primer fallo (pulsar 'Listo' sin arrastrar en cada manipulativo, que los repite indefinidamente). Reproducido con /Users/klopezva
   - observado: Tras 40 preguntas montadas, window.__tutoria.practice.active pasa a false y no se dice NADA: el último mensaje del dock es la misma pregunta socrática repetida. En pantalla queda el ítem de manipulación con el botón 'Listo' deshabilitado, el gráfico con sus ti

**7.** Un salto atrás durante la práctica la mata para el resto de la sesión
   - *tiempo* · 1) Abrir http://localhost:57330/?lang=es
2) En consola: window.__tutoria.media.seek(230.5)
3) Pulsar «Empezar» y esperar a que termine la narración (3:52). Aparece la práctica: «Vamos a practicar un p
   - observado: El panel queda en data-estado="oculto" y no aparece ninguna pregunta. window.__tutoria.practice devuelve {running:true, served:0} de forma permanente: como `running` nunca se puso a false, el `media.on("ended") -> practice.start()` no hace nada. Las únicas acc

**8.** ~~En la variante B, el botón de idioma lleva a una lección que no se puede empezar nunca~~  ✔ arreglado
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=es&variant=B
2. Pulsar «Empezar» y dejar correr hasta cualquier segundo (yo lo hice en 1:02).
3. Pulsar el enlace «English» de la barra de controles, abajo a la d
   - observado: La página se pinta entera y creíble —título «The Budget Constraint», las dos fichas de bienes (vacías), botón «Start» azul y HABILITADO, «✋ Ask», reloj 0:00, «Hide captions», «Transcript»— pero el escenario está vacío y la app está muerta. En consola: `Error: 

**9.** ~~Cualquier ?lang que no sea exactamente «es» o «en» deja la página en blanco~~  ✔ arreglado
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=fr
2. Repetir con http://localhost:57330/?lang=ES (mayúsculas)
Reproducido en bakeoff/medir/p19-lang-raro.mjs; captura en el scratchpad, lang-lang_fr.png.
   - observado: Página completamente en blanco. `document.body.innerText` es la cadena vacía: ni título, ni botón, ni mensaje, ni enlace de idioma. En consola: `TypeError: Cannot read properties of undefined (reading 'cargando')` — el diccionario T se indexa con `}[lang]` (ma

**10.** ~~?variant= con cualquier valor que no sea A o B mayúscula rompe la lección igual que la variante B en inglés~~  ✔ arreglado
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=es&variant=b (minúscula)
2. Abrir http://localhost:57330/?lang=es&variant=C
Reproducido en bakeoff/medir/p7-crash.mjs.
   - observado: La página se pinta completa —fichas de café y jugo con sus precios, «Empezar» habilitado, «✋ Preguntar», reloj 0:00, «English»— pero en consola sale `Error: media variant b not implemented (M4 built A and B)` (adapter.ts:218-226, el `default` lanza) y `window.

**11.** ~~Cualquier ?lang que no sea exactamente es o en deja la página completamente en blanco~~  ✔ arreglado
   - *primeros-segundos* · Abrir http://localhost:57330/?lang=EN (en mayúsculas). Igual con ?lang=es-ES, ?lang=pt o ?lang=fr.
   - observado: Pantalla blanca total: document.body.innerText === "". No se llega a hacer ni la petición POST /api/session ni GET /api/packs. En consola: «TypeError: Cannot read properties of undefined (reading 'cargando')», y window.__tutoria no existe. No hay ningún elemen

**12.** Recargar o cambiar de idioma tira la lección a 0:00 y no existe ningún control para volver al punto donde iba
   - *primeros-segundos* · A) Abrir ?lang=es&t=0, pulsar «Empezar», dejar correr hasta 0:42 y recargar (F5). B) Con la lección en 1:41, pulsar el enlace «English» de la barra inferior. C) Intentar volver a ese punto: buscar bar
   - observado: A) Tras F5: reloj 0:00, botón «Empezar», gráfico vacío; los 0:42 escuchados se pierden. B) El enlace de idioma es href="?lang=en&t=0" con el t fijado a cero: desde 1:41 se cae a 0:00 «Start». C) No hay forma de volver: la barra de transporte entera es [Pausa][

## El sistema no responde (12)

**13.** ~~Los cuatro chips de ayuda del tutor no responden nunca: se traga el mensaje del alumno y no contesta~~  ✔ arreglado
   - *checkpoints* · 1) http://localhost:57330/?lang=es  2) window.__tutoria.media.seek(143); window.__tutoria.media.play()  3) En el checkpoint (144.76 s), sin contestar, pulsar 'No entiendo'. Esperar. Pulsar 'Otro ejemp
   - observado: Tras 4 clics y 24 s el DOM tiene 4 burbujas 'msg estudiante' y CERO 'msg tutor'. El unico trafico de red que generan los chips es POST /api/session/<id>/events (telemetria); no se llama al tutor. Las mismas palabras escritas en el composer si contestan en ~5 s

**14.** ~~La opcion 4 de cp1 recibe una frase vacia: 'Vamos a pensarlo distinto.' y nada mas~~  ✔ arreglado
   - *checkpoints* · 1) http://localhost:57330/?lang=es  2) window.__tutoria.media.seek(143); window.__tutoria.media.play()  3) En cp1, pulsar la cuarta opcion: 'No cambia, porque los precios son los mismos'.  Reproducido
   - observado: El unico mensaje del tutor es 'Vamos a pensarlo distinto.' Nada mas llega, ni a los 10 s ni despues. Las cuatro opciones quedan deshabilitadas al instante. O sea: anuncia que va a plantearlo de otra forma y nunca lo plantea. (Para contraste: opcion 1 -> 'Corre

**15.** El parametro ?t= de la URL se ignora: no se puede enlazar a un checkpoint
   - *checkpoints* · 1) Abrir http://localhost:57330/?lang=es&t=144  2) Esperar a que window.__tutoria.media.duration() > 0 y despues 4 s mas  3) Leer window.__tutoria.media.currentTime()  4) Pulsar play.  Reproducido en 
   - observado: currentTime() = 0 en las seis lecturas (a 0.4 s, 0.8 s ... 2.4 s) y tambien tras 4 s. Al pulsar play empieza en 1.42 s, o sea desde el principio. location.href conserva '?t=144', asi que el parametro llega y no se aplica. Con window.__tutoria.media.seek(144) s

**16.** ~~Responder mal una predicción no produce ninguna reacción, aunque el servidor sí manda la repregunta socrática~~  ✔ arreglado
   - *predicciones* · Abrir http://localhost:57330/?lang=es , pulsar «Empezar» y dejar correr hasta que el reloj marque 1:27 (o en consola: window.__tutoria.media.seek(85) y luego pulsar «Empezar»). El audio se pausa solo 
   - observado: Cero. La opción se marca «elegida», las tres se deshabilitan, el panel del tutor se cierra entero y el audio arranca solo. Byte por byte lo mismo que al acertar: comparé el DOM tras acertar y tras fallar y no hay una sola diferencia visible. Y no es que falte 

**17.** ~~Los chips de ayuda del tutor («No entiendo», «Otro ejemplo», «Más despacio», «¿Por qué?») no contestan nunca~~  ✔ arreglado
   - *predicciones* · http://localhost:57330/?lang=es , llegar a la predicción line_vs_set (reloj 1:27, t=87.05). Con la pregunta en pantalla, pulsar «No entiendo» en la fila de chips del panel del tutor. Esperar. Repetir 
   - observado: El chip se escribe en el hilo como mensaje del alumno y ahí muere. Esperé 15 segundos con cada uno: nada. En la red no sale ninguna llamada a /chat — solo un POST a /api/session/<id>/events, es decir, telemetría. El composer de texto libre, en cambio, sí funci

**18.** ~~Cuatro de los cinco botones de intención no producen ninguna respuesta del tutor durante la práctica~~  ✔ arreglado
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Con la primera pregunta abierta, pulsar «No entiendo». Esperar 15 s. Repet
   - observado: El único tráfico que genera cada clic es POST /api/session/{id}/events con {"type":"intent","payload":{"id":"no_entiendo"}} — telemetría. No hay ninguna petición que pueda producir una respuesta, y tras 15 s el dock solo contiene el eco del propio alumno: «msg

**19.** ~~Los botones de intención del tutor no producen ninguna respuesta~~  ✔ arreglado
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar» para abrir el panel del tutor y pulsar «No entiendo». Esperar. Luego pulsar «¿Por qué?». Igual con «Otro ejemplo» y «Más despacio». Reproduc
   - observado: El texto del botón se pinta como burbuja del alumno («AL :: No entiendo») y el tutor nunca contesta. Cero peticiones a /api/session/{id}/chat medidas en 6 s de espera por botón; en main.ts el único handler de dock.onIntencion() registra un evento y, salvo «Lis

**20.** Agotado el límite, la caja sigue aceptando texto por teclado y devuelve la misma frase sin fin
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar» y hacer 12 preguntas cualesquiera. En la 13ª el contador marca «0 preguntas» y aparece «Ya usaste tus preguntas para esta sesión...». Sin to
   - observado: data-agotado="1" solo aplica pointer-events:none y opacity .5 desde CSS. Medido tras el límite: input.disabled = false, boton.disabled = false, el placeholder sigue diciendo «Pregunta lo que quieras…» y el foco está DENTRO de la caja (el finally de send() hace

**21.** Las preguntas de más de 800 caracteres se recortan en silencio y el tutor responde a otra cosa
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar» y pegar en la caja un mensaje de 994 caracteres cuyo grano esté al final, por ejemplo 891 caracteres de contexto («He estado repasando mis a
   - observado: MAX_QUESTION_CHARS = 800 en el servidor recorta con [:800] sin decirlo. El textarea no tiene maxlength, no hay contador de caracteres y el dock pinta los 994 caracteres completos, así que en pantalla parece que el tutor lo ha leído todo. La respuesta fue «Para

**22.** ~~Confirmar sin arrastrar: no se envía nada, no se dice nada, y vuelve la misma pregunta~~  ✔ arreglado
   - *manipulacion* · Abrir http://localhost:57330/?lang=es. Arrancar la práctica (dejar terminar la narración de 3:52, o en consola: window.__tutoria.practice.start()). Item #0 es el MCQ 'Tu ingreso sube de 100 a 150' → p
   - observado: Cero POST a /api/session/{id}/answer: el servidor nunca se entera. El dock no añade ni una línea (mismos mensajes antes y después, verificado por DOM). El cliente sí manda a telemetría practice.answered {question_id:'q_cs_m_manip', correcta:false} — un fallo q

**23.** ~~Los cuatro botones de intención del tutor no contestan nunca: tragan el mensaje y no piden respuesta~~  ✔ arreglado
   - *primeros-segundos* · 1) Abrir http://localhost:57330/?lang=es&t=0. 2) Pulsar «Empezar» y esperar 2 s. 3) Pulsar «✋ Preguntar» (se abre el panel TUTOR y la lección se pausa). 4) Pulsar el chip «No entiendo». 5) Esperar 8 s
   - observado: El texto del chip se añade al panel como mensaje del alumno y no llega ninguna respuesta, nunca. Instrumentando la red: el único POST que sale es /api/session/<id>/events (telemetría); no se hace ni una llamada a /api/session/<id>/chat. El contador de pregunta

**24.** «✋ Preguntar» no cierra el panel del tutor, Escape tampoco, y el panel no tiene botón de cerrar
   - *primeros-segundos* · 1) Abrir ?lang=es&t=0, pulsar «Empezar», esperar 1,5 s. 2) Pulsar «✋ Preguntar» (el panel se abre y la lección se pausa). 3) Volver a pulsar «✋ Preguntar». 4) Pulsarlo una tercera vez. 5) Pulsar Escap
   - observado: Tras el segundo y el tercer clic, window.__tutoria.dock.actual sigue siendo «abierto-pasivo» y no cambia nada en pantalla: el botón no responde en absoluto. Escape tampoco. La cabecera del panel sólo contiene la palabra «TUTOR», sin ningún control de cierre. L

## Incoherencias (30)

**25.** El tutor dice 'Seguimos' pero nada sigue; y dice 'Cuando quieras, seguimos' cuando ya ha seguido
   - *checkpoints* · CASO A: en cp2 (seek(193.5), play, esperar a 194.56 s) escribir cualquier cosa y pulsar 'Responder'. CASO B: en cp1 (seek(143), play) contestar bien la opcion 1 y esperar 30 s. CASO C: en cualquiera d
   - observado: CASO A: el tutor escribe 'Anotado. Seguimos.' y la narracion se queda pausada en 194.56 s indefinidamente. CASO B: escribe 'Correcto.' y a los 30 s sigue pausada en 144.76 s, sin ninguna instruccion de que hay que pulsar algo. CASO C: al pulsar 'Listo, sigamos

**26.** Dos preguntas vivas a la vez: la de cp1 sigue clicable dentro de cp2, y su 'Correcto.' aparece colgando de la pregunta de cp2
   - *checkpoints* · 1) http://localhost:57330/?lang=es  2) window.__tutoria.media.seek(143); window.__tutoria.media.play()  3) En cp1 (144.76 s) NO contestar: pulsar el boton 'Seguir' del reproductor  4) window.__tutoria
   - observado: El dock muestra las dos tarjetas apiladas y las cuatro opciones de cp1 siguen enabled (disabled=false) mientras cp2 pide texto. La tarjeta de cp1 pregunta por una subida de ingreso mientras el grafico ya muestra el pivote de precio ($4/kg, pendiente -4): el en

**27.** Rebobinar duplica el checkpoint: la misma pregunta aparece dos veces, y la copia muerta no se distingue de la viva
   - *checkpoints* · 1) http://localhost:57330/?lang=es  2) window.__tutoria.media.seek(143); window.__tutoria.media.play()  3) En cp1 contestar bien (opcion 1) y pulsar 'Listo, sigamos'  4) Rebobinar para repasar: window
   - observado: La narracion se vuelve a pausar y se anade una SEGUNDA copia completa de la pregunta. El DOM pasa a tener 8 botones de opcion: 4 disabled (los viejos) y 4 enabled (los nuevos). En pantalla se ven dos tarjetas con el mismo enunciado y las mismas cuatro opciones

**28.** Si se pulsa 'Seguir' en el checkpoint, la narracion canta la respuesta en voz alta y la pregunta sigue puntuando 'Correcto.'
   - *checkpoints* · 1) http://localhost:57330/?lang=es  2) window.__tutoria.media.seek(143); window.__tutoria.media.play()  3) En cp1 (144.76 s) pulsar el boton 'Seguir' del reproductor sin contestar  4) Dejar correr 15 
   - observado: La narracion reanuda con la pregunta todavia viva y visible (dock 'abierto-activo', las 4 opciones enabled). A los 159.8 s el subtitulo dice 'Un aumento del ingreso mueve la linea hacia afuera de forma paralela, y agranda...', es decir, lee la respuesta correc

**29.** Los subtítulos escriben la respuesta en el mismo instante en que aparece la predicción
   - *predicciones* · http://localhost:57330/?lang=es , «Empezar», dejar correr hasta 1:27 (o seek(85) y play). En cuanto el audio se pausa en t=87.05 y sale la pregunta, mirar la banda de subtítulos abajo a la izquierda —
   - observado: La banda de subtítulos sí avanza al segmento que empieza en el segundo del cue, y ese segmento es la revelación. En line_vs_set (t=87.045) la pregunta es «¿Qué es entonces la recta que la bordea?» con la opción correcta «Las canastas que gastan exactamente tod

**30.** «Seguir» sigue activo con la predicción abierta: reproduce la revelación y las opciones siguen clicables después
   - *predicciones* · http://localhost:57330/?lang=es , llegar a la predicción price_effect en el reloj 2:56 (t=176.13; o seek(174.5) y play). Con la pregunta «Predice: ahora sube el precio del café. ¿Qué le pasa a la rect
   - observado: El botón está habilitado (#play, disabled=false). Al pulsarlo el audio sigue y en 3:00 la banda de subtítulos y la voz dicen «Si sube el precio del café, de tres a cuatro, la línea no se desplaza: gira», y en 3:03 «El intercepto del jugo se queda clavado donde

**31.** Al revelar price_effect, el intercepto del jugo baja de 150 a 100 justo cuando la respuesta correcta y la voz dicen que no se mueve
   - *predicciones* · http://localhost:57330/?lang=es , «Empezar» y dejar correr sin tocar nada hasta el reloj 2:56 (t=176.13; el camino natural, pasando por el cue income_shift de 2:36 que sube el ingreso a 150). Sale «Pr
   - observado: El intercepto del jugo pasa de 150 a 100 y el del café de 50 a 25: la recta se desplaza hacia adentro Y gira, las dos cosas a la vez. El estado pasa de {p1:3, p2:1, m:150} a {p1:4, p2:1, m:100} en el mismo instante. Tres segundos después la voz dice «El interc

**32.** ~~?t= mueve el gráfico pero no el audio, y como no hay barra de tiempo no existe forma de saltar a una predicción~~  ✔ arreglado
   - *predicciones* · Abrir http://localhost:57330/?lang=es&t=84 . Mirar el reloj de la barra inferior y el gráfico. Después pulsar «Empezar» y esperar 3 segundos.
   - observado: El gráfico y los subtítulos sí saltan a 84 (ejes, línea y conjunto presupuestario dibujados, subtítulo «Todas las canastas que cumplen esa desigualdad forman tu conjunto presupuestario…»), pero el reloj marca 0:00 y media.currentTime() es 0. Al pulsar «Empezar

**33.** Durante toda la práctica la banda de la ecuación contradice la ficha del bien: la ficha dice $3/kg y la ecuación dice p₁ : 3 → 4
   - *practica* · NO hace falta retroceder (esto no es F-001). 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(198); __tutoria.media.play();  y mirar la banda superior cada 2 s. Reproducido en probe/p
   - observado: Entre t=199 y t=205 la ficha dice correctamente «$4/kg». Al cruzar t≈206.9 (cue `recap`) la ficha revierte a «$3/kg» y el ledger se descomprime, pero la anotación de la ecuación se queda en «p₁ : 3 → 4» y «m/p₂ = 100 (unchanged)». Ese estado contradictorio es 

**34.** La pregunta «el ingreso sube a 150» no se puede expresar con los controles: solo cambian los precios, y el lector de pantalla se lo dice al alumno
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Contestar bien la primera mcq. 4) En «El ingreso sube a 150. Mueve la rect
   - observado: graph/manip.ts mantiene m fijo y solo deja modificar p1 y p2 (`state.p1 = state.m / newX`). La recta correcta se consigue falsificando los precios. El aria-label queda: «Línea presupuestaria de café y jugo de naranja. Ingreso 100, precios 1.9867549668874174 y 

**35.** Un checkpoint de la narración monta una segunda pregunta viva encima de la de práctica: tres tarjetas apiladas, la misma pregunta duplicada
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Contestar la primera mcq para llegar a la pregunta de arrastrar. 4) Con es
   - observado: El dock queda con tres tarjetas de pregunta apiladas y dos de ellas vivas: la de manipulación con su botón «Listo» activo, y un duplicado literal de «Tu ingreso sube de 100 a 150. ¿Qué le pasa a la línea?» con las cuatro opciones pulsables — la misma pregunta 

**36.** Después de cada pregunta abierta, el sistema vuelve a hacer una pregunta idéntica ya contestada correctamente
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Contestar todo bien; en las abiertas escribir cualquier texto (probado con
   - observado: Ocurre las tres veces que aparece una abierta, sin excepción. Ítem 5 q_cp2_why_intercept_fixed (abierta) → ítem 6 q_cs_p_mcq, literalmente la misma pregunta del ítem 3. Ítem 12 q_feas_open → ítem 13 q_feas_mcq, la del ítem 10. Ítem 19 q_slope_open → ítem 20 q_

**37.** La pregunta número 13 se consume: el contador ya está en 0 pero nada impide preguntar
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar» y hacer 12 preguntas. Mirar el composer: contador «0 preguntas», caja y botón con aspecto normal. Escribir una pregunta de verdad, por ejemp
   - observado: Con el contador a «0 preguntas» el composer sigue plenamente habilitado (data-agotado vacío, pointer-events auto, botón activo, placeholder intacto): la pantalla no distingue el estado 1 del estado 0. La pregunta se escribe, se envía y se pinta como burbuja de

**38.** El mensaje del límite promete al alumno algo que no ocurre: sus dudas no llegan al instructor
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar», gastar los 12 turnos y luego enviar dos preguntas más con un texto reconocible («MARCADOR_PERDIDO_UNO no entiendo la pendiente» y «MARCADOR
   - observado: 0 filas. En main.ts el guardado es condicional: if not r.limited: repo.record_chat(...), así que precisamente las preguntas que quedan sin responder son las únicas que no se guardan. /api/session/{id}/mastery (1456 caracteres) no contiene ninguna de las dos, y

**39.** El presupuesto de 12 preguntas está en blanco hasta que se gasta la primera
   - *chat* · Abrir http://localhost:57330/?lang=es y pulsar «✋ Preguntar». Mirar el hueco a la izquierda del botón «Preguntar» (.composer-restantes). Hacer una pregunta y volver a mirarlo.
   - observado: El span está vacío al abrir el panel (medido: "") y solo se rellena con el valor que devuelve la primera respuesta, «11 preguntas». Nunca se ve el 12. El contador solo se escribe dentro del then de send(); no hay ninguna inicialización.

**40.** Pulsar 'Empezar' durante un manipulativo repinta la recta pero deja los tiradores donde estaban, y se envía lo invisible
   - *manipulacion* · Llegar al manipulativo 'El ingreso sube a 150' (item #1). Arrastrar el extremo de x1 de 33.3 a 50 (la recta se mueve, se ve bien). Sin confirmar, pulsar el botón 'Empezar' que sigue activo debajo del 
   - observado: A los 2 s la recta vuelve sola a su posición original (x2 pasa de 503 a 356 px) porque los cues del guion la redibujan, pero los tiradores se quedan clavados en [503,396] y [62,170]: el anillo blanco queda flotando sobre el eje a ~150 px del extremo real de la

**41.** El gráfico no se restaura tras el manipulativo: la pregunta siguiente lleva la respuesta escrita en el eje
   - *manipulacion* · Llegar al manipulativo 'El ingreso sube a 150' (item #1), resolverlo bien: arrastrar el extremo de x1 de 33.3 a 50 y el de x2 de 100 a 150. Pulsar 'Listo' ('Correcto.'). Mirar el gráfico mientras se l
   - observado: La capa de manipulación se retira pero la recta se queda en la posición del alumno. El ítem #2 es 'Tu ingreso sube de 100 a 150 y los precios no cambian. ¿Cuál es el nuevo intercepto vertical?' y el gráfico, a la izquierda, muestra la etiqueta '150' en el eje 

**42.** Una respuesta CORRECTA a 'el ingreso sube' queda descrita por el propio gráfico como un cambio de precios
   - *manipulacion* · Abrir http://localhost:57330/?lang=es&t=180 (las fichas muestran precios) o dejar correr la narración. Arrancar la práctica, llegar al manipulativo 'El ingreso sube a 150' y resolverlo BIEN (extremo x
   - observado: El servidor da 'Correcto.' (score 1.0) pero el valor enviado es {p1:2.0, p2:0.667, m:100}: el modelo del arrastre no puede tocar m, solo p1 y p2. En consecuencia el aria-label del gráfico —la alternativa textual del criterio de accesibilidad— dice: 'Ingreso 10

**43.** ~~?t= mueve el dibujo pero no el reloj: la narración empieza en el segundo 0 con el gráfico del minuto 1:30~~  ✔ arreglado
   - *tiempo* · 1) Abrir http://localhost:57330/?lang=es&t=90
2) Mirar el reloj de la barra inferior y el escenario.
3) Pulsar «Empezar» y esperar 5 s.
Contraste directo: http://localhost:57330/?lang=es&variant=B&t=9
   - observado: El escenario ya está en t=90 (recta, conjunto sombreado, ecuación p₁x₁+p₂x₂=m, las dos fichas con sus cuatro estaciones encendidas) pero window.__tutoria.media.currentTime() vale 0 y el reloj marca 0:00. Al pulsar «Empezar» la narración arranca en el segundo 0

**44.** Tras un salto durante la práctica, la siguiente predicción abre el panel con la pregunta equivocada y deja dos preguntas a la vez
   - *tiempo* · 1) Abrir http://localhost:57330/?lang=es
2) window.__tutoria.media.seek(230.5) y pulsar «Empezar»; esperar a la pregunta de práctica «Tu ingreso sube de 100 a 150. ¿Qué le pasa a la línea?»
3) window.
   - observado: El panel se abre con DOS tarjetas .q visibles y clicables a la vez: arriba la pregunta de práctica que quedó colgada («Vamos a practicar un poco.» + «Tu ingreso sube de 100 a 150…», rect y=141..382) y debajo la predicción correcta (y=426..604). El primer .q —e

**45.** Durante todo el recap la banda de la ecuación sigue diciendo p₁ : 3 → 4 mientras la ficha y el gráfico dicen 3
   - *tiempo* · Camino A (sólo URL, sin ningún salto): abrir http://localhost:57330/?lang=es&t=215
Camino B (reproducción hacia delante, sin retroceder nunca): abrir ?lang=es, window.__tutoria.media.seek(200), pulsar
   - observado: La banda muestra «p₁ : 3 → 4    m/p₂ = 100 (unchanged)» mientras la ficha del café dice «precio $3/kg», el intercepto dibujado es 33.3 (=100/3, o sea p₁=3) y window.__tutoria.estado() devuelve p1:3. Dura desde t≈207 hasta el final: 26 s, todo el resumen de cie

**46.** El subtítulo enseña la respuesta de la predicción en el mismo instante en que se hace la pregunta
   - *tiempo* · Predicción 1: abrir ?lang=es, window.__tutoria.media.seek(84), pulsar «Empezar», esperar a la pausa automática en t=87.05.
Predicción 2: window.__tutoria.media.seek(121), «Seguir», esperar a la pausa 
   - observado: En t=87.045 el panel pregunta «¿Qué es entonces la recta que la bordea?» con la opción correcta «Las canastas que gastan exactamente todo el ingreso», y la banda de subtítulos, abajo, ya muestra el segmento [87.045–95.42]: «La línea presupuestaria es solamente

**47.** El enlace «English» tira la posición del alumno y vuelve al momento con el que se cargó la página
   - *tiempo* · Caso A: abrir http://localhost:57330/?lang=es, pulsar «Empezar», esperar a 0:19, pulsar «English».
Caso B: abrir http://localhost:57330/?lang=es&t=130, avanzar a 3:00 (window.__tutoria.media.seek(180)
   - observado: Caso A: el href es «?lang=en» a secas; el alumno cae en 0:00, reloj 0:00, escenario vacío, botón «Start». Pierde los 19 s. Caso B, peor: estando en 3:00 el href sigue siendo «?lang=en&t=130», el valor con el que se cargó la página hace tres minutos; el alumno 

**48.** Repasar un checkpoint deja «Correcto.» y una corrección socrática de la misma pregunta en el mismo panel, y manda dos respuestas para el mismo question_id
   - *tiempo* · 1) Abrir http://localhost:57330/?lang=es
2) window.__tutoria.media.seek(143), pulsar «Empezar»; en t=144.76 sale cp1
3) Responder «Se desplaza hacia afuera, paralela» → el panel escribe «Correcto.»
4)
   - observado: El panel muestra a la vez: la pregunta con «Correcto.» debajo, y justo después la misma pregunta otra vez con la corrección socrática «Te duplican la mesada. ¿Cambió el precio de un kilo de café medido en litros de jugo?». Se envían dos POST /api/session/<id>/

**49.** Cambiar de idioma borra la sesión entera —minuto y respuestas— sin avisar ni preguntar
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=es
2. Pulsar «Empezar» y llegar a la predicción del segundo 87 («¿Qué es entonces la recta que la bordea?»). Responder una opción.
3. Seguir hasta el checkpoint c
   - observado: La URL pasa a ?lang=en, el reloj vuelve a 0:00, el panel del tutor queda vacío («TUTOR / Ask»), hay 0 preguntas en el DOM, el session_id cambia (617608e9… → f5f1da94…) y no aparece ningún diálogo de confirmación. localStorage y sessionStorage están vacíos: no 

**50.** ~~En la variante A, ?t= mueve el dibujo pero no el reloj: la pantalla dice a la vez «segundo 0» y «segundo 110»~~  ✔ arreglado
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=es&variant=A&t=110 (equivale a ?lang=es&t=110, la A es la variante por defecto).
2. Mirar el reloj de la barra de controles y el gráfico a la vez.
3. Pulsar «Empe
   - observado: En la variante A el reloj marca 0:00 pero el gráfico ya está dibujado entero (ejes, línea, interceptos, conjunto sombreado y pendiente −3.00) y la banda de subtítulos muestra la frase del segundo 110. Al pulsar «Empezar» la narración arranca desde el principio

**51.** ~~La lección en inglés se declara en español: <html lang="es"> está fijo~~  ✔ arreglado
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=en (o simplemente http://localhost:57330/, que ya sale en inglés).
2. Leer `document.documentElement.lang`.
Reproducido en bakeoff/medir/p9-htmllang.mjs. El atrib
   - observado: `document.documentElement.lang === "es"` en las tres URLs: ?lang=en (h1 «The Budget Constraint»), ?lang=es y la raíz sin parámetro (que por defecto es inglés). El enlace de idioma sí lleva un `hreflang` correcto, pero el atributo que de verdad usan las tecnolo

**52.** ~~Durante la práctica, el botón «Seguir» reinicia la lección desde el segundo 0 y esconde la pregunta que el alumno estaba contestando~~  ✔ arreglado
   - *idioma-variante* · 1. Abrir http://localhost:57330/?lang=es&variant=B&t=228
2. Pulsar «Empezar» y esperar a que termine la narración (3:52). Se abre la práctica: «Vamos a practicar un poco.» y la pregunta «Tu ingreso su
   - observado: El reloj salta de 3:52 a 0:02 y la narración arranca desde el principio; el panel del tutor se cierra (`dock: oculto`) y la pregunta de práctica desaparece de la pantalla aunque siga en el DOM (su rectángulo pasa a 0 px de ancho). En la variante B además el ví

**53.** ~~?t=N dibuja el gráfico en el segundo N pero deja el audio en 0:00: la pantalla se contradice consigo misma~~  ✔ arreglado
   - *primeros-segundos* · 1) Abrir http://localhost:57330/?lang=es&t=100. 2) Esperar 9 s sin tocar nada. 3) Pulsar «Empezar» y mirar la pantalla a los 5 s.
   - observado: Al cargar: el lienzo ya tiene ejes + línea presupuestaria + conjunto factible dibujados y la banda de subtítulos muestra la frase del minuto 1:40 («Conviene decirlo en voz alta porque es la confusión más común: la línea no es el…»), pero el reloj marca 0:00 y 

**54.** El contador de preguntas dice «11 preguntas» en español y «11 questions left» en inglés: en español no se entiende qué cuenta
   - *primeros-segundos* · 1) Abrir ?lang=es&t=0, pulsar «✋ Preguntar», escribir cualquier pregunta y enviarla. 2) Leer la esquina inferior izquierda del compositor. 3) Repetir en ?lang=en.
   - observado: En español pone «11 preguntas» a secas (app/web/src/chat/composer.ts:32), que se lee igual de bien como «llevas 11 preguntas»; en inglés pone «11 questions left» (composer.ts:39). Al agotarlas el español muestra «0 preguntas» y la caja de texto se apaga sin má

## Se ve roto (14)

**55.** ~~En sesion en espanol, la banda de la ecuacion del checkpoint 2 escribe '(unchanged)' en ingles~~  ✔ arreglado
   - *checkpoints* · 1) http://localhost:57330/?lang=es  2) window.__tutoria.media.seek(193.5); window.__tutoria.media.play()  3) Con cp2 en pantalla (194.56 s), leer la banda superior.  Reproducido en p21-last.mjs (bloqu
   - observado: La banda dice: '▲ Cafe kg x1 $4/kg | p1: 3→4 | m/p2 = 100 (unchanged) | ● Jugo De Naranja L x2 $1/L'. La cadena '(unchanged)' aparece en ingles con ?lang=es.

**56.** ~~La banda de fórmulas escribe «slope» y «(unchanged)» en inglés dentro de la versión en español, sobre la predicción del efecto precio~~  ✔ arreglado
   - *predicciones* · http://localhost:57330/?lang=es , dejar correr hasta el reloj 2:36 y mirar la banda de fórmulas de arriba. Sigue en pantalla durante toda la predicción price_effect (2:56) y después de responderla, ha
   - observado: De 2:36 a 2:56 pone «m: 100 → 150    slope = −3 (unchanged)». Tras responder la predicción y hasta el final pone «p₁: 3 → 4    m/p₂ = 100 (unchanged)». Está clavado en el contenido, no es un fallo de render: content/packs/budget-line/pack.yaml líneas 201 y 205

**57.** A partir del tercer ítem la página desborda y en el quinto el gráfico y el reproductor quedan fuera de pantalla — justo cuando toca una pregunta de arrastrar
   - *practica* · 1) Abrir http://localhost:57330/?lang=es con ventana 1280×860. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Contestar BIEN los cuatro primeros ítems (mcq «Se des
   - observado: La altura de la página crece con cada ítem: 860 → 1137 (ítem 3) → 1628 (ítem 4) → 1821 (ítem 5) → 6860 px al final de una pasada de 21 ítems. A partir del ítem 5 el documento se ha auto-desplazado a scrollY=617 y el lienzo del gráfico está en top=-410, bottom=

**58.** Tras reiniciarse la narración quedan dos anillos azules flotando sobre un lienzo vacío
   - *practica* · 1) Abrir http://localhost:57330/?lang=es. 2) __tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play(); 3) Contestar bien la primera mcq para llegar a «El ingreso sube a 150. Mueve 
   - observado: El gráfico se vacía (sin ejes, sin recta, sin conjunto) porque a t=2 s aún no ha entrado el primer cue, pero la capa .capa-manip sobrevive al repintado: quedan dos circunferencias azules de 9 px suspendidas en medio del área blanca, en las coordenadas donde es

**59.** Se llega por Tab a la caja del tutor con el panel oculto y se gasta una pregunta a ciegas
   - *chat* · Abrir http://localhost:57330/?lang=es y, sin tocar el ratón, pulsar Tab seis veces: Empezar -> ✋ Preguntar -> English -> Ocultar subtítulos -> Transcripción -> .composer-input. Escribir «hola tutor» y
   - observado: El dock oculto no se quita del árbol: se desplaza fuera (rect x=1279, ancho 1 px) sin display:none ni inert, así que la caja sigue siendo tabulable. Se escribe, se envía, el servidor responde («¿Qué punto de la línea presupuestaria quieres encontrar primero...

**60.** En español el contador dice «0 preguntas» sin decir de qué, junto a un botón que sigue invitando a preguntar
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar» y hacer una pregunta: el contador dice «11 preguntas». Hacer once más: dice «0 preguntas». Comparar con ?lang=en, donde dice «11 questions l
   - observado: En composer.ts la cadena española es `${n} pregunta${n === 1 ? "" : "s"}` y la inglesa `${n} question(s) left`. En español queda un «11 preguntas» pelado que se puede leer igual como «llevas 11 preguntas hechas», y el caso peor es «0 preguntas» al lado de un b

**61.** Si la petición falla, el tutor dice «inténtalo otra vez» pero ya ha borrado lo que el alumno escribió
   - *chat* · Abrir http://localhost:57330/?lang=es, pulsar «✋ Preguntar», hacer una pregunta normal para comprobar que funciona, y luego provocar un fallo de red en la siguiente (en mi sonda: page.route('**/chat',
   - observado: send() hace this.input.value = "" antes del fetch, así que en el catch el texto ya no existe: la respuesta es «No pude responderte ahora. Inténtalo otra vez.» con la caja vacía y los 153 caracteres perdidos. El contador tampoco se actualiza (se queda en «11 pr

**62.** El panel del tutor estira la página: el gráfico y el botón 'Listo' no caben a la vez en pantalla
   - *manipulacion* · Ventana de 1280x860. Arrancar la práctica y contestar los ítems en orden (MCQ 1ª opción; en el manipulativo #1 arrastrar a 50/150; numérico 150; MCQ 1ª opción). Al montarse el 5º ítem, que es el manip
   - observado: .dock-body tiene overflow-y:auto pero su clientHeight crece con el contenido (scrollHeight === clientHeight siempre), así que quien crece es la PÁGINA: 860 → 1137 → 1628 → 1821 → 2134 px, y en la sesión larga hasta 3920 px. Medido con scroll a 0: el gráfico oc

**63.** Los marcadores de intercepto se quedan congelados en la recta vieja mientras el alumno arrastra
   - *manipulacion* · Llegar al manipulativo 'El ingreso sube a 150' (item #1). Arrastrar el extremo de x1 de 33.3 a 50 y el de x2 de 100 a 150. Mirar el gráfico antes de confirmar.
   - observado: Ninguno de los dos se mueve nunca. Leído del DOM durante el arrastre: .capa-interceptos circle sigue en [355.75, 396] y .capa-interceptos rect en [57, 164.75] mientras la recta pasa a 50/150 y las etiquetas SÍ se actualizan a '50.0' y '150'. En pantalla queda 

**64.** En el ítem de punto hay que acertar en un disco de 14 px y fallar por 8 px no produce absolutamente nada
   - *manipulacion* · Llegar al manipulativo de punto q_feas_manip 'Arrastra el punto hasta una canasta que puedas pagar SIN gastar todo tu ingreso' (aparece tras la sub-skill BL.FEAS; con /Users/klopezva/GithubRepos/tutor
   - observado: El punto es un <circle r=7> sin anillo ni área de agarre añadida: 14.7 px de diámetro en pantalla. Medido arrastrando: agarre a 0 y 6 px del centro → arrastra; a 8, 9, 10, 12, 16 y 22 px → no pasa absolutamente nada (ni cursor, ni destello, ni mensaje). Los ti

**65.** ~~La banda de la ecuación de la lección en español dice «slope» y «(unchanged)» en inglés~~  ✔ arreglado
   - *tiempo* · 1) Abrir http://localhost:57330/?lang=es&t=160 → banda: «m : 100 → 150    slope = −3 (unchanged)»
2) Abrir http://localhost:57330/?lang=es&t=180 → banda: «p₁ : 3 → 4    m/p₂ = 100 (unchanged)»
Es visi
   - observado: El texto renderizado es idéntico al de lang=en: «slope = −3 (unchanged)» y «= 100 (unchanged)». Cubre los dos cues comparativos de la lección, income_shift (t≈156–176) y price_pivot (t≈176–207): los 50 segundos en que se enseña qué cambia y qué no.

**66.** Los primeros 44 segundos el escenario está completamente vacío: parece que el gráfico no cargó
   - *primeros-segundos* · Abrir ?lang=es&t=0, pulsar «Empezar» y mirar sin tocar nada hasta 0:50.
   - observado: El .lienzo (620x481 px al cargar, el bloque central de la pantalla) contiene 0 elementos dibujados desde t=0 hasta t=44,3. Medido cada pocos segundos: t=5, 15, 25, 35 y 43 → 0 nodos SVG visibles. El primer trazo (los ejes) aparece en 0:44,3 con el cue «espacio

**67.** ~~«p95 12ms», un instrumento de depuración, sale en la barra del reproductor del alumno~~  ✔ arreglado
   - *primeros-segundos* · Abrir ?lang=es&t=0, pulsar «Empezar», mirar la barra inferior entre el reloj y el enlace «English».
   - observado: Aparece «p95 4ms», que va cambiando a «p95 7ms», «p95 12ms»… Es <span id="desfase" class="desfase" title="internal cue lag">, pintado en app/web/src/main.ts:107 y actualizado en main.ts:315 sin ninguna condición de modo debug ni de entorno: se muestra siempre,

**68.** ~~La ficha del bien muestra «Jugo De Naranja», con la preposición en mayúscula~~  ✔ arreglado
   - *primeros-segundos* · Abrir http://localhost:57330/?lang=es&t=0 y leer la tarjeta de la derecha, visible desde el primer fotograma.
   - observado: La tarjeta muestra «Jugo De Naranja». El texto real del nodo es «jugo de naranja»; lo transforma la regla CSS text-transform: capitalize sobre .card-name, que en CSS pone en mayúscula todas las palabras, incluidas las preposiciones. En inglés («Orange Juice») 
