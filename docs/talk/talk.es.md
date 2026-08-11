# Un chatbot no es un tutor

Spanish version of the talk. Derived from `talk.en.md`, which is the approved source of
record — do not change content here without changing it there first. 15 minutes.
Audience: teaching colleagues and people who decide what software enters a course.

Format: one `## SLIDE` block per slide. The `<!--visual ... -->` comment holds the slide
HTML; everything else in the block is the narration, spoken in order. `build_deck.py`
turns this file into the deck plus the narration file fed to `audioexplain`. Slide ids
match `talk.en.md` exactly; only the visible and spoken language changes.

**Provenance of every number on these slides.** See the preamble of `talk.en.md`:
every figure was verified against primary sources in T-002 (claude) and T-006 (fable) —
`coord/work/claude/T-002-carril-C-tutores-llm-juez.md` and
`coord/work/fable/T-006-verificacion-cifras.md`. Do not add a number to a slide without
adding it to one of those two files first.

---

## SLIDE 1 — Title

<!--visual
<div class="title-slide">
  <h1>Un chatbot no es un tutor</h1>
  <p class="sub">Lo que dice la evidencia sobre IA y aprendizaje — y qué pedir antes de
  que una de estas herramientas entre a tu curso</p>
  <p class="meta">Corte de evidencia: agosto de 2026</p>
</div>
-->

Quiero empezar con un experimento que debería incomodarnos un poco a todos.

Después voy a dar el número honesto sobre si algo de esto funciona.

Y voy a terminar con las preguntas que yo haría antes de dejar una de estas herramientas
cerca de mis estudiantes.

## SLIDE 1b — Where this comes from

<!--visual
<h2>De dónde sale esta charla</h2>
<div class="pipeline">
  <div class="step"><b>1 · Borrador</b><span>Un informe de investigación que generé en
    una conversación con un modelo de lenguaje</span></div>
  <div class="step"><b>2 · Verificación</b><span>9 cifras principales re-verificadas
    contra los papers originales &nbsp;·&nbsp; <b>8 se sostuvieron, 1 estaba mal</b></span></div>
  <div class="step"><b>3 · Mapa</b><span>Una revisión previa de esta literatura desde tres
    ángulos: sistemas de tutoría, interfaces y autoría, tutores LLM desplegados</span></div>
  <div class="step"><b>4 · Esta charla</b><span>Cada diapositiva indica cuál de los tres
    te está mostrando</span></div>
</div>
<p class="note">Cada afirmación en estas diapositivas lleva una de cuatro etiquetas:</p>
<div class="eyebrow-row">
  <span class="prov prov-e">Evidencia <span class="src">· autor, año</span></span>
  <span class="prov prov-s">Nuestra síntesis <span class="src">· basada en A + B</span></span>
  <span class="prov prov-r">Nuestra recomendación</span>
  <span class="prov prov-p">Nuestro proyecto <span class="src">· aún sin evaluar</span></span>
</div>
<div class="provbar"><b>Taxonomía:</b> <span class="chain">diseñada por codex ·
auditoría de procedencia de todas las diapositivas en coord/work/codex/T-006-procedencia.md</span></div>
-->

Antes de la evidencia, treinta segundos sobre de dónde sale esta charla, porque deberían
poder distinguir mis fuentes de mis opiniones.

Empezó como un informe de investigación que generé en una conversación con un modelo de
lenguaje.

Esa es una forma perfectamente buena de empezar y una forma pésima de terminar, así que
nada de ahí llegó a una diapositiva sin haberse verificado contra el paper original.

Nueve cifras principales se re-verificaron así. Ocho se sostuvieron.

Una estaba mal, y se las voy a mostrar más adelante, porque corregirla terminó haciendo
el argumento más fuerte, no más débil.

Debajo de eso hay una revisión previa de esta misma literatura desde tres ángulos
separados: la tradición de los tutores inteligentes, el lado de las interfaces y la
autoría, y los tutores con modelos de lenguaje que ya están desplegados hoy.

Así que de aquí en adelante, cada afirmación en estas diapositivas lleva una de cuatro
etiquetas.

Evidencia, con el autor y el año, significa que alguien lo midió.

Nuestra síntesis significa que construimos la conclusión comparando fuentes. La cita
prueba los insumos, no la conclusión.

Nuestra recomendación significa que es un juicio sobre qué conviene hacer, y ningún
experimento lo estableció.

Y nuestro proyecto significa que es un hecho sobre la cosa que estamos construyendo, que
no es lo mismo que un resultado.

Las dos del medio son las que deberían discutirme, y traté de hacerlas fáciles de
encontrar, no fáciles de pasar por alto.

## SLIDE 1c — The question Bastani et al. asked

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · el experimento del daño</p>
  <h2>“Cómo la IA generativa afecta el <em>aprendizaje</em>: cómo los humanos adquieren
  nuevas habilidades mientras realizan tareas.”</h2>
  <p class="qline"><b>La comparación:</b> tres brazos — un asistente sin restricciones, un
  tutor con salvaguardas, y práctica sin tecnología. La clase y el examen final sin
  asistencia son idénticos en los tres brazos; solo cambia la herramienta de práctica.</p>
  <p class="qline"><b>No autoriza:</b> afirmar que la IA daña el aprendizaje en general.
  El brazo con salvaguardas es la prueba de que el daño no es inevitable.</p>
  <p class="cite">Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., &amp; Mariman, R.
  (2025). <i>PNAS</i>, 122(26), e2422633122.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta de investigación citada del abstract</span></span> <span class="chain">Compilado en T-006 (fable) a partir de la fuente primaria</span></div>
-->

Antes del resultado, la pregunta que se propusieron responder, en sus palabras: cómo la
IA generativa afecta el aprendizaje — cómo los humanos adquieren nuevas habilidades
mientras realizan tareas.

Fíjense en que la pregunta es sobre adquisición, no sobre desempeño. Eso es lo que hace
funcionar el diseño.

## SLIDE 2 — The experiment

<!--visual
<h2>Un experimento, tres grupos</h2>
<div class="arms">
  <div class="arm"><span class="arm-n">1</span><b>Chat sin restricciones</b>
    <span>práctica con un asistente estándar</span></div>
  <div class="arm"><span class="arm-n">2</span><b>Versión tutora</b>
    <span>el mismo modelo, con salvaguardas: pistas, nunca la respuesta</span></div>
  <div class="arm"><span class="arm-n">3</span><b>Control</b>
    <span>práctica sin tecnología</span></div>
</div>
<p class="note">≈1.000 estudiantes de matemáticas de secundaria, asignados al azar.
Práctica <b>con</b> la herramienta. Luego se retira la herramienta y todos rinden el mismo
examen.</p>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Bastani et al. 2025, PNAS</span></span> <span class="chain">Fuente primaria → investigado en T-002 (claude) → citado aquí</span></div>
-->

Casi mil estudiantes de matemáticas de secundaria fueron asignados al azar a tres
grupos.

El primer grupo practicó con un asistente de chat corriente, sin restricciones.

El segundo grupo practicó con el mismo modelo de fondo, pero envuelto en salvaguardas.
Estaba construido para dar pistas y no soltar la respuesta.

El tercer grupo practicó como siempre han practicado los estudiantes, sin ninguna
tecnología.

Después, los investigadores retiraron la asistencia, y les dieron a los tres grupos el
mismo examen.

Guarden ese último paso, porque es todo el diseño. La medición ocurre después de que la
ayuda desaparece.

## SLIDE 3 — The result

<!--visual
<h2>Qué pasó</h2>
<table class="results">
  <tr><th></th><th>Durante la práctica<br><span>con la herramienta</span></th>
      <th>En el examen<br><span>sin ella</span></th></tr>
  <tr><td><b>Chat sin restricciones</b></td>
      <td class="up">+48%</td><td class="down">−17%</td></tr>
  <tr><td><b>Con tutor y salvaguardas</b></td>
      <td class="up">+127%</td><td class="flat">≈ control</td></tr>
