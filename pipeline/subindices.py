#!/usr/bin/env python3
"""Pone subíndices de verdad en el texto que LEE el alumno.

    .venv/bin/python pipeline/subindices.py --aplicar

Kristian lo vio en una opción de respuesta: «Pivota sobre el intercepto de x2». En una
lección de microeconomía, `x2` no es una variable llamada equis-dos: es x₂, y escribirla
mal en la superficie que se usa para evaluar a alguien es un descuido que se nota.

## Por qué subíndices Unicode y no LaTeX

El JavaScript de KaTeX pesa unas veinte veces más que todo el cliente de tutorIA, así que
no viaja al navegador: las ecuaciones de verdad —las de bloque, en las fichas y en los
subtítulos— se componen EN TIEMPO DE COMPILACIÓN y llegan ya hechas.

Pero eso no sirve para el texto corrido de las preguntas, porque ese texto viaja como
texto y se pinta con `textContent` en una docena de sitios: enunciados, opciones, sondas
socráticas, revelaciones, y las respuestas que el tutor escribe en vivo. Meter HTML en
todos ellos sería abrir una docena de puertas a la inyección para poner un subíndice.

Un nombre de variable no necesita un compositor tipográfico. `x₂` es un carácter, se copia
y se pega, lo lee un lector de pantalla, y cuesta cero bytes.

## Lo que NO se toca, y es la mitad del trabajo

Los mismos nombres aparecen en campos que se EVALÚAN: `respuesta.expr`, `verificacion`,
`diagnostico_si_falla`, y los marcadores `{{p1}}` que se sustituyen por números. Cambiar
`p1` por `p₁` ahí no rompería la pantalla — rompería la CORRECCIÓN, en silencio y solo
para quien conteste bien. Por eso esto recorre campos por nombre en vez de hacer una
sustitución sobre el archivo entero.
"""
from __future__ import annotations

import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

SUB = {"x1": "x₁", "x2": "x₂", "p1": "p₁", "p2": "p₂"}

#: Se trabaja LÍNEA A LÍNEA sobre el archivo en crudo, y no cargando el YAML para volver a
#: volcarlo. Un volcado reordena, pierde los comentarios y reindenta — y en `pack.yaml` eso
#: sería destructivo de verdad: el bloque `notes:` lo lee un analizador propio que cuenta
#: espacios (`pipeline/render_math.mjs`), así que un reformateo silencioso dejaría al
#: compilador de fórmulas sin encontrar nada. Aquí solo cambian los bytes que cambian.
#:
#: En estos archivos, todo el texto que lee una persona vive bajo una clave `es:` o `en:`.
#: Es una regla de una línea, comprobable, y deja fuera por construcción `respuesta.expr`,
#: `verificacion` y las claves de `diagnostico_si_falla`, que son expresiones que el
#: corrector EVALÚA: cambiarlas ahí no rompería la pantalla, rompería la corrección — en
#: silencio, y solo para quien conteste bien.
#: Una línea de bloque:  `    es: La pendiente es ...`
LINEA_VISIBLE = re.compile(r"^\s*(?:-\s+)?(?:es|en):\s+(?!['\"])\S")

#: Un valor entrecomillado, venga en bloque o dentro de un mapa de una sola línea:
#: `- {es: "Pivota sobre el intercepto de x2", en: "...", misconception: BL-M2}`.
#: Las opciones de respuesta están escritas así, que es justo donde Kristian vio el fallo;
#: una regla que solo mire el principio de la línea las pasa por alto todas.
VALOR_CITADO = re.compile(r"\b(es|en):\s*\"([^\"]*)\"")

#: `p_1` en LaTeX no lleva la forma `p1`, así que las fórmulas de `notes:` no se rozan.
TOKEN = re.compile(r"(?<![{\w])(x1|x2|p1|p2)(?![\w}])")

#: El menos de un número negativo o de una pendiente. Solo ahí: un guion entre palabras
#: —«costo-beneficio»— o una lista con viñetas no se tocan. El signo tipográfico exige que
#: `normalizar_numeros` esté puesto en el corrector Y en el guardián de fuga del tutor; sin
#: eso, escribir bien la pendiente abriría un agujero en vez de cerrar un descuido.
MENOS = re.compile(r"(?<![\w\-])-(?=[0-9xp]|[xp][₁₂])")

#: Los que un teclado no tiene a mano y por eso se escriben en ASCII.
SIGNOS = [("<=", "≤"), (">=", "≥"), ("!=", "≠")]


def cambiar(texto: str) -> str:
    """Sustituye nombres de variable sueltos. Un marcador `{{p1}}` se queda como está: lo
    sustituye el servidor por un número antes de que nadie lo lea."""
    texto = TOKEN.sub(lambda m: SUB[m.group(0)], texto)
    for ascii_, bueno in SIGNOS:
        texto = texto.replace(ascii_, bueno)
    return MENOS.sub("−", texto)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true",
                    help="escribe los archivos; sin esto solo enseña qué cambiaría")
    args = ap.parse_args()

    total = 0
    for nombre in ("questions.yaml", "misconceptions.yaml", "pack.yaml"):
        ruta = ROOT / "content" / "packs" / "budget-line" / nombre
        if not ruta.exists():
            continue
        lineas = ruta.read_text(encoding="utf-8").split("\n")
        cambios: list[tuple[str, str]] = []
        for i, linea in enumerate(lineas):
            nueva = (cambiar(linea) if LINEA_VISIBLE.match(linea)
                     else VALOR_CITADO.sub(
                         lambda m: f'{m.group(1)}: "{cambiar(m.group(2))}"', linea))
            if nueva != linea:
                cambios.append((linea.strip(), nueva.strip()))
                lineas[i] = nueva
        total += len(cambios)
        print(f"\n{nombre}: {len(cambios)} línea(s) con subíndices")
        for antes, despues in cambios[:5]:
            print(f"   − {antes[:92]}")
            print(f"   + {despues[:92]}")
        if len(cambios) > 5:
            print(f"   … y {len(cambios) - 5} más")
        if args.aplicar and cambios:
            ruta.write_text("\n".join(lineas), encoding="utf-8")

    print(f"\n{total} en total." + ("" if args.aplicar else "  (simulacro: usa --aplicar)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
