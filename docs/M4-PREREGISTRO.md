# M4 — pre-registro de pesos

**Escrito 2026-08-11, ANTES de construir ningún adaptador y antes de medir nada.**
Ese es todo el punto del archivo: `docs/PLAN.md` §6 exige que los pesos de los cinco
criterios se fijen antes de ver resultados, porque unos pesos elegidos después no son
pesos, son la racionalización del ganador.

## Quién fija estos pesos

**Kristian, no yo.** Estos son una PROPUESTA mía, puesta aquí porque él se fue a dormir
con el bake-off ya lanzado y la alternativa era peor de las dos formas posibles: parar la
construcción entera esperando un número, o medir sin pre-registro y elegir los pesos
mirando la tabla.

Cuando él ponga los suyos, se sustituyen y se recalcula. Los míos quedan en el historial
de git, con su fecha, para que se pueda comprobar que no los moví después.

## Los pesos propuestos

| # | Criterio | Peso | Por qué |
|---|---|---:|---|
| 2 | Personalización al vuelo | **35%** | La decisión D-3 lo convirtió en el criterio que decide. Si el modelo no puede emitir el formato de una tecnología, esa tecnología cuesta horas humanas por concepto, y hay veinte conceptos. Es lo único de la lista que se multiplica por veinte. |
| 4 | Accesibilidad y mantenibilidad | **25%** | Texto en DOM contra texto en píxeles no es una preferencia estética: decide si un lector de pantalla existe y si Kristian arregla una errata editando un `.md` o re-renderizando un vídeo. |
| 1 | Calidad visual y pedagógica | **20%** | Importa, pero por debajo de lo que la intuición sugiere: las cuatro opciones son capaces de dibujar una recta legible. Lo que las separa no es el techo, es el costo de llegar a él. |
| 5 | Versatilidad entre equipos | **15%** | Real —los alumnos de BEX-PUCP no tienen máquinas nuevas— pero es la celda donde la hipótesis pre-registrada dice que el vídeo gana, y sabemos de antemano aproximadamente qué va a salir. |
| 3 | Costo por concepto | **5%** | Bajo **no** porque no importe, sino porque está casi enteramente determinado por el criterio 2, y contarlo alto sería contar lo mismo dos veces. |

## Por qué el reporte no se va a quedar en un solo número

Un ranking bajo un vector de pesos es una opinión con decimales. Así que el informe hace
además un **barrido de sensibilidad**: recorre el símplex de pesos plausibles y reporta,
para cada opción, en qué fracción de esas ponderaciones gana.

Eso convierte la pregunta de los pesos en algo empírico en vez de un juicio a ciegas:

- Si una opción gana en el noventa por ciento del símplex, **los pesos no importan** y la
  discusión sobre ellos era innecesaria.
- Si el ganador cambia entre ponderaciones razonables, **ese es el hallazgo**: significa
  que la decisión es realmente sobre qué valoramos, no sobre qué tecnología es mejor, y
  entonces la decide Kristian y no una tabla.

## Hipótesis pre-registrada (del PLAN §6, sin cambios)

El MP4 gana en equipos viejos —decodificación por hardware, casi cero JavaScript— y
pierde en personalización. El HTML es lo inverso. El híbrido hereda de ambos según la
celda.

Se registra aquí para que la matriz pueda **falsarla**. Si sale exactamente esto, hemos
confirmado lo que ya creíamos y el bake-off valió sobre todo por los números concretos.
Si sale otra cosa, el bake-off se pagó solo.

## Lo que se mide y lo que no

Se mide con los instrumentos que ya existen y desde esta máquina, según la decisión de
Kristian del 2026-08-10: instrumentación en página (el desfase interno que el cue engine
ya registra en `lagSummary`), throttling de CPU y red desde el navegador, y su equipo
viejo como celda cualitativa.

**No** se mide el desfase percibido en hardware ajeno. Se pierde y se acepta.