</table>
<p class="note">Ambos relativos al grupo de control. Las salvaguardas eliminaron el daño.
No produjeron una ventaja.</p>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Bastani et al. 2025, PNAS</span></span> <span class="chain">Fuente primaria → verificado en T-002 (claude)</span></div>
-->

Durante las sesiones de práctica, el grupo sin restricciones rindió un cuarenta y ocho
por ciento mejor que el grupo de control.

En el examen, sin la herramienta, los mismos estudiantes rindieron un diecisiete por
ciento peor que el grupo de control.

Ahora miren la versión tutora, la construida con cuidado, con salvaguardas.

Durante la práctica le fue todavía mejor. Un ciento veintisiete por ciento por encima del
control.

Y en el examen quedó al nivel del grupo de control. Ni mejor, ni peor.

Así que el diseño cuidadoso logró algo real. Eliminó el daño. Lo que no hizo fue producir
ninguna ventaja medible de aprendizaje propia.

## SLIDE 4 — The lesson

<!--visual
<div class="big-idea">
  <p class="kicker">La lección</p>
  <h2>El desempeño <em>con</em> la herramienta no es aprendizaje.</h2>
  <p class="sub">El número que más parecía éxito era el que menos lo predecía.</p>
</div>
<div class="provbar"><span class="prov prov-s">Nuestra síntesis <span class="src">· basada en Bastani + la literatura de ITS</span></span> <span class="chain">Ningún paper lo dice con estas palabras; la inferencia es mía</span></div>
-->

Quiero ser cuidadoso con lo que esto muestra y lo que no.

No es evidencia de que la inteligencia artificial dañe el aprendizaje en general. El
segundo grupo es la prueba de que no tiene por qué.

Es evidencia sobre la medición, y eso la hace más útil, no menos.

El momento que más parecía éxito — un estudiante resolviendo más problemas, más rápido,
con ayuda disponible — fue el momento que menos nos dijo sobre si algo se había
aprendido.

Y aquí está la consecuencia práctica para cualquiera que elige software. Si evalúas una
herramienta viendo a los estudiantes usarla, eso puede llevarte a preferir las
herramientas que más trabajo hacen por ellos.

No estoy afirmando que eso sea lo que los compradores hacen sistemáticamente — nadie lo
ha medido. Estoy afirmando que este experimento muestra que la métrica es capaz de
invertir el ranking.

Lo cual es razón suficiente para desconfiar un poco de una demostración que se siente
maravillosa.

## SLIDE 4b — The question the meta-analysis asked

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · el metaanálisis</p>
  <h2>“La tecnología educativa adaptativa promete la personalización de la enseñanza a
  una fracción de su costo, pero las estimaciones experimentales varían mucho en magnitud
  y en signo, y las síntesis existentes <em>son anteriores a la IA generativa</em>.”</h2>
  <p class="qline"><b>Qué hicieron:</b> llevaron las plataformas de aprendizaje asistido
  por computadora y las herramientas de IA generativa a un marco común, con criterios de
  inclusión comunes, en una escala común de tamaño de efecto.</p>
  <p class="qline"><b>No autoriza:</b> dar los subgrupos por zanjados. Los autores los
  llaman sugerentes, no concluyentes, y ningún estudio incluido es de un país de ingreso
  bajo.</p>
  <p class="cite">Burneo, A., Dinarte-Diaz, L., Lopez, C., &amp; Molina, E. (2026). Background
  paper, <i>World Development Report 2026</i>, World Bank. Working paper.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta de investigación citada del abstract</span></span> <span class="chain">Verificado en T-006 (fable) contra el PDF primario</span></div>
-->

Y lo mismo para el metaanálisis, porque su pregunta dice qué puede zanjar.

Los autores señalan que las estimaciones experimentales varían mucho en magnitud y hasta
en signo, y que las síntesis existentes son todas anteriores a la IA generativa.

Así que lo que construyeron es un marco común: plataformas adaptativas de la generación
anterior y herramientas generativas nuevas, con los mismos criterios de inclusión, en la
misma escala de tamaño de efecto.

Eso es lo que hace posibles las dos diapositivas siguientes, y es también la razón de que
puedan comparar las generaciones.

## SLIDE 5 — So does it work?

<!--visual
<h2>Entonces, ¿funciona?</h2>
<div class="stat-row">
  <div class="stat"><span class="stat-n">+0,125</span><span class="stat-u">DE</span>
    <span class="stat-l">efecto promedio sobre el aprendizaje<br>vs instrucción tradicional</span></div>
  <div class="stat"><span class="stat-n">14</span>
    <span class="stat-l">ensayos aleatorizados<br>191 tamaños de efecto, 10 economías</span></div>
  <div class="stat"><span class="stat-n">+0,12</span><span class="stat-u">DE</span>
    <span class="stat-l">el subconjunto de tutoría<br>e instrucción con IA</span></div>
</div>
<p class="note">Un efecto real. Por encima de la mediana de las intervenciones educativas
de campo. No una revolución. <b>La base, leída con honestidad:</b> un working paper del
Banco Mundial, aún sin revisión por pares; 14 estudios; ningún estudio incluido de un país
de ingreso bajo.</p>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Burneo et al. 2026, World Bank</span></span> <span class="chain">Working paper, sin revisión por pares → verificado en T-006 (fable) · el juicio de “no es una revolución” es mío</span></div>
-->

Entonces, ¿algo de esto funciona? Sí, en promedio, modestamente, y el número honesto no
es emocionante.

El metaanálisis más reciente agrupa ciento noventa y una estimaciones de efecto de
catorce ensayos aleatorizados en diez economías.

El efecto promedio sobre el aprendizaje es de más o menos un octavo de desviación
estándar. Más cero coma uno dos cinco.

El subconjunto que es específicamente tutoría o instrucción con inteligencia artificial
queda aproximadamente en el mismo valor.

Es un efecto genuino, y queda por encima de la mediana de las intervenciones educativas
medidas en aulas reales. Vale la pena tenerlo.

También es cierto que no es una transformación de la educación, y quien les venda una va
por delante de la evidencia.

Y como voy a pasar el resto de la charla siendo exigente, déjenme ser justo un momento
con lo que esta tecnología hace genuinamente bien.

Está disponible a las once de la noche, cosa que ningún tutor mío estuvo jamás.

Es infinitamente paciente, y no suspira cuando un estudiante hace la misma pregunta por
tercera vez.

Explica la misma idea de cuatro maneras distintas, en el idioma del estudiante, al nivel
de lectura que haga falta.

Esas son ganancias reales de acceso, y para algunos estudiantes el acceso es todo el
problema.

Mi argumento no es que esto no valga nada. Es que el acceso y la disponibilidad no son lo
mismo que la instrucción, y la evidencia solo nos premia cuando construimos lo segundo
encima de lo primero.

## SLIDE 6 — The number nobody quotes

<!--visual
<div class="big-idea">
  <p class="kicker">El número que nunca aparece en un pitch</p>
  <h2>IA generativa vs la generación anterior de tutores adaptativos</h2>
  <div class="stat-inline"><span class="stat-n">0,022</span><span class="stat-u">DE</span>
    <span class="stat-l">diferencia estimada &nbsp;·&nbsp; error estándar <b>0,075</b>
    &nbsp;·&nbsp; IC [−0,15, 0,19]</span></div>
  <p class="sub">No es evidencia de equivalencia. Es ausencia de una ventaja demostrada.</p>
  <p class="note">En palabras de los propios autores: el intervalo <em>“acota la diferencia
  entre generaciones en lugar de resolverla”</em> — y “el registro experimental hasta la
  fecha no muestra ninguna ventaja para la tecnología más nueva.”</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Burneo et al. 2026 — palabras de los propios autores</span></span> <span class="chain">Fuente primaria → verificado en T-006 (fable) · “sigue siendo el punto de referencia” es lectura mía</span></div>
-->

Aquí está el número que casi nunca aparece en una presentación de producto.

