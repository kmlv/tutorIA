# Rúbrica del criterio 1 — calidad visual y pedagógica

**Escrita ANTES de mirar ninguna captura.** Ese es su único mecanismo de defensa: una
rúbrica redactada después de ver los resultados es una racionalización con tabla. El
commit que la introduce es anterior al que añade las capturas, y eso se comprueba en git.

c1 es la única celda que el reconocimiento no podía responder —si una lección renderizada
enseña mejor que una de SVG— y por tanto la única esperanza de las opciones de vídeo. El
barrido dice que ni con un 5/5 B alcanza a A bajo los pesos pre-registrados, así que esto
**no decide el bake-off**. Lo que responde es otra pregunta, que sigue valiendo la pena:
*cuánta calidad se cede al elegir A.*

## Cómo se puntúa

Cinco instantes, capturados con `?t=` en las dos variantes, mismo segundo, misma ventana.
Los instantes se eligen aquí, ahora, por lo que el guion hace en ellos — no por cómo se
vean:

| # | `?t=` | cue | por qué ese instante |
|---|---:|---|---|
| 1 | 70 | `budget_set` | la primera vez que aparece la región, no solo la recta |
| 2 | 90 | `budget_line` | el momento del morfismo `≤` → `=`: la recta ES la frontera |
| 3 | 110 | `intercepts` | los dos interceptos, que es donde vive la mitad de las confusiones |
| 4 | 158 | `income_shift` | desplazamiento paralelo CON fantasma: comparación, no sustitución |
| 5 | 180 | `price_pivot` | pivote: el intercepto que NO se mueve es la lección entera |

Cinco dimensiones, cada una de 1 a 5, y la nota de c1 es la media. Las tres primeras son
pedagógicas y las dos últimas visuales, a propósito: si la rúbrica fuera solo estética
mediría mi gusto, y si fuera solo pedagógica no distinguiría dos dibujos del mismo hecho.

1. **Legibilidad del hecho central.** ¿Se puede decir qué afirma el gráfico en ese
   instante sin leer el subtítulo? Un 1 es "hay una recta"; un 5 es "esta recta pasa por
   estos dos interceptos y estos son sus valores".
2. **Contraste antes/después.** Cuando el guion compara —desplazamiento y pivote—, ¿está
   el estado anterior visible y distinguible del actual? Un 1 es que solo se ve el
   resultado.
3. **Ausencia de ruido.** ¿Hay algo en pantalla que no esté haciendo trabajo pedagógico en
   ese instante? Etiquetas de una fase anterior, texto duplicado, decoración.
4. **Jerarquía visual.** ¿Lo destacado es lo que la narración está diciendo en ese
   segundo?
5. **Acabado.** Tipografía, alineación, recortes, solapes, cosas cortadas por un borde.

## Reglas que hacen que el juicio no sea mío

- **Las capturas se anonimizan** antes de mirarlas: nombres `c1-<instante>-<x|y>.png`, con
  la correspondencia guardada aparte y no leída hasta después de puntuar. Se sabe que una
  es vídeo y otra DOM en cuanto se miran de cerca; lo que la anonimización protege es el
  orden y el sesgo de "esta es la que construí anoche".
- **Se puntúa instante por instante, no opción por opción**: los diez cuadros de un mismo
  `?t=` se ven juntos y se puntúan antes de pasar al siguiente. Puntuar una opción entera
  y luego la otra arrastra la nota de la primera.
- **Un defecto que sea culpa del andamiaje y no de la tecnología se anota y no se puntúa.**
  Ejemplo real y ya corregido: el vídeo se salía del contenedor y se comía el subtítulo
  quemado. Eso era CSS mío, no Remotion, y puntuarlo habría hecho perder a B por un fallo
  que no es suyo. La lista de esos casos va en el informe.
- **Kristian puede repuntuar.** La nota que yo produzca entra en `results.yaml` marcada
  como mía; si él pone otra, se sustituye y el barrido se recalcula sin tocar nada más.

## Lo que esta rúbrica no puede decir

No mide aprendizaje. Cinco cuadros fijos no dicen si un alumno entiende mejor el pivote en
vídeo o en SVG; para eso hace falta un alumno, y esa medición es de otro milestone. Lo que
mide es si la superficie *presenta* el hecho con claridad, que es una condición necesaria y
no suficiente. El informe debe decir esto en la misma frase en que dé el número.
