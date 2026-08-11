# Fallos conocidos

Encontrados, reproducidos y **sin arreglar**. Están aquí y no en un comentario suelto para
que se puedan leer sin abrir el código, y con su reproducción exacta para que arreglarlos
no empiece por volver a encontrarlos.

---

## F-001 — El ledger no se reconstruye al saltar hacia atrás

**Encontrado por Kristian, 2026-08-11**, mirando la pantalla: la ficha del café decía
`$4/kg` y la ecuación, a la vez, `3 $/kg`. Dos precios para el mismo bien.

### Reproducción

Abrir `?lang=es&t=180` y después saltar hacia atrás, a 130 o a 40.

| | esperado en t=40 | observado |
|---|---|---|
| precio del café en la ficha | `$3/kg` | **`$4/kg`** |
| ledger comprimido | no (empieza en `slope`, t≈124) | **sí** |
| estaciones reveladas | 4 (glyph y unit) | **8, todas** |

### Causa

`rebuild(t)` en `app/web/src/main.ts` reconstruye el gráfico desde cero —
`estado = estadoInicial(ejemplo)` y luego reaplica los cues— pero **al ledger solo le
reaplica los cues, sin devolverlo antes a su estado inicial**.

Las operaciones del ledger son acumulativas por diseño: `revelar` enciende y no apaga,
`comprimir` y `precio` solo cambian cuando un cue lo dice. Reaplicar hacia atrás no
deshace nada. El gráfico es una función pura del tiempo; el ledger no.

Se ve entero en las tres filas de la tabla, que son el mismo fallo con tres síntomas: el
precio se queda en el del pivote, la compresión se queda puesta, y las estaciones se
quedan encendidas.

### Por qué importa más de lo que parece

No es cosmético. La banda de la ecuación existe para atar el símbolo al bien y al precio,
y en ese estado **afirma dos cosas contradictorias a la vez**. Un alumno que retrocede
para repasar la pendiente ve una derivación con `3 $/kg` junto a una ficha que dice `$4`,
y no tiene forma de saber cuál es la buena.

### Arreglo

Un `reset()` en `Ledger` —vaciar los conjuntos de estaciones mostradas, quitar la clase
`on`, descomprimir y restaurar los precios del ejemplo base— y llamarlo desde `rebuild()`
justo donde se llama a `estadoInicial`. Diez líneas y una prueba: reconstruir a t=40 tras
haber estado en 180 tiene que dar el mismo ledger que cargar directamente en t=40.

Esa prueba es la que hace falta de verdad, porque la propiedad que se rompió es
exactamente esa: **el estado en un instante no debe depender de por dónde se llegó.**