Cuando comparas los sistemas generativos contra la generación anterior de software de
tutoría adaptativa — la que existía mucho antes de los grandes modelos de lenguaje — la
diferencia estimada es de unas dos centésimas de desviación estándar.

El error estándar de esa estimación es más de tres veces la estimación misma.

Quiero decirlo con cuidado, porque es fácil exagerar en cualquiera de las dos
direcciones.

Esto no es prueba de que las dos sean equivalentes. La base de evidencia sencillamente
todavía no puede ordenar las generaciones.

Pero sí significa algo concreto para una decisión de compra. La tecnología más vieja,
menos conversacional, menos impresionante a la vista, sigue siendo el punto de
referencia, y no ha sido batida.

## SLIDE 7 — The average hides the lesson

<!--visual
<h2>El promedio es la parte menos interesante</h2>
<table class="results wide">
  <tr><th>Estudio</th><th>Efecto</th><th>Qué se desplegó en realidad</th></tr>
  <tr><td>Física universitaria, crossover</td><td class="up">≈ +0,63 DE</td>
      <td>lecciones escritas por expertos, soluciones verificadas, secuencia impuesta por la plataforma</td></tr>
  <tr><td>Nigeria, extraescolar</td><td class="up">≈ +0,31 DE</td>
      <td>IA + tiempo adicional + docentes presentes + estudiantes trabajando en parejas</td></tr>
  <tr><td>Sierra Leona, a escala de escuela</td><td class="up">+0,258 DE</td>
      <td>clases dirigidas por docentes; los docentes fijan los objetivos</td></tr>
  <tr><td>Tutor de lectura con IA + una persona<br>para impulsar el engagement</td><td class="flat">≈ 0</td>
      <td><b>ambos brazos tenían la plataforma</b>; lo que se aleatorizó fue añadir a una
      persona cuyo trabajo era el engagement, no la enseñanza</td></tr>
</table>
<p class="note">Cada fila, leída con honestidad: el resultado de física son dos lecciones
con examen inmediato en una universidad de élite; Nigeria perdió 569 de 1.328 estudiantes
antes del examen final; Sierra Leona es un informe del proveedor, no revisado por pares.</p>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Kestin 2025 · De Simone 2025 · LearnLM/Fab AI 2026 · Robinson 2026</span></span> <span class="chain">Los cuatro verificados en T-006 (fable) · Sierra Leona es un informe del proveedor</span></div>
-->

El promedio es la parte menos interesante de ese metaanálisis, porque la dispersión
alrededor es enorme.

Un estudio crossover en física universitaria encontró unas seis décimas de desviación
estándar.

Un programa extraescolar en Nigeria encontró unas tres décimas.

Un despliegue a escala de escuela en Sierra Leona encontró un cuarto de desviación
estándar.

Y un par de ensayos sobre un tutor de lectura con inteligencia artificial no encontró
esencialmente nada en lectura.

Esa última fila necesita una advertencia, y prefiero dársela yo a que la encuentren
después. En esos ensayos los dos grupos ya tenían la plataforma. Lo que se aleatorizó fue
añadir a un ser humano cuyo trabajo era mantener a los estudiantes usándola. Así que el
nulo es sobre el apoyo humano, no sobre el acceso en sí.

La misma tecnología a grandes rasgos. Resultados completamente distintos. Así que la
pregunta interesante no es si la inteligencia artificial funciona. Es qué distingue la
fila de arriba de la de abajo.

## SLIDE 7b — What each of those three actually asked

<!--visual
<h2>Tres estudios, tres preguntas distintas</h2>
<div class="qgrid">
  <div><b>Kestin et al. — física</b>
    <span>“Medir la diferencia en cuánto aprenden los estudiantes … cuando <em>material
    idéntico</em> se presenta mediante un tutor de IA en comparación con un aula de
    aprendizaje activo.”<br><br>No es IA contra nada. No es IA contra una clase magistral.
    Es IA contra lo mejor que ya hacemos.</span></div>
  <div><b>De Simone et al. — Nigeria</b>
    <span>“Si la IA generativa … puede ayudar a resolver ese problema” — grandes déficits
    de aprendizaje con recursos docentes escasos.<br><br>El control “no recibió ninguna
    intervención”. Así que +0,31 DE es el efecto de todo el paquete extraescolar, no del
    modelo.</span></div>
  <div><b>LearnLM/Fab AI — Sierra Leona</b>
    <span>“¿Cómo afecta la <em>integración dirigida por docentes</em> de Guided Learning en
    las clases de matemáticas … a los resultados de aprendizaje?”<br><br>La misma formación
    docente en ambos brazos. La pregunta es sobre la integración, no sobre la app.</span></div>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· preguntas citadas de cada paper</span></span> <span class="chain">Compilado y revisado en T-006 (fable) · Sierra Leona es un informe del proveedor</span></div>
-->

Vale la pena poner las tres preguntas lado a lado, porque no son la misma pregunta y los
tamaños de efecto no son comparables como la tabla los hace parecer.

Kestin preguntó si un tutor de inteligencia artificial supera a un aula de aprendizaje
activo cuando el material es idéntico. No IA contra nada, y no IA contra una clase
magistral — IA contra lo mejor que ya sabemos hacer. Es la comparación más dura del
conjunto, y por eso ese número llama tanto la atención.

Nigeria preguntó si la IA generativa puede ayudar con déficits grandes de aprendizaje y
recursos docentes escasos. Su grupo de control no recibió ninguna intervención. Así que
las tres décimas son el efecto de todo el paquete extraescolar, no del modelo que va
adentro.

Sierra Leona preguntó otra cosa distinta: cómo afecta a los resultados la integración de
la herramienta, dirigida por los docentes, en las clases de matemáticas. Los dos brazos
tuvieron la misma formación docente. La pregunta ahí es sobre la integración, no sobre la
aplicación.

Tres preguntas, tres contrastes, una tabla. Así es exactamente como se malinterpreta una
literatura.

## SLIDE 8 — Effects are recipes

<!--visual
<div class="big-idea">
  <h2>En estos casos, los efectos grandes parecen <em>recetas</em>,
  no propiedades del modelo.</h2>
  <ul class="clean">
    <li>Contenido escrito y verificado por expertos en la materia</li>
    <li>Una secuencia que la plataforma impone desde <b>fuera</b> del modelo</li>
    <li>Tiempo adicional que de verdad se agendó</li>
    <li>Un docente o facilitador en el aula</li>
  </ul>
  <p class="sub">Copiar la marca no reproduce el tratamiento.
  Copiar el prompt tampoco.</p>
</div>
<div class="provbar"><span class="prov prov-s">Nuestra síntesis <span class="src">· basada en Kestin + Nigeria + Sierra Leona</span></span> <span class="chain">Los ingredientes están medidos; que formen una receta necesaria, no</span></div>
-->

Miren qué se desplegó en realidad en estos cuatro casos, y aparece un patrón.

El resultado de física usó lecciones diseñadas por expertos en la materia, con soluciones
resueltas preparadas de antemano, y una secuencia que la plataforma imponía desde fuera
del modelo.

Ese detalle merece un momento. Los investigadores reportaron que el prompt por sí solo no
lograba sostener la secuencia de enseñanza de forma fiable, así que sacaron la secuencia
del prompt y la pusieron en el software de alrededor.

El programa nigeriano fueron sesiones extraescolares, con tiempo de instrucción
adicional, docentes presentes y estudiantes trabajando en parejas.

Sierra Leona fueron clases normales, dirigidas por docentes que fijaban los objetivos.

En estos casos de efecto alto, lo que se puso a prueba es un paquete: contenido
verificado, una secuencia impuesta, tiempo protegido y personas.

Quiero ser cuidadoso aquí, porque esta es mi lectura y no un hallazgo. Nadie ha probado
si esos cuatro ingredientes son necesarios uno por uno, y Sierra Leona no los contiene
todos.

