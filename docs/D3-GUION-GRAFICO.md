# D-3 — el guion del gráfico como datos, y si un modelo lo escribe bien

**Decisión de Kristian (2026-08-11):** *"El LLM, contra un esquema. Kristian define el
esquema una vez; el modelo genera el JSON de cada concepto. Es lo que hace barato el
concepto número 20 — y es exactamente lo que hay que probar, porque nadie ha medido si
sale bien."*

Esto es el esquema, el intérprete, y la medición.

## Qué cambió

Hasta ahora, qué hace la imagen en cada cue vivía en un `switch` dentro de
`app/web/src/graph/state.ts`. Añadir un concepto exigía escribir TypeScript, que es
justamente lo que hace caro el concepto número veinte. Ahora es
`content/packs/<id>/graph.yaml`, y el `switch` es un intérprete de cincuenta líneas.

La equivalencia está demostrada, no afirmada: `app/web/test/golden-estados.json` se
capturó ejecutando el `switch` viejo cue a cue **antes de borrarlo**, y
`test/script.golden.mjs` comprueba que el intérprete produce los diez estados idénticos.
Sin ese archivo, "lo pasé a datos" habría sido una afirmación, y la lección podría haber
cambiado en un detalle —qué intercepto se destaca en el pivote— sin que nada lo dijera,
porque el gráfico seguiría dibujándose bonito.

## La gramática, y por qué es tan pequeña

Cinco capas, cuatro destacados, dos fantasmas, tres variables. Las expresiones son de una
sola operación (`m * 1.5`, `p1 + 1`, `m`) y se evalúan **contra el ejemplo base del pack**,
nunca contra el estado corriente: así dos operaciones en distinto orden dan el mismo
resultado, y un modelo no puede romper una lección reordenando cosas que parecen
independientes.

Sin paréntesis, sin funciones, sin `eval`, sin `Function`. El parser son veinte líneas
escritas a mano, y ese es el precio de que un documento generado no pueda ejecutar código
en el navegador de un estudiante.

La estrechez no es una limitación heredada: **es la hipótesis.** La opción C del bake-off
—Manim— se descartó porque el artefacto que un modelo tendría que emitir es Python
arbitrario, donde una llamada mal escrita es un no-op silencioso. Aquí, todo lo que un
modelo pueda escribir está en el esquema o es un error ruidoso. No hay tercera opción.

## La medición

`pipeline/emit_graph.py` le da a un modelo **el guion hablado** —lo que la narración dice
en cada cue— y la lista de cues, y le pide el documento. No le da el `graph.yaml`
existente ni nada derivado de él; si se lo diera, mediría su capacidad de copiar.

Luego ejecuta el documento emitido y compara los diez estados contra los del `switch`
escrito a mano. Esa es la pregunta de verdad, que no es *"¿es JSON válido?"* sino
**"¿la lección que dibuja es la misma?"**.

### Resultado

| modelo | válido al 1.er intento | cues idénticos | coste |
|---|:--:|--:|--:|
| gpt-5.6-sol (medium) | sí | **8 / 10** | $0,054 |
| gpt-5.6-terra (low) | sí | **8 / 10** | $0,018 |
| gpt-5.6-luna (low) | sí | 5 / 10 | $0,0015 |

**Cero documentos inválidos y cero vueltas de reparación, en seis corridas.** El esquema y
la gramática aguantan: ni una expresión fuera de la gramática, ni una capa inventada, ni
un cue de más o de menos. La parte que el formato promete cumplirla, la cumple.

### Lo que las diferencias enseñan, que es más que el número

**En la primera tanda los tres modelos fallaron en el MISMO cue.** Ninguno devolvía la
imagen al ejemplo base en el `recap`: dejaban el precio subido y el fantasma a la vista.
Tres modelos distintos equivocándose igual no es ruido, así que fui a mirar qué se les
había dado. La narración del recap dice: *"¿Puedes explicar por qué el intercepto del jugo
no se mueve cuando lo que sube es el precio del café? Recapitulando."*

**No dice en ninguna parte que la imagen vuelva al caso original.** Era una decisión de
autor no escrita, y los modelos no podían deducirla. Una línea de convención en el
prompt —*un cue de cierre devuelve la imagen al ejemplo base*— subió a sol de 6 a 8, a
terra de 7 a 8, y arregló el recap en los tres.

Y las dos diferencias que quedan en los modelos fuertes son más incómodas todavía:

- **`budget_set`**: los modelos muestran la región y no la recta. La narración pregunta
  *"¿qué puntos de ese mapa puedes pagar?"*, que es el conjunto. Mi guion escrito a mano
  enciende la recta ahí. **Es defendible que los modelos tengan razón y yo esté adelantando
  la recta un cue.**
- **`income_shift`**: los modelos dejan la pendiente destacada. La narración dice *"se
  desplaza, pero no gira"*, y una de las reglas que yo mismo escribí en el prompt es
  *cuando la narración señala que algo NO se mueve, eso es lo que hay que destacar*. **Los
  modelos siguen mi regla; mi guion escrito a mano no.**

