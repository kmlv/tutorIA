#!/usr/bin/env python3
"""Criterio 2 — personalización al vuelo, cronometrada en vez de argumentada.

    .venv/bin/python bakeoff/medir/medir_c2.py

La pregunta que responde: **un profesor cambia el ingreso del ejemplo de 100 a 120. ¿Qué
cuesta que el alumno vea la lección nueva, en cada opción?**

Es la pregunta correcta porque es la que separa de verdad a las dos tecnologías, y porque
las dos parten con la misma ventaja: los beats de la opción B **no están escritos a mano**,
salen de la misma máquina de estados que pinta la opción A. Así que esto no mide si alguien
se acordó de actualizar una copia — mide lo que queda cuando esa parte ya está resuelta.

Lo que cronometra:

  A: editar `pack.yaml` y recargar. El servidor relee el pack, el cliente vuelve a derivar
     el gráfico y el ledger. No hay nada que compilar.
  B: lo mismo, MÁS regenerar los props y volver a renderizar el MP4.

El guion hablado no se toca, y por eso este número es un SUELO para B y no su costo real.
Cambiar el ingreso a 120 hace que la narración diga "cien" mientras el gráfico dice 120;
arreglarlo de verdad exige regrabar el audio, que es un costo que las dos opciones
comparten y que ninguna de las dos paga aquí. El informe tiene que decirlo en la misma
frase que dé el número.

Restaura `pack.yaml` pase lo que pase — el `finally` no es cortesía, es que dejar el pack
del repositorio con un ingreso de prueba sería un desastre silencioso.
"""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
PACK = ROOT / "content" / "packs" / "budget-line" / "pack.yaml"
sys.path.insert(0, str(ROOT))

INGRESO_NUEVO = 120.0


def cronometrar(nombre: str, fn) -> tuple[str, float, object]:
    t0 = time.monotonic()
    r = fn()
    dt = time.monotonic() - t0
    print(f"  {nombre}: {dt:.1f} s")
    return nombre, dt, r


def main() -> int:
    respaldo = PACK.read_text(encoding="utf-8")
    medidas: dict[str, float] = {}
    try:
        original = None
        texto = respaldo
        for linea in texto.splitlines():
            if linea.strip().startswith("m:"):
                original = linea
                break
        if original is None:
            print("  no encontré `m:` en pack.yaml")
            return 2
        print(f"  cambiando {original.strip()} -> m: {INGRESO_NUEVO}")
        sangria = original[: len(original) - len(original.lstrip())]
        PACK.write_text(texto.replace(original, f"{sangria}m: {INGRESO_NUEVO}"),
                        encoding="utf-8")

        # --- A: releer el pack es todo lo que hay ---------------------------------
        def a():
            from app.server.core.content.loader import FilesystemPackSource
            p = FilesystemPackSource().get_pack("budget-line", "es")
            assert p.ejemplo.m == INGRESO_NUEVO, "el pack no recogió el cambio"
            return {"intercepto_x1": p.ejemplo.intercepto_x1,
                    "intercepto_x2": p.ejemplo.intercepto_x2}

        _, t_a, estado_a = cronometrar("A · releer el pack", a)

        # --- B: props + render -----------------------------------------------------
        def props():
            r = subprocess.run(
                [str(ROOT / ".venv/bin/python"), "pipeline/render_b.py", "budget-line",
                 "--lang", "es", "--props-only"],
                cwd=ROOT, capture_output=True, text=True)
            assert r.returncode == 0, r.stderr[-800:]
            d = json.loads((ROOT / "bakeoff/remotion/props/lesson.json").read_text("utf-8"))
            # Que los beats hayan cambiado SOLOS es la mitad interesante del criterio.
            assert d["beats"][-1]["estado"]["m"] == INGRESO_NUEVO, "los beats no cambiaron"
            return {"maxX": d["maxX"], "maxY": d["maxY"]}

        _, t_props, estado_b = cronometrar("B · regenerar los props", props)

        def render():
            r = subprocess.run(
                [str(ROOT / ".venv/bin/python"), "pipeline/render_b.py", "budget-line",
                 "--lang", "es"],
                cwd=ROOT, capture_output=True, text=True)
            assert r.returncode == 0, r.stderr[-800:]
            return r.stdout.strip().splitlines()[-2:]

        _, t_render, salida = cronometrar("B · renderizar el MP4", render)

        medidas = {"A_total_s": t_a, "B_props_s": t_props, "B_render_s": t_render,
                   "B_total_s": t_props + t_render}
        print()
        print(f"  A: {medidas['A_total_s']:.1f} s   B: {medidas['B_total_s']:.1f} s   "
              f"razón: {medidas['B_total_s'] / max(medidas['A_total_s'], 1e-9):.0f}x")
        print(f"  A -> interceptos {estado_a}")
        print(f"  B -> escala {estado_b}")
        for l in salida:
            print(f"  {l}")
    finally:
        PACK.write_text(respaldo, encoding="utf-8")
        print("\n  pack.yaml restaurado")
        # El MP4 y los props quedaron con el ingreso de prueba: hay que rehacerlos con el
        # valor real o la compuerta de cues avisará de que el vídeo no corresponde.
        subprocess.run([str(ROOT / ".venv/bin/python"), "pipeline/render_b.py",
                        "budget-line", "--lang", "es"], cwd=ROOT,
                       capture_output=True, text=True)
        print("  MP4 re-renderizado con el ingreso real")

    salida_json = pathlib.Path(__file__).parent / "c2.json"
    salida_json.write_text(json.dumps(medidas, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