Lo que sí me atrevo a decir es la versión negativa. Copiar la marca no reproduce el
tratamiento. Y copiar el prompt tampoco lo reproduce.

## SLIDE 8b — The question Robinson et al. asked

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · el nulo del uso efectivo</p>
  <h2>“Un tutor humano presencial y comprometido cuyo rol es apoyar el engagement del
  estudiante con un tutor de lectoescritura basado en IA, <em>no impartir instrucción
  directa</em>.”</h2>
  <p class="qline"><b>La comparación:</b> los estudiantes usaron la plataforma de
  lectoescritura con IA de forma independiente, o con ese tutor presencial. <b>Ambos brazos
  tenían la plataforma.</b></p>
  <p class="qline"><b>No autoriza:</b> “el acceso a un tutor de IA produjo cero
  aprendizaje” como resultado experimental. No hay brazo sin IA, así que este diseño no
  puede estimar el acceso contra nada.</p>
  <p class="cite">Robinson, C. D., Gormley, D., Trindade Ribeiro, A., &amp; Loeb, S. (2026).
  EdWorkingPaper 26-1451, Annenberg Institute, Brown University.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta de investigación citada de la introducción</span></span> <span class="chain">Esta ficha existe porque fable detectó que la charla malinterpretaba el contraste (T-006)</span></div>
-->

Y este se los quiero dar con cuidado, porque una versión anterior de esta charla lo
entendió mal, y es el tipo de error que se descubre en la ronda de preguntas y no en la
preparación.

Lo que probaron fue un tutor presencial cuyo rol era apoyar el engagement con un tutor de
lectoescritura basado en inteligencia artificial — explícitamente no impartir
instrucción.

Los dos grupos tenían la plataforma. Lo que se aleatorizó fue el ser humano.

Así que este estudio no puede decir qué pasa cuando comparas el acceso contra nada,
porque no hay un brazo sin la IA.

## SLIDE 9 — The null result that matters most

<!--visual
<h2>La métrica que se movió, y la que no</h2>
<p class="lede">Dos ensayos aleatorizados, ≈350 estudiantes de primaria. <b>Ambos brazos
tenían el tutor de IA.</b> Lo que se aleatorizó: añadir un tutor presencial cuyo rol era
el engagement, no la instrucción.</p>
<div class="stat-row">
  <div class="stat"><span class="stat-n">+71–80%</span>
    <span class="stat-l">engagement<br><b>el número que va en la presentación</b></span></div>
  <div class="stat"><span class="stat-n">+1 a 4</span>
    <span class="stat-l">minutos de uso real<br>por semana &nbsp;·&nbsp; <b>la dosis real</b></span></div>
  <div class="stat"><span class="stat-n">0</span>
    <span class="stat-l">mejora<br>en lectura</span></div>
</div>
<p class="note">Descriptivo, no aleatorizado: en el brazo de solo acceso casi la mitad
nunca abrió la plataforma, y quienes la abrieron promediaron 2–5 minutos por semana.
<b>Un porcentaje no son minutos.</b></p>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Robinson et al. 2026</span></span> <span class="chain">Cadena de corrección: el informe fuente decía 4,4 min → el abstract primario dice 1–4 → corregido tras verificación en T-006 (fable)</span></div>
-->

El resultado más útil de esta área es un resultado nulo, y es el menos discutido.

Dos ensayos aleatorizados, unos trescientos cincuenta niños de primaria. Los dos grupos
tenían el tutor de lectura con IA. Lo que se puso a prueba fue añadir a una persona cuyo
trabajo era mantenerlos usándolo.

El engagement subió entre un setenta y uno y un ochenta por ciento.

Ese es el número que va en la presentación. Ahora el mismo resultado en términos
absolutos.

El uso promedio subió entre uno y cuatro minutos por semana.

Y la lectura no mejoró nada.

Este me parece el par de números más clarificador de toda la literatura, porque los dos
son verdad y cuentan historias opuestas.

Una subida relativa del engagement del ochenta por ciento suena a adopción. De uno a
cuatro minutos por semana no es una dosis de nada.

Hay un número más aquí, y quiero etiquetarlo con cuidado porque es descriptivo y no
aleatorizado. En el brazo que tenía la plataforma y ningún apoyo humano, casi la mitad de
los estudiantes nunca la abrió, y quienes la abrieron promediaron de dos a cinco minutos
por semana.

Así que guarden este en el bolsillo para la próxima vez que alguien proponga comprar
licencias para todos. El uso efectivo no es un detalle de implementación. Es parte del
tratamiento, y hay que planificarlo y medirlo como tal.

## SLIDE 10 — What is under the conversation

<!--visual
<h2>La conversación es la superficie</h2>
<div class="stack">
  <div class="layer surface">Conversación e interfaz</div>
  <div class="layer">Salvaguardas — intento antes de la pista, sin respuesta a demanda, apoyo que se retira</div>
  <div class="layer">Herramientas y verificación — cálculo y datos <b>fuera</b> del modelo</div>
  <div class="layer">Política pedagógica — qué hacer a continuación, y por qué</div>
  <div class="layer">Modelo del estudiante — una estimación estructurada, no un historial de chat</div>
  <div class="layer">Modelo del dominio — conceptos, prerrequisitos, soluciones resueltas</div>
  <div class="layer base">Orquestación humana y medición independiente</div>
</div>
<div class="provbar"><span class="prov prov-s">Nuestra síntesis <span class="src">· marco de diseño, condensado del §3 del informe fuente</span></span> <span class="chain">Una arquitectura recomendada, no un efecto medido</span></div>
-->

Si los efectos vienen de paquetes, vale la pena preguntarse qué contiene un paquete.

La conversación es la superficie. Es la parte que se ve en una demostración, y
normalmente la única parte que una demostración enseña.

Debajo, un sistema serio necesita un mapa de la materia, con prerrequisitos y soluciones
resueltas.

Necesita una estimación estructurada de lo que sabe este estudiante en particular. No un
historial de conversación — un estado de verdad, que se pueda inspeccionar.

Vale la pena aterrizar esa distinción, porque es donde la mayoría de los productos fallan
sin hacer ruido.

Un historial de chat dice: este estudiante preguntó dos veces por la restricción
presupuestaria y parecía confundido.

Un modelo del estudiante, en el sistema que estamos construyendo, podría decir en cambio:
este estudiante sabe calcular la pendiente, no sabe interpretarla como costo de
oportunidad, no ha demostrado el conjunto factible en absoluto, y las últimas dos piezas
de evidencia llegaron con pistas, así que no cuentan.

Lo primero es una transcripción. Lo segundo es algo que un docente puede leer, discutir y
corregir.

Necesita una política explícita de qué hacer a continuación, y una razón para elegirlo.

Necesita herramientas que calculen y verifiquen, fuera del modelo que conversa.

Necesita límites sobre lo que está dispuesto a revelar, y un apoyo que se retira a medida
que el estudiante mejora.

Y necesita un docente que pueda ver lo que el sistema cree y pasarle por encima, más una
forma de medirse que no sea su propia opinión.

## SLIDE 11 — Four levels of personalization

<!--visual
<h2>Cuatro niveles de "personalizado"</h2>
<ol class="levels">
  <li><b>Presentación</b> — tono, idioma, extensión, legibilidad
      <span class="tag common">común</span></li>
  <li><b>Interacción</b> — el ejemplo, la pista, la siguiente pregunta en este turno
      <span class="tag common">común</span></li>
  <li><b>Decisión pedagógica</b> — la siguiente acción, elegida a partir de un diagnóstico
      <span class="tag rare">evidencia escasa</span></li>
  <li><b>Trayectoria</b> — entre sesiones: prerrequisitos, olvido, transferencia
      <span class="tag rare">evidencia escasa</span></li>
</ol>
<p class="note big">Recordar tu nombre no es lo mismo que estimar lo que sabes.</p>
<div class="provbar"><span class="prov prov-s">Nuestro marco <span class="src">· taxonomía nuestra, no validada</span></span> <span class="chain">La evidencia causal pública no aísla los niveles 3–4; la división es nuestra</span></div>
-->