O sea: de las cuatro discrepancias iniciales de los modelos fuertes, una era información
que faltaba en la entrada y dos son casos donde el guion humano es el que se aparta. Eso
cambia qué significa el 8 de 10.

### Lo que esto NO dice

- **No es una tasa.** Son seis corridas sobre **un** concepto, y `seed` está fijo en el
  proveedor, así que repetir la misma petición no da variedad. Los tres puntos son tres
  modelos, no tres muestras.
- **No mide el concepto número veinte.** Mide el concepto número uno, que además es el que
  el guion hablado describe con más detalle porque lo escribimos sabiendo qué queríamos
  dibujar.
- **El modelo barato no vale para esto.** luna encendió los ejes y la recta en el primer
  cue, antes de que la narración introduzca nada, y dejó el ingreso subido en el pivote.
  A un centavo y medio la lección, la tentación existe; el resultado dice que no.
- **Comparar contra un guion humano no es comparar contra la verdad.** El humano era yo, de
  madrugada, y dos de las diferencias apuntan a que el modelo lo hizo mejor.

## Cómo usarlo

```bash
# emitir y comparar contra el guion escrito a mano
.venv/bin/python pipeline/emit_graph.py budget-line --lang es --contra-golden

# emitir y escribir el YAML de un pack nuevo
.venv/bin/python pipeline/emit_graph.py <pack> --lang es --escribir content/packs/<pack>/graph.yaml
```

La compuerta que lo protege es `pipeline/check_cues.py`, que ahora comprueba dos cosas
distintas: que cada cue del gráfico esté en `cues` **o** declarado en `narracion` —un cue
mudo a propósito y uno que el modelo se saltó tienen que poder distinguirse— y que tenga
entrada en `ledger`.

## El ledger, y el hallazgo que sale de medirlo

La banda de la ecuación y las fichas de los bienes eran el último `switch` de la lección.
Ya no: `graph.yaml` lleva una sección `ledger` con su propio vocabulario cerrado —revelar
estaciones de una ficha, destacar términos, comprimir, cambiar un precio— y el mismo
tratamiento de golden. `app/web/test/golden-ledger.json` se capturó **extrayendo** el
`switch` de `main.ts` por emparejamiento de llaves y ejecutándolo contra un espía;
extraído y no transcrito, porque una transcripción a mano tiene el mismo problema que el
código que sustituye: nadie comprueba que sea fiel.

Con eso, la lección entera corre desde datos. Un pack generado por un modelo ya puede
dibujar su gráfico **y** su ecuación.

### Pero el ledger NO se emite bien, y eso enseña algo

| | gráfico | ledger (idéntico) | ledger (salvo orden) |
|---|--:|--:|--:|
| gpt-5.6-sol | **8 / 10** | 3 / 10 | 4 / 10 |
| gpt-5.6-terra | 7–8 / 10 | 0 / 10 | 1 / 10 |

Probé dos arreglos y **ninguno cerró la brecha**, cosa que digo porque el resultado
negativo es parte de la medición:

1. **Darle toda la narración de cada cue** en vez de dos frases. La hipótesis era que el
   modelo no podía saber dónde se nombra "kilos" por primera vez. Con el texto completo el
   ledger siguió en 1–3 de 10.
2. **Comparar sin exigir el orden** de operaciones que conmutan —`compress` y `morphPrice`
   dan el mismo resultado en pantalla en cualquier orden—. Sube uno o dos cues, no diez.

Al mirar las diferencias concretas, el patrón es consistente entre modelos: **amontonan
todas las revelaciones en uno o dos cues** en vez de repartirlas, y eligen otro orden de
estaciones. No es que se equivoquen en qué; es que eligen otro *cuándo*.

Y esa es la distinción que vale la pena llevarse:

> Las operaciones del **gráfico** están **implicadas causalmente** por lo que la narración
> dice. *"Si sube el precio del café, de tres a cuatro, la línea gira"* determina
> `set: {p1: p1 + 1}`. No hay margen.
>
> Las operaciones del **ledger** son **decisiones pedagógicas de ritmo**. Que la ficha se
> rellene poco a poco —primero el icono, luego la unidad, luego el símbolo, luego el
> precio— es un andamiaje que elegimos nosotros, y la narración no lo determina. Un modelo
> no puede deducir una convención que no está escrita en ninguna parte.

O sea que D-3 se cumple para el gráfico y no para el ledger, y el motivo no es la
capacidad del modelo sino que la entrada no contiene la respuesta. Las salidas posibles, en
orden de coste: escribir el calendario de revelaciones como parte del guion hablado; darle
al emisor un ejemplo de pack ya escrito; o aceptar que el ledger lo teclea un humano y solo
el gráfico se genera — que sigue siendo la mitad más grande.

## Qué queda abierto

- **El calendario del ledger es una convención sin escribir.** Ver arriba. Es la decisión
  que desbloquea la otra mitad de D-3.
- **Una revisión humana sigue haciendo falta.** El 8 de 10 del gráfico con dos diferencias
  defendibles es un buen punto de partida para que un profesor corrija, no para publicar
  sin mirar.
- **La convención del recap debería estar en el esquema, no en el prompt.** Hoy es una
  frase en `emit_graph.py`. Si un pack se genera con otra herramienta, se pierde.
