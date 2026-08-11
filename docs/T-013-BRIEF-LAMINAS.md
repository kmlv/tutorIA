# T-013 — La lámina como unidad de contenido

**Encargo de diseño de Kristian, 2026-08-11.** Es un cambio de arquitectura, no una
iteración sobre la actual. Se abre a debate ANTES de escribir código.

## Lo que pidió, en sus palabras

> *"Vamos a hacer que la unidad de contenido sea una especie de slide, lámina. Y que dentro
> de la lámina el contenido sea bastante breve. Interactivo, con audio y/o vídeo, como
> tenemos ahora. Y que el panel del tutor, en versión chat, esté fijo. Los botones de
> 'no entiendo', 'otro ejemplo', 'más despacio', 'listo, sigamos', etcétera — hay que
> repensar dónde deben ir: si en la parte de la pantalla que tiene lámina, o en el panel
> del tutor. Algunas láminas son las preguntas que se le hacen al estudiante, y pueden
> contener diferentes formatos: selección múltiple, mover gráficos, respuesta abierta para
> teclear. En cierta forma, el panel del chat del tutor tiene que ser un side chat."*

## Por qué ahora, y por qué no es capricho

Ocho agentes condujeron la aplicación real en el navegador y encontraron **68 fallos de
interfaz confirmados** (`docs/BARRIDO-UX.md`): 12 callejones sin salida, 12 sitios donde el
sistema no responde, 30 incoherencias, 14 cosas que se ven rotas.

Al agruparlos por causa, el patrón es el que importa: **cinco hallazgos eran un solo
silencio** (los chips de ayuda no llamaban al tutor) y **cinco eran una sola línea**
(`?t=` movía el dibujo y no el audio). Los 26 que arreglé se reducían a diez causas.

Eso no es un equipo distraído. Es una arquitectura que empuja hacia el error, y la razón
de fondo se puede nombrar: **hoy la lección es una línea de tiempo continua con cosas
colgadas encima**. El audio es el reloj; los cues cuelgan del reloj; las preguntas
interrumpen el reloj; el panel del tutor aparece y desaparece según el estado. Cada
interrupción es un caso especial, y los casos especiales se multiplican entre sí — de ahí
"dos preguntas vivas a la vez", "el checkpoint monta una pregunta encima de la de
práctica", "usar el chat expulsa el gráfico".

Una lámina es un **estado discreto y nombrable**. Si la unidad es la lámina, la pregunta
"¿qué hay en pantalla?" tiene una respuesta en vez de un producto cartesiano.

## Lo que NO se toca, y no es negociable

Quien proponga tiene que respetar esto o decir explícitamente que propone cambiarlo y por
qué:

1. **La clave de respuestas no llega al navegador.** El servidor decide los veredictos.
   Costó encontrar una fuga por la que se iba el pack entero; no se vuelve atrás.
2. **El juez de respuestas abiertas está en sombra.** Corrige y guarda, y al alumno no se
   le enseña nada de eso mientras su compuerta no se apruebe con etiquetas reales.
3. **La lección es datos, no código** (`content/packs/<id>/graph.yaml`). Un concepto nuevo
   no debe exigir TypeScript. Una baraja de láminas tiene que ser datos también, y con un
   vocabulario lo bastante cerrado para que un modelo la emita sin peligro — eso está
   medido: 8 de 10 en el gráfico, 0–6 de 10 en el ledger (`docs/D3-GUION-GRAFICO.md`).
4. **Español e inglés**, los dos de primera clase.
5. **El motor de dominio y el bucle de práctica ya existen y funcionan**: criterio de
   dominio, escalera de remediación, selección de ítems. La lámina es la superficie, no el
   cerebro.
6. **El experimento D-1** empareja ítems de práctica y necesita saber qué ítem está delante
   del alumno.

## Las preguntas que el debate tiene que responder

**P1. ¿Qué es exactamente una lámina?** Su esquema como datos. Qué campos, qué puede
contener, y qué NO puede — la lección de D-3 es que un vocabulario estrecho es lo que hace
que un modelo pueda escribirlo sin romperlo en silencio.

**P2. ¿Dónde viven los botones de intención?** Kristian lo deja abierto a propósito.
"No entiendo" es una petición al TUTOR; "Listo, sigamos" es una orden a la LECCIÓN. ¿Son
la misma clase de cosa? Hoy están juntos y los cuatro primeros no hacían nada.

**P3. ¿Cómo convive el audio continuo con láminas discretas?** Hoy el audio ES el reloj.
Si la unidad es la lámina, ¿cada lámina trae su fragmento? ¿Se corta la narración en
trozos, con lo que eso cuesta en compilación y en naturalidad de la voz? ¿O el audio sigue
siendo continuo y la lámina se sincroniza con él?

**P4. ¿Qué pasa con el chat fijo cuando el alumno responde mal?** El fallo que Kristian
reportó a mano: contestó mal, el panel se fue, no le respondieron, y nunca supo la
respuesta correcta. Con un side chat fijo, ¿qué ocupa esa conversación?

**P5. ¿Cómo se migra?** Hay una lección compilada, con audio grabado, timeline con los
segundos medidos contra ese audio, y un bake-off de render decidido. ¿Qué sobrevive?

**P6. ¿Qué se pierde?** Toda arquitectura cambia unos problemas por otros. Quien proponga
tiene que decir qué empeora con su propuesta, no solo qué mejora.

## Cómo se juzga una propuesta

- **¿Cuántos de los 68 fallos deja de ser posibles por construcción?** No "los arregla":
  los hace inexpresables. Esa es la prueba de que la arquitectura es mejor y no distinta.
- **¿Puede un modelo emitir una lámina?** Con el mismo criterio medido en D-3.
- **¿Sobrevive el contenido que ya existe?**
- **¿Cabe en el presupuesto?** ~40 KB de JavaScript comprimido, sin framework en tiempo de
  ejecución. Hoy son 17,5 KB y cero dependencias.