La palabra personalizado está haciendo muchísimo trabajo no ganado en este campo, así que
ayuda partirla en cuatro niveles.

El nivel uno cambia la presentación: tono, idioma, extensión, nivel de lectura.

El nivel dos cambia la interacción: qué ejemplo, qué pista, qué pregunta viene después en
este turno.

Muchos de los productos que les van a mostrar se quedan ahí, y los dos niveles son
genuinamente útiles para el acceso.

El nivel tres elige la siguiente acción a partir de un diagnóstico de qué falló este
estudiante, y por qué.

El nivel cuatro mantiene una trayectoria entre sesiones, siguiendo prerrequisitos, olvido
y transferencia.

El tres y el cuatro son lo que este marco trata como adaptación pedagógica genuina. Debo
tener cuidado con cómo digo la parte siguiente: la evidencia causal pública no aísla esos
niveles ni nos dice que los efectos viven ahí. Es más delgada que eso.

El test que más útil me resulta es este. Un sistema que recuerda tu nombre, adopta un
tono cálido y reformula el mismo contenido puede sentirse profundamente personal sin
estimar nada en absoluto sobre lo que sabes.

## SLIDE 12 — What to ask for

<!--visual
<div class="big-idea">
  <p class="kicker">La pregunta que separa un sistema de una demo</p>
  <h2>"Muéstrame el modelo del estudiante antes y después de tres respuestas.<br>
  ¿Qué cambió, y por qué?"</h2>
</div>
<ol class="checks">
  <li>Currículo trazable a fuentes que tú autorizaste</li>
  <li>Un estado del estudiante que el docente puede ver — y corregir cuando está mal</li>
  <li>Una política de ayuda explícita: intento antes de la pista, sin respuesta a demanda, apoyo que se retira</li>
  <li>Cálculo y verificación de datos hechos por herramientas, fuera del modelo de lenguaje</li>
  <li>Evidencia en tu población, en tu resultado, medida sin la herramienta presente</li>
</ol>
<div class="provbar"><span class="prov prov-r">Nuestra recomendación <span class="src">· mi lista corta de 5 puntos, condensada de los 10 requisitos del informe</span></span> <span class="chain">Normativo. Ningún experimento estableció esta lista</span></div>
-->

Así que esto es lo que yo pediría, y cabe en una sola diapositiva.

Empiecen con una pregunta, porque separa un sistema real de una buena demostración.

Muéstrame el modelo del estudiante antes y después de tres respuestas. Dime qué cambió, y
por qué cambió.

Si la respuesta es un historial de chat más largo, están viendo el nivel dos disfrazado
de nivel cuatro.

Después, cinco verificaciones.

¿El currículo es trazable a fuentes que ustedes autorizaron, y no a la web abierta?

¿Puede el docente ver el estado estimado, y corregirlo cuando está mal?

¿Hay una política de ayuda explícita — un intento requerido antes de la pista, sin
respuesta a demanda, y un apoyo que se retira a medida que el estudiante mejora?

¿El cálculo y la verificación de datos los hacen herramientas fuera del modelo de
lenguaje, y no el modelo corrigiendo su propia aritmética?

¿Y hay evidencia en una población como la de ustedes, en un resultado como el de ustedes,
medida sin la herramienta en el aula?

Si solo tienen dos minutos con un proveedor, hay una prueba más rápida. Siéntense frente
al sistema y pídanle, sin rodeos, que les dé la respuesta de una vez.

Después pidan otra vez, y sean un poco groseros al pedirlo.

Lo que están probando es si la negativa es una política o una personalidad. Una política
aguanta la tercera petición. Una personalidad cede, y cada uno de sus estudiantes lo va a
descubrir antes de que termine la primera semana.

## SLIDE 13 — How to measure

<!--visual
<div class="big-idea">
  <p class="kicker">La regla de medición</p>
  <h2>Examen independiente. Sin IA presente. Idealmente con demora.</h2>
  <p class="sub">Todo lo demás — satisfacción, engagement, problemas por hora — mide
  productividad. Vale la pena registrarlo. No es el resultado.</p>
  <p class="note big">Y cuenta los minutos reales de uso. Una licencia no es una dosis.</p>
</div>
<div class="provbar"><span class="prov prov-r">Nuestra regla de medición <span class="src">· informada por Bastani + el marco de evaluación</span></span> <span class="chain">Un estándar que recomendamos, no una estimación</span></div>
-->

Y sobre ese último punto, la regla de medición es tan corta que se puede recordar de
camino a la salida.

El resultado primario debería ser un examen independiente, tomado sin el sistema
presente, e idealmente con una demora de días o semanas.

Todo lo demás — satisfacción, engagement, problemas completados por hora, acierto en la
siguiente pregunta — mide productividad con asistencia.

Vale la pena registrar esas cosas. Yo las registro. Simplemente no son el resultado, y el
primer experimento que les mostré es lo que pasa cuando se las trata como si lo fueran.

Y cuenten minutos reales de uso, por estudiante. No licencias emitidas, ni cuentas
creadas.

## SLIDE 13b — Three questions nobody has answered

<!--visual
<h2>Tres preguntas que nadie ha respondido</h2>
<p class="lede">No es una lista de deseos. Cada una está sin responder, cambiaría lo que
haces el próximo semestre, y tiene una razón por la que no se ha hecho.</p>
<ol class="questions">
  <li><b>¿El modelo aporta algo más allá del paquete en el que viene?</b>
    <span>Ningún ensayo tiene un control activo: mismo tiempo adicional, misma estructura,
    misma supervisión adulta, sin la IA.</span></li>
  <li><b>¿Generativa o la generación anterior — cuál, con el mismo contenido y tiempo?</b>
    <span>El ensayo cara a cara no existe. Nuestro 0,022 del titular es una comparación
    entre estudios, no una carrera.</span></li>
  <li><b>¿El uso efectivo es en sí mismo el tratamiento?</b>
    <span>Nadie ha mantenido la herramienta constante y aleatorizado cómo entra al aula.</span></li>
</ol>
<div class="provbar"><span class="prov prov-s">Nuestra síntesis <span class="src">· brechas identificadas en T-006 (fable)</span></span> <span class="chain">Cada brecha revisada contra los estudios del registro</span></div>
-->

Quiero cerrar la parte de evidencia con las tres preguntas que nadie ha respondido,
porque para esta audiencia son más útiles que las respuestas que sí tenemos.

Cada una tuvo que pasar un filtro: ningún estudio del registro la responde, una respuesta
cambiaría lo que hacen el próximo semestre, y puedo decirles por qué no se ha hecho.

## SLIDE 13c — Question one: the missing control

<!--visual
<div class="big-idea">
  <p class="kicker">Pregunta uno</p>
  <h2>¿El modelo aporta algo más allá del paquete en el que viene?</h2>
</div>
<div class="qgrid">
  <div><b>La brecha</b><span>Todos los efectos positivos grandes son un paquete — IA
    <em>más</em> tiempo adicional agendado, estructura y atención adulta — medido contra un
    control que no recibió nada adicional. El control de Nigeria no recibió ninguna
    intervención; el tratamiento tuvo 18 horas adicionales de sesiones supervisadas. Rori
    añadió dos sesiones de 30 minutos sobre la clase normal.</span></div>
  <div><b>Por qué te importa</b><span>Si la mayor parte de la ganancia es el bloque de
    práctica agendado y supervisado, puedes correr ese bloque sin comprar nada. Si es la IA,
    la licencia es el ingrediente más barato. Decisiones de presupuesto opuestas.</span></div>
  <div><b>Por qué sigue sin respuesta</b><span>Un control activo casi duplica el costo y
    responde una pregunta que ni los proveedores ni los investigadores implementadores
    tienen motivación para hacer — en el metaanálisis, los investigadores implementaron
    16 de 19 intervenciones.</span></div>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· De Simone 2025 · Henkel 2024 · Burneo 2026</span></span> <span class="chain">Los diseños vienen de los papers; que la brecha importe para tu presupuesto es inferencia mía</span></div>
