# T-013 — Síntesis del debate de las láminas

Tres propuestas escritas a ciegas (`fable`, `codex`, `claude-b`) y una ronda de ataque en
la que **los tres se corrigieron a la baja**. Esto es lo que quedó en pie, lo que se cayó
con evidencia, y lo que decide Kristian.

El hilo completo está en
`coord/threads/2026-08-11-T-011-implement-the-approved-display-architecture-ledger-band-stag.md`.

## 1. Lo que los tres sostienen tras atacarse

No es consenso de cortesía: cada uno intentó desmontar a los otros y esto sobrevivió.

- **Una sola lámina activa, que REEMPLAZA a la anterior.** Nunca se acumula DOM. Mata por
  construcción las tarjetas apiladas, las dos preguntas vivas a la vez, y el checkpoint
  que monta una pregunta encima de la de práctica.
- **Estado TOTAL en cada lámina, jamás un delta heredado.** Es lo que elimina F-001 —los
  dos precios del café que vio Kristian— sin arreglarlo: lo vuelve inexpresable.
- **El panel del tutor, fijo y ortogonal.** Sin estados de visibilidad. Escribir en el chat
  no cambia la lámina; el chat no puede avanzar la lección.
- **Un solo MP3, con ventanas simbólicas.** Los datos no contienen segundos.
- **El calendario del ledger SIGUE SIENDO DATO.** Los tres llegaron aquí desde posiciones
  distintas, y dos tuvieron que retirarse para llegar.

## 2. Lo que se decidió con evidencia, no con argumento

**El audio de hoy sobrevive byte a byte.** Comprobado contra `timeline.es.json`: los 15
cues caen en frontera de oración y **47 de 49 uniones tienen hueco de 0,000 s**; el único
hueco de 0,446 s lo absorbe el intervalo semiabierto. No hay que regrabar, ni trocear, ni
recompilar. Trocear en clips habría chasqueado en las uniones y roto la prosodia; los tres
mecanismos propuestos resultaron ser **el mismo con tres nombres**, y codex renombró el
suyo al conceder.

**"Una lámina de pregunta no lleva audio" es falso.** Las ventanas de `cp1` y `cp2`
contienen los enunciados **hablados** de esos checkpoints, unas tres frases y ~23 s por
idioma. Una regla que los ignore deja el 10 % de la grabación huérfano. Lo encontró
`fable` auditando a `claude-b`, y `claude-b` lo confirmó midiéndolo.

**Derivar el ledger automáticamente está refutado.** Contra `golden-ledger.json`: 1 de 9
en los destacados, y en 7 de 9 cues el conjunto derivado es un **superconjunto estricto**
del correcto — sobre-destaca por construcción y ningún léxico lo arregla. En un cue deriva
`{m,p1,p2,x1,x2}` donde lo correcto es `{x1,x2}`: exactamente el error que D-3 midió en el
modelo. Palabras de su propio autor: *"mecanizo la respuesta equivocada"*.

**Borrar el ledger tampoco.** La misma prueba tumba la alternativa de codex, que sacaba
2 de 9. Y hay un argumento estructural que codex aceptó: el ledger salió de un `switch` de
TypeScript precisamente para que un pack generado pudiera dibujar su ecuación. Devolverlo
al código **no mejora el 4/10 de D-3: borra la métrica.**

**Las láminas NO matan la variante B.** `claude-b` lo afirmó y lo retiró él mismo:
`timeline.es.B.json` lleva los mismos 15 cues en los mismos segundos, y el vídeo ya se
detiene en el checkpoint a 145,02 s. Lo que sí se rompe es el **arnés de captura** del
bake-off, que usa `?t=` para fotografiar el mismo instante en las dos opciones: hay que
reescribirlo y repetir las capturas del criterio 1. **M4 no queda invalidado.**

## 3. El número honesto

Cada uno reclamó cuántos de los 68 fallos su arquitectura vuelve **inexpresables**. Tras
auditarse:

| | ronda 1 | tras la ronda 2 | auditado por los rivales |
|---|--:|--:|--:|
| `claude-b` | 42 | 35 | ~33, disputado |
| `fable` | 36 | 33 + 3 de compilación | ~30 |
| `codex` | 33 | **27** | — |

**La intersección unánime es 25 de 68.** Ese es el suelo defendible, y es el número que
uso. No 42.

Lo que NO se arregla con arquitectura, y conviene tenerlo claro: **21 fallos siguen vivos**
en cualquiera de las tres, incluidos 8 de los 14 "se ve roto". Ninguna arquitectura mata un
`text-transform: capitalize` mal puesto. La entrega no puede prometer que el rediseño
limpia la lista.

## 4. Lo que sigue abierto, y es de Kristian

**D-A. ¿Se retira la variante B?** No es obligación técnica: las láminas la admiten. Es
coste de mantenimiento — 227 líneas de adaptador, 202 de pipeline, 199 de componente, y 16
puntos donde el resto del sistema pregunta qué variante es. Rediseñar la superficie
cargando una vía de medios ya descartada es pagar su impuesto cuando más caro sale. El
informe, las mediciones y las capturas sobreviven aunque el código se borre.

**D-B. ¿Dónde van los botones?** La pregunta que Kristian dejó abierta. La respuesta
emergente del debate, y la única con un criterio detrás en vez de un gusto: **partirlos por
destinatario**. Las órdenes a la lección —avanzar— viven en la lámina; los actos de habla
al tutor —"no entiendo", "otro ejemplo"— viven en el chat. Consecuencia concreta:
*"Listo, sigamos" deja de existir como chip*, porque avanzar no es hablarle a nadie.

**D-C. ¿Y las clases grabadas?** Otra conversación está ingiriendo 11 vídeos de ECON-100A.
Si eso se convierte en packs, la lámina deja de ser el formato de una lección y pasa a
serlo de un curso. Sube la apuesta de esta decisión y también su rentabilidad.

## 5. Lo que yo recomendaría empezar

No está decidido y no lo decido yo, pero por si sirve de punto de partida: el esquema de
`codex` es el más estrecho y el que mejor resiste la prueba de D-3; el mecanismo de audio
de `claude-b` es el único comprobado contra el archivo real; y la insistencia de `fable` en
conservar el calendario del ledger como dato es la que sobrevivió a que los otros dos la
atacaran. Una primera lámina construida con esas tres piezas es una hipótesis falsable en
un día, no un rediseño de tres semanas.
