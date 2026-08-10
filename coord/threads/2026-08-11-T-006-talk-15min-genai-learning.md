# T-006 Talk de 15 minutos: lecciones de IA generativa para aprender y ensenar

---
from: claude
to: fable
ts_utc: 2026-08-10T23:42:20Z
type: claim
ack: false
task: T-006
op_id: T-006-message.append-7d42cc9091b80bd8
lead: claude
thread_rev_seen: 0
thread_rev: 1
files_owned:
  - docs/sources/**
  - docs/talk/**
  - coord/work/claude/T-006-*.md
---

TL;DR: T-006 abierta EN PARALELO a T-005, sin tocar la tarea activa ni los paths de nadie. Kristian trae un informe de ChatGPT sobre IA generativa y aprendizaje y quiere un talk de 15 min con slides+audio. fable verifica los numeros; claude construye el talk. codex y agy NO se tocan: estan en T-005.

Kristian pidio tres cosas y una advertencia. Las cosas: guardar en el repo un informe
que produjo con ChatGPT, investigar mas via coord, y llegar a las lecciones mas
importantes en un talk de 15 minutos con slides + audio. La advertencia, textual:
"no pisen otras conversaciones".

Esa advertencia manda sobre todo lo demas, porque T-005 esta VIVA ahora mismo con agy
editando app/web/src/graph/** y codex revisando el juez. Por eso:

  - T-006 NO cambia la tarea activa de coord/STATE.md. T-005 sigue siendo la activa y
    su thread sigue siendo el que los wakes leen. Esta tarea corre en su propio thread.
  - T-006 NO toca ningun path de T-005: nada de app/**, content/**, ni
    coord/OPERATING_MODE.md.
  - NO se despierta a codex ni a agy. Estan ocupados y despertarlos los sacaria de su
    trabajo. Si hacen falta, es despues de que T-005 cierre, y lo decide Kristian.
  - fable es el colaborador natural: Kristian lo ofrecio como opcion ("fable-5 u opus
    sol ultra") y es el unico agente libre — H-002 lo dejo fuera del roster de
    implementacion.

MATERIAL DE ENTRADA, ya guardado en el repo:

  docs/sources/IA_generativa_aprendizaje_informe_completo.{pdf,docx}   22 paginas
  docs/sources/IA_generativa_aprendizaje_resumen_5_paginas.{pdf,docx}   5 paginas

Es un informe serio: distingue capacidad tecnica de calidad de interaccion y de efecto
de aprendizaje, usa una jerarquia de evidencia A-D, y su tesis central es que la unidad
de analisis es el sistema pedagogico completo, no el modelo. Coincide de forma
independiente con lo que T-002 encontro (Bastani, Tutor CoPilot, LearnLM/Eedi, los A/B
de Khan), lo cual es buena senal.

REPARTO, dos carriles disjuntos:

  fable  -> coord/work/fable/T-006-verificacion-cifras.md
            Verificar las cifras antes de que Kristian las diga en publico.
  claude -> docs/talk/** y coord/work/claude/T-006-*.md
            Arquitectura del talk, guion y deck.

POR QUE LA VERIFICACION ES EL CARRIL QUE IMPORTA

Kristian dijo "DO NOT CRAZY en el standards. solo solidez y confiabilidad". Traducido a
esta tarea: el riesgo no es que el talk sea poco ambicioso, es que Kristian diga en
publico un tamano de efecto que no existe. En T-002 ya nos paso dos veces — un
"$100.000 por simulacion de PhET" y un "7 cursos en 4 instituciones R1", los dos
plausibles y los dos inventados, y los dos venian etiquetados como verificados.

Este informe salio de una conversacion con ChatGPT. No es un reproche: es la razon
exacta por la que hay que comprobarlo antes de convertirlo en un talk.

- Claude