-->

Pregunta uno. ¿El modelo aporta algo más allá del paquete en el que viene?

Todos los efectos positivos grandes de esta literatura son un paquete. La IA, más tiempo
adicional agendado, más estructura, más atención adulta — medidos contra un grupo de
control que no recibió nada adicional.

En Nigeria el control no recibió ninguna intervención, mientras el grupo de tratamiento
tuvo dieciocho horas adicionales de sesiones supervisadas. En Ghana fueron dos medias
horas adicionales por semana encima de la clase normal.

Así que nadie ha corrido el brazo que lo zanjaría: mismo tiempo adicional, misma
estructura, misma supervisión adulta, y sin IA.

Y fíjense por qué esto importa para el presupuesto. Si la mayor parte de ese tercio de
desviación estándar viene del bloque de práctica agendado y supervisado, entonces pueden
correr ese bloque sin comprar nada. Si viene del software, la licencia es el ingrediente
más barato de la receta.

Son decisiones opuestas, y hoy la evidencia no puede separarlas.

¿Por qué nadie lo ha hecho? Un control activo casi duplica el costo del estudio, y
responde una pregunta que ni los proveedores ni los investigadores implementadores tienen
especial motivación para hacer. En el metaanálisis que les mostré, los propios
investigadores implementaron dieciséis de las diecinueve intervenciones.

## SLIDE 13d — Question two: the race that was never run

<!--visual
<div class="big-idea">
  <p class="kicker">Pregunta dos</p>
  <h2>¿Generativa, o la generación anterior — con el mismo contenido, en el mismo tiempo?</h2>
</div>
<div class="qgrid">
  <div><b>La brecha</b><span>Ningún estudio aleatoriza estudiantes entre una plataforma
    adaptativa pre-LLM y un tutor generativo enseñando el mismo currículo en el mismo
    tiempo. El 0,022 de antes es una estimación <em>entre estudios</em>: ensayos,
    poblaciones, materias y dosis distintas.</span></div>
  <div><b>Por qué te importa</b><span>Esta es la decisión de compra real. El linaje
    auditable, más barato y no conversacional marca +0,18 a +0,37 DE. Hoy la elección entre
    ambos se hace con demos.</span></div>
  <div><b>Por qué sigue sin respuesta</b><span>Requiere dos sistemas de nivel de producción
    con contenido idéntico, y zanja una comparación que ningún proveedor quiere perder. Un
    metaanálisis solo puede sintetizar los experimentos que existen.</span></div>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· Burneo 2026 · Muralidharan 2019 · Roschelle 2016</span></span> <span class="chain">La ausencia de un ensayo cara a cara se estableció en T-006 (fable)</span></div>
-->

Pregunta dos. ¿Generativa, o la generación anterior, con el mismo contenido en el mismo
tiempo?

Antes les mostré cero coma cero dos dos, y les debo una aclaración sobre qué clase de
número es. Es una comparación entre estudios — ensayos distintos, poblaciones distintas,
materias distintas, dosis distintas — no una carrera entre dos sistemas.

La carrera nunca se ha corrido. Ningún estudio aleatoriza estudiantes entre una
plataforma adaptativa anterior a los modelos de lenguaje y un tutor generativo enseñando
el mismo currículo en la misma cantidad de tiempo.

Y esta es la decisión de compra que de verdad está sobre la mesa. El linaje más viejo,
auditable, más barato y no conversacional marca entre cero coma uno ocho y cero coma tres
siete de desviación estándar. No es un competidor débil.

Así que hoy la elección entre las dos generaciones se hace con la fuerza de una
demostración, porque el número cara a cara no existe.

Está sin responder porque requiere dos sistemas de nivel de producción construidos sobre
contenido idéntico, que es caro, y porque zanja una comparación que ningún proveedor
quiere perder.

## SLIDE 13e — Question three: is take-up the treatment?

<!--visual
<div class="big-idea">
  <p class="kicker">Pregunta tres</p>
  <h2>¿El uso efectivo es en sí mismo el tratamiento?</h2>
</div>
<div class="qgrid">
  <div><b>La brecha</b><span>El modo de integración predice los resultados casi
    perfectamente — el uso obligatorio, dirigido por docentes y agendado da +0,26 a +0,31
    DE; el acceso opcional da un uso casi nulo. Pero esa comparación cruza herramientas,
    materias y países distintos, así que la integración está confundida con todo.</span></div>
  <div><b>Por qué te importa</b><span>Responde si poner un enlace en el programa del curso
    es una intervención o un placebo — y si el recurso escaso que hay que planificar es la
    herramienta o el tiempo protegido en el que los estudiantes deben usarla.</span></div>
  <div><b>Por qué sigue sin respuesta</b><span>El campo registra el uso como covariable de
    implementación en lugar de diseñarlo como el tratamiento. Y aleatorizar la política de
    horario dentro de una escuela levanta objeciones de equidad que los añadidos
    extraescolares evitan sin decirlo.</span></div>
</div>
<div class="provbar"><span class="prov prov-s">Nuestra síntesis <span class="src">· basada en Sierra Leona + Nigeria + Robinson</span></span> <span class="chain">El modo de integración está confundido entre estudios — ese es el punto, no un hallazgo</span></div>
-->

Pregunta tres, y es la que más me gustaría que alguien en esta sala respondiera. ¿El uso
efectivo es en sí mismo el tratamiento?

En estos estudios, cómo entra la herramienta al aula predice el resultado casi
perfectamente. El uso obligatorio, dirigido por docentes y agendado da entre un cuarto y
un tercio de desviación estándar. El acceso opcional da un uso casi nulo.

Pero esa comparación cruza herramientas distintas, materias distintas y países distintos,
así que el modo de integración está confundido con todo lo demás.

Nadie ha mantenido la herramienta constante y aleatorizado la política: uso agendado
dentro de clase, contra acceso opcional recomendado.

Para un departamento, esa es la pregunta con dinero encima. Dice si poner un enlace en el
programa del curso es una intervención real o un placebo, y si el recurso escaso que hay
que proteger no es el software, sino la hora en el horario en la que los estudiantes de
verdad están obligados a usarlo.

Está sin responder en parte por un punto ciego — el campo registra el uso como detalle de
implementación en lugar de diseñarlo como el tratamiento — y en parte porque aleatorizar
la política de horario dentro de una escuela levanta objeciones de equidad que un añadido
extraescolar evita sin decirlo.

Y hay una cuarta pregunta que voy a mencionar solo de pasada, porque es la que debería
avergonzarnos a todos. La proposición que motiva toda esta literatura es que la
personalización se puede entregar a una fracción del costo de la tutoría humana. Solo dos
de los catorce estudios reportan costos por estudiante en una base comparable. La tutoría
humana se agrupa alrededor de cero coma dos nueve de desviación estándar, contra cero
coma uno dos del subgrupo de IA. Si la IA gana por dólar — que es el único marco en el
que un departamento decide de verdad — esencialmente nunca se ha medido junto a los
efectos que se supone que justifica.

## SLIDE 14 — Applying it to our own work

<!--visual
<h2>Qué cambió esto en nuestro propio proyecto</h2>
<p class="lede"><b>tutorIA</b> — un tutor interactivo pequeño para microeconomía
intermedia: explicación narrada, una recta presupuestaria manipulable, preguntas sin
calificación, y un juez que diagnostica concepciones erróneas por su nombre.</p>
<ol class="changes">
  <li><b>El tutor interrumpe en puntos diseñados</b>, en lugar de esperar en una ventana de
  chat abierta — el mayor tutor de IA desplegado reporta que la mayoría de sus estudiantes
  simplemente nunca usó el chat.</li>
  <li><b>La evidencia obtenida con ayuda no cuenta para el dominio</b> — una pista invalida
  el intento, y reevaluamos con un ítem nuevo.</li>
  <li><b>Una verificación sin asistencia al final de cada concepto</b> — sin nota, nunca
  mostrada al estudiante como evaluación, alimenta solo el diagnóstico del instructor.</li>
