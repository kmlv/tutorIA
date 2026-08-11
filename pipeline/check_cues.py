#!/usr/bin/env python3
"""Compuerta: todo cue de gráfico compilado tiene que tener un efecto en el cliente.

    .venv/bin/python pipeline/check_cues.py content/packs/budget-line

El fallo que cierra es silencioso, que es lo que lo hace peligroso. `aplicarCue` y
`paintLedger` en `app/web/src/main.ts` son dos `switch` sin rama por defecto. Un cue
llamado `budgetLine` en vez de `budget_line` **dispara**: el motor lo encuentra en la
timeline, lo marca como disparado, registra un desfase sano, y no pinta absolutamente
nada. No hay excepción, no hay aviso en consola, y la telemetría dice que todo va bien.
Solo se ve mirando la pantalla y sabiendo qué debería haber aparecido.

Importa ahora por M4. La decisión D-3 dice que un modelo va a emitir la configuración de
los gráficos, y el criterio 2 del bake-off mide justamente qué pasa cuando la emite mal.
Si una configuración equivocada es invisible, ese criterio no se puede medir: todas las
opciones puntúan perfecto porque ningún error se manifiesta.

Es un lint, no una garantía de ejecución. Compara los ids de la timeline contra las
etiquetas `case "..."` del cliente. Si alguien reescribe esos `switch` como tablas —que
sería mejor— este archivo hay que cambiarlo, y esa es la señal correcta.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
CLIENTE = ROOT / "app" / "web" / "src" / "main.ts"

#: Se atienden por TIPO, no por id: el motor los reconoce con `c.type` y la app los
#: enruta a la pregunta o a la predicción. Nunca van a tener un `case`.
POR_TIPO = {"checkpoint", "prediction"}


def cases(src: str) -> set[str]:
    return set(re.findall(r'^\s*case\s+"([^"]+)"\s*:', src, re.M))


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__.strip().splitlines()[2])
        return 2
    pack_dir = pathlib.Path(sys.argv[1])
    media = pack_dir / "media"
    if not media.is_dir():
        print(f"  {pack_dir.name}: sin media compilada, nada que comprobar")
        return 0
    if not CLIENTE.is_file():
        print(f"  no existe {CLIENTE}")
        return 2

    manejados = cases(CLIENTE.read_text(encoding="utf-8"))
    errs: list[str] = []
    total = 0

    for tl_path in sorted(media.glob("timeline.*.json")):
        tl = json.loads(tl_path.read_text(encoding="utf-8"))
        for c in tl.get("cues", []):
            if c.get("type") in POR_TIPO:
                continue
            total += 1
            if c["id"] not in manejados:
                errs.append(
                    f"{tl_path.name}: el cue `{c['id']}` (t={c.get('t')}) no tiene "
                    f"`case \"{c['id']}\"` en main.ts — dispararía sin pintar nada"
                )

    print(f"\n  cues de gráfico comprobados: {total}")
    print(f"  ids con efecto en el cliente: {len(manejados)}")
    for e in errs:
        print(f"  [ERROR] {e}")

    # El aviso al revés: un `case` que ya no corresponde a ningún cue. No rompe nada,
    # pero es código muerto que alguien va a leer creyendo que se ejecuta.
    ids = set()
    for tl_path in media.glob("timeline.*.json"):
        tl = json.loads(tl_path.read_text(encoding="utf-8"))
        ids |= {c["id"] for c in tl.get("cues", []) if c.get("type") not in POR_TIPO}
    huerfanos = sorted(manejados - ids)
    if huerfanos:
        print(f"  [aviso]  `case` sin cue que los dispare: {huerfanos}")

    print(f"\n  {len(errs)} error(es)\n")
    return 1 if errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