</ol>
<div class="provbar"><span class="prov prov-p">Nuestro proyecto <span class="src">· decisiones informadas por evidencia, no resultados</span></span> <span class="chain">tutorIA no ha sido evaluado. No se ha corrido ningún ensayo</span></div>
-->

Déjenme cerrar aplicando esto a mi propio trabajo, porque es fácil dar esta charla y
después no seguirla.

Estamos construyendo un tutor interactivo pequeño para microeconomía intermedia.
Explicación narrada, una recta presupuestaria que el estudiante puede arrastrar,
preguntas sin calificación, y un componente que diagnostica concepciones erróneas por su
nombre.

Leer esta evidencia cambió tres decisiones.

La primera: el tutor interrumpe en puntos diseñados en el guion, en lugar de esperar
detrás de una ventana de chat abierta. El tutor de IA desplegado más grande del mundo
reporta que la mayoría de sus estudiantes simplemente nunca usó el chat, y ahora lo están
reconstruyendo para que sea visible durante la tarea.

La segunda: la evidencia obtenida con ayuda no cuenta para el dominio. Si un estudiante
toma una pista, ese intento deja de contar, y en su lugar hacemos una pregunta nueva.

Debo ser preciso sobre de dónde viene esa regla, porque sería fácil exagerar. La regla
viene de los sistemas de tutoría de los años noventa, donde pedir una pista ya invalidaba
el intento. Bastani no prueba esa regla. Lo que Bastani aporta es la advertencia moderna
que nos mandó a buscarla.

La tercera, y con la que menos cómodo estoy: una verificación sin asistencia al final de
cada concepto. Sin nota, nunca presentada al estudiante como una evaluación, alimentando
solo el diagnóstico del instructor.

La añadimos por una razón. Sin ella, un tutor que produjera exactamente el resultado de
aquel primer experimento se vería, en nuestros propios datos, idéntico a uno excelente.

Y para ser honesto sobre dónde estamos: nada de eso es todavía un resultado. Es un
conjunto de decisiones de diseño que se siguen de la evidencia de otros.

No hemos corrido un ensayo. No sabemos si nuestro tutor enseña algo.

Lo que sí puedo decirles es que diseñamos el instrumento que nos permitiría averiguarlo
antes de terminar la cosa que mide — y yo le pediría lo mismo a cualquiera que nos quiera
vender algo.

## SLIDE 15 — The line to remember

<!--visual
<div class="closing">
  <h2>El avance decisivo no es un sistema que suene más a docente.</h2>
  <p class="closing-body">Es un sistema que puede decir qué cree que sabe el estudiante,
  por qué eligió el siguiente paso, cuándo debe quedarse callado — y, sin ser juez de su
  propio trabajo, si el estudiante de verdad aprendió.</p>
</div>
<div class="provbar"><span class="prov prov-s">Nuestra conclusión</span> <span class="chain">Ningún paper identifica “el avance decisivo”. Esta conclusión es mía</span></div>
-->

Si se llevan una sola frase de esta charla, me gustaría que fuera esta.

El avance decisivo no es un sistema que suene más a docente.

Es un sistema que puede decirte qué cree que sabe el estudiante, por qué eligió el
siguiente paso, cuándo le conviene quedarse callado, y — sin ser juez de su propio
trabajo — si el estudiante de verdad aprendió.

Gracias.

## SLIDE A1 — References

<!--visual
<h2>Referencias</h2>
<div class="refs">
<p><b>Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., &amp; Mariman, R.</b> (2025).
Generative AI without guardrails can harm learning: Evidence from high school mathematics.
<i>PNAS</i>, 122(26), e2422633122. doi.org/10.1073/pnas.2422633122</p>
<p><b>Burneo, A., Dinarte-Diaz, L., Lopez, C., &amp; Molina, E.</b> (2026). Can EdTech Close
Learning Gaps? Global Evidence from Digital Interventions. Background paper, <i>World
Development Report 2026</i>, World Bank. Working paper, not peer-reviewed.</p>
<p><b>Kestin, G., Miller, K., Klales, A., Milbourne, T., &amp; Ponti, G.</b> (2025). AI tutoring
outperforms in-class active learning: An RCT introducing a novel research-based design in an
authentic educational setting. <i>Scientific Reports</i>, 15, 17458.
doi.org/10.1038/s41598-025-97652-6</p>
<p><b>De Simone, M., Tiberti, F., Barron Rodriguez, M., Manolio, F., Mosuro, W., &amp;
Dikoru, E. J.</b> (2025). From Chalkboards to Chatbots: Evaluating the Impact of Generative AI
on Learning Outcomes in Nigeria. World Bank Policy Research Working Paper 11125.</p>
<p><b>LearnLM Team, Google &amp; Fab AI</b> (2026). Teaching with Gemini: Measuring the impact
of Guided Learning on student mathematics progress in Sierra Leone. Technical report
(provider-produced, not peer-reviewed).</p>
<p><b>Robinson, C. D., Gormley, D., Trindade Ribeiro, A., &amp; Loeb, S.</b> (2026). Access is
Not Enough: Human Support Improves Engagement with AI Tutoring. EdWorkingPaper 26-1451,
Annenberg Institute, Brown University. doi.org/10.26300/pz7p-p388</p>
<p><b>Muralidharan, K., Singh, A., &amp; Ganimian, A. J.</b> (2019). Disrupting Education?
Experimental Evidence on Technology-Aided Instruction in India. <i>American Economic Review</i>,
109(4), 1426–1460. doi.org/10.1257/aer.20171112</p>
<p><b>Henkel, O., Horne-Robinson, H., Kozhakhmetova, N., &amp; Lee, A.</b> (2024). Effective and
Scalable Math Support: Evidence on the Impact of an AI-Tutor on Math Achievement in Ghana.
arXiv:2402.09809. Preprint.</p>
<p><b>Roschelle, J., Feng, M., Murphy, R. F., &amp; Mason, C. A.</b> (2016). Online Mathematics
Homework Increases Student Achievement. <i>AERA Open</i>, 2(4), 1–12.
doi.org/10.1177/2332858416673968</p>
<p><b>Wang, R. E., Ribeiro, A. T., Robinson, C. D., Loeb, S., &amp; Demszky, D.</b> (2024).
Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise. arXiv:2410.03017.</p>
<p><b>LearnLM Team, Google, &amp; Eedi</b> (2025). AI tutoring can safely and effectively
support students: An exploratory RCT in UK classrooms. arXiv:2512.23633.</p>
</div>
-->

## SLIDE A2 — How this talk was made

<!--visual
<h2>Cómo se hizo esta charla</h2>
<div class="method">
<p>El informe fuente fue desarrollado por <b>Kristian con ChatGPT</b>. Como salió de un
modelo de lenguaje, ninguna cifra llegó a una diapositiva sin haberse verificado contra la
fuente primaria.</p>
<p class="role">Afirmaciones numéricas verificadas contra fuentes primarias por <b>fable</b>
(tarea T-006). Nueve cifras principales: ocho se sostuvieron, una se corrigió — la cifra de
uso de Robinson es “1 a 4 minutos”, no 4,4. El efecto en inglés de Nigeria es 0,23 DE, no
0,24. Sierra Leona se cita por su ITT de 0,258, no por su ToT.</p>
<p class="role">Preguntas de investigación, contrastes de los estudios y las tres preguntas
abiertas compiladas por <b>fable</b> (T-006), quien además detectó que Robinson aleatorizó el
<i>apoyo humano añadido</i>, no el acceso — lo que corrigió dos diapositivas.</p>
<p class="role">Investigación de antecedentes por <b>codex</b>, <b>claude</b> y <b>agy</b>
(tarea T-002), en tres carriles disjuntos: internos de sistemas de tutoría, interfaces y
autoría, y tutores LLM desplegados.</p>
<p class="role">Taxonomía de procedencia y auditoría de cada afirmación de estas diapositivas
por <b>codex</b> (T-006), que levantó siete blockers contra borradores anteriores — todos
aplicados.</p>
<p class="role">Selección, síntesis y redacción de la charla por <b>claude</b> y Kristian.
<b>Kristian es el principal y el presentador.</b></p>
<p>Nombrar las herramientas no es un adorno. Si un número de una diapositiva está mal, este
es el rastro que seguirías para averiguar por qué.</p>
</div>
-->

## SLIDE A3 — Backup · Mindspark

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · el punto de referencia pre-LLM</p>
  <h2>“El impacto de un programa personalizado de instrucción extraescolar asistida por tecnología en grados de secundaria básica en la India urbana, usando una lotería que dio a los ganadores acceso gratuito al programa.”</h2>
  <p class="qline"><b>La comparación:</b> ganadores de la lotería (acceso gratuito al programa extraescolar) vs perdedores de la lotería. De nuevo un paquete: software adaptativo más sesiones extraescolares agendadas.</p>
  <p class="qline"><b>Autoriza:</b> +0,37 DE en matemáticas y +0,23 DE en hindi en 4,5 meses, con tecnología adaptativa <b>anterior a los modelos de lenguaje</b>. Ganancias absolutas similares para todos, ganancias relativas mayores para los estudiantes más rezagados. Este es el punto de referencia que la generación generativa no ha batido de forma demostrable.</p>
  <p class="qline"><b>No autoriza:</b> nada sobre IA generativa — aquí no hay modelo de lenguaje. Ese es precisamente su papel en esta charla.</p>
  <p class="cite">Muralidharan, K., Singh, A., &amp; Ganimian, A. J. (2019). <i>American Economic Review</i>, 109(4), 1426–1460.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta citada de la fuente</span></span> <span class="chain">Verificado en T-006 (fable) contra el artículo publicado</span></div>
-->

## SLIDE A4 — Backup · Rori (Ghana)

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · acceso con bajo ancho de banda</p>
  <h2>“El impacto de Rori, un tutor conversacional de matemáticas con IA accesible por WhatsApp, en el desempeño matemático de aproximadamente 1.000 estudiantes de los grados 3–9 en 11 escuelas de Ghana.”</h2>
  <p class="qline"><b>La comparación:</b> el control continuó con la instrucción regular de matemáticas; el tratamiento usó Rori en dos sesiones de 30 minutos por semana durante 8 meses <b>además de</b> la instrucción regular — tiempo adicional otra vez.</p>
  <p class="qline"><b>Autoriza:</b> d = 0,36–0,37, en teléfonos básicos sobre redes de bajo ancho de banda. La historia de acceso importa en contextos de bajos recursos.</p>
  <p class="qline"><b>No autoriza:</b> tratarlo como confirmatorio. Preprint; asignación a nivel de escuela con solo 11 unidades; tiempo de instrucción añadido sin controlar. La advertencia de los propios autores: “los resultados deben interpretarse con cautela, pues solo reportan el año 1.”</p>
  <p class="cite">Henkel, O., Horne-Robinson, H., Kozhakhmetova, N., &amp; Lee, A. (2024). arXiv:2402.09809. Preprint.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta citada de la fuente</span></span> <span class="chain">Verificado en T-006 (fable) · preprint, tratar como preliminar</span></div>
-->

## SLIDE A5 — Backup · ASSISTments

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · el otro punto de referencia pre-LLM</p>
  <h2>“¿Aprenden más los estudiantes de escuelas que usan ASSISTments para la tarea de matemáticas que los estudiantes de escuelas que hacen la tarea sin ASSISTments?”</h2>
  <p class="qline"><b>La comparación:</b> escuelas aleatorizadas a ASSISTments — tarea en línea con retroalimentación inmediata <b>más formación docente</b> — contra las prácticas de tarea habituales.</p>
  <p class="qline"><b>Autoriza:</b> g = 0,18 a escala estatal durante un año escolar completo; 2.850 estudiantes de séptimo grado, 43 escuelas, Maine. Los estudiantes con bajo rendimiento previo fueron los que más se beneficiaron.</p>
  <p class="qline"><b>No autoriza:</b> afirmaciones sobre chatbots — no hay modelo de lenguaje. Y el efecto incluye la formación profesional docente, no solo el software.</p>
  <p class="cite">Roschelle, J., Feng, M., Murphy, R. F., &amp; Mason, C. A. (2016). <i>AERA Open</i>, 2(4), 1–12.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta citada de la fuente</span></span> <span class="chain">Verificado en T-006 (fable) contra el artículo publicado</span></div>
-->

## SLIDE A6 — Backup · Tutor CoPilot

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · IA dirigida al tutor, no al estudiante</p>
  <h2>“Formar a educadores noveles con orientación experta es importante para la efectividad pero costoso … Presentamos Tutor CoPilot, un enfoque novedoso Humano-IA que aprovecha un modelo del pensamiento experto para dar orientación de tipo experto a los tutores mientras tutoran.”</h2>
  <p class="qline"><b>La comparación:</b> tutores aleatorizados a acceso o no acceso. <b>El modelo nunca habla con el estudiante.</b> Prerregistrado; 900 tutores, ~1.800 estudiantes en escuelas Title I, grados 3–8.</p>
  <p class="qline"><b>Autoriza:</b> +4 puntos porcentuales en el exit ticket de la plataforma (62% → 66%), y la mayor parte del beneficio va a los tutores peor calificados. Un menú cerrado de siete estrategias elegidas por humanos es una división del trabajo viable.</p>
  <p class="qline"><b>No autoriza:</b> ganancias de aprendizaje en general: el examen estandarizado distal fue nulo. El efecto significativo es sobre la propia compuerta de progresión de la plataforma.</p>
  <p class="cite">Wang, R. E., Ribeiro, A. T., Robinson, C. D., Loeb, S., &amp; Demszky, D. (2024). arXiv:2410.03017.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta citada de la fuente</span></span> <span class="chain">Investigado en T-002 (claude) · pregunta citada por fable en T-006</span></div>
-->

## SLIDE A7 — Backup · Eedi / LearnLM

<!--visual
<div class="card">
  <p class="kicker">Ficha de estudio · supervisado, no autónomo</p>
  <h2>“Para evaluar si la IA generativa podría ayudar a ampliar el acceso a [la tutoría uno a uno], realizamos un ensayo aleatorizado exploratorio con N = 165 estudiantes en cinco escuelas secundarias del Reino Unido.”</h2>
  <p class="qline"><b>La comparación:</b> dos niveles. Estudiantes aleatorizados a pistas estáticas vs chat 1:1 en vivo; dentro del chat, sesiones aleatorizadas a un tutor humano solo vs <b>LearnLM redactando cada mensaje bajo supervisión humana</b> — el tutor revisaba cada borrador hasta poder enviarlo como propio.</p>
  <p class="qline"><b>Autoriza:</b> la IA supervisada igualó a los tutores humanos en remediación (93,0% vs 91,2%, intervalos superpuestos), los tutores aprobaron el 76,4% de los borradores con ediciones nulas o mínimas, y el abstract reporta +5,5 puntos en problemas nuevos.</p>
  <p class="qline"><b>No autoriza:</b> tutoría con IA autónoma — un humano revisó y aprobó cada mensaje. Ni nada confirmatorio: los autores lo llaman exploratorio, N=165, y la lista de autores incluye al proveedor y a la plataforma.</p>
  <p class="cite">LearnLM Team, Google, &amp; Eedi (2025). arXiv:2512.23633. Exploratory.</p>
</div>
<div class="provbar"><span class="prov prov-e">Evidencia <span class="src">· pregunta citada de la fuente</span></span> <span class="chain">Investigado en T-002 (claude) · pregunta citada por fable en T-006</span></div>
-->
