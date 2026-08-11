#!/usr/bin/env python3
"""Compuerta: todo cue de gráfico compilado tiene que tener un efecto en el cliente.

    .venv/bin/python pipeline/check_cues.py content/packs/budget-line

El fallo que cierra es silencioso, que es lo que lo hace peligroso. Un cue llamado
`budgetLine` en vez de `budget_line` **dispara**: el motor lo encuentra en la timeline, lo
marca como disparado, registra un desfase sano, y no pinta absolutamente nada. No hay
excepción, no hay aviso en consola, y la telemetría dice que todo va bien. Solo se ve
mirando la pantalla y sabiendo qué debería haber aparecido.

Desde D-3, los dos efectos —el gráfico y la banda de la ecuación— viven en
`content/packs/<id>/graph.yaml` y no en dos `switch`. La compuerta compara contra ese
documento, y `narracion` es lo que le devuelve los dientes: un cue puede legítimamente no
tocar la imagen, pero tiene que decirlo, o un cue que el modelo se saltó por descuido y
uno que decidió dejar mudo son indistinguibles.

Importa ahora por M4. La decisión D-3 dice que un modelo va a emitir la configuración de
los gráficos, y el criterio 2 del bake-off mide justamente qué pasa cuando la emite mal.
Si una configuración equivocada es invisible, ese criterio no se puede medir: todas las
opciones puntúan perfecto porque ningún error se manifiesta.

Es un lint, no una garantía de ejecución: comprueba que cada cue esté DECLARADO, no que
lo declarado sea pedagógicamente correcto. Para eso están los golden de
`app/web/test/script.golden.mjs`.
"""
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
#: Se atienden por TIPO, no por id: el motor los reconoce con `c.type` y la app los
#: enruta a la pregunta o a la predicción. Nunca van a tener un `case`.
POR_TIPO = {"checkpoint", "prediction"}



def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__.strip().splitlines()[2])
        return 2
    pack_dir = pathlib.Path(sys.argv[1])
    media = pack_dir / "media"
    if not media.is_dir():
        print(f"  {pack_dir.name}: sin media compilada, nada que comprobar")
        return 0
    errs: list[str] = []
    total = 0

    # Desde D-3, el efecto de cada cue sobre el GRÁFICO vive en `graph.yaml` y no en un
    # `switch`. La compuerta se parte en dos: el gráfico se comprueba contra ese
    # documento, y el ledger sigue siendo un `switch` en main.ts.
    #
    # `narracion` es lo que le devuelve los dientes a la compuerta ahora que el documento
    # lo escribe un modelo: un cue puede legítimamente no tocar la imagen, pero tiene que
    # decirlo. Sin esa lista, un cue que el modelo se saltó por descuido y uno que decidió
    # dejar mudo son indistinguibles.
    import yaml
    gpath = pack_dir / "graph.yaml"
    con_efecto: set[str] = set()
    narracion: set[str] = set()
    manejados: set[str] = set()
    if gpath.is_file():
        g = yaml.safe_load(gpath.read_text(encoding="utf-8")) or {}
        con_efecto = set(g.get("cues") or {})
        narracion = set(g.get("narracion") or [])
        # El ledger también salió del `switch`: ya no hay `case` que grepear en main.ts.
        manejados = set(g.get("ledger") or {})
    else:
        errs.append("falta graph.yaml: sin él el gráfico no dibuja nada (D-3)")

    for tl_path in sorted(media.glob("timeline.*.json")):
        tl = json.loads(tl_path.read_text(encoding="utf-8"))
        for c in tl.get("cues", []):
            if c.get("type") in POR_TIPO:
                continue
            total += 1
            if c["id"] not in con_efecto and c["id"] not in narracion:
                errs.append(
                    f"{tl_path.name}: el cue `{c['id']}` (t={c.get('t')}) no está ni en "
                    f"`cues` ni en `narracion` de graph.yaml — dispararía sin dibujar "
                    f"nada, y sin que nadie lo haya decidido"
                )
            if c["id"] not in manejados:
                errs.append(
                    f"{tl_path.name}: el cue `{c['id']}` no tiene entrada en `ledger` "
                    f"de graph.yaml — no pinta la banda de la ecuación"
                )

    # Segunda comprobación: una variante derivada que ya no corresponde a su original.
    # `pipeline/cues.py` reescribe solo `timeline.<lang>.json`, así que recompilar el
    # guion deja intactas las variantes — apuntando a un vídeo renderizado con los
    # tiempos viejos. La app dispararía los cues nuevos sobre una imagen que cuenta otra
    # cosa: sin excepción, sin aviso, y solo visible mirándolo.
    import hashlib
    originales: dict[str, str] = {}
    for tl_path in sorted(media.glob("timeline.*.json")):
        tl = json.loads(tl_path.read_text(encoding="utf-8"))
        if tl.get("variant", "A") != "A":
            continue
        payload = json.dumps(
            {"cues": [[c["id"], c.get("t")] for c in tl.get("cues", [])],
             "duration_s": round(tl["duration_s"], 3)}, sort_keys=True)
        originales[tl["lang"]] = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]

    for tl_path in sorted(media.glob("timeline.*.json")):
        tl = json.loads(tl_path.read_text(encoding="utf-8"))
        var = tl.get("variant", "A")
        if var == "A":
            continue
        esperada = originales.get(tl["lang"])
        tiene = tl.get("derivada_de")
        if tiene is None:
            errs.append(f"{tl_path.name}: variante {var} sin `derivada_de`; no se puede "
                        "saber si su vídeo corresponde al guion actual")
        elif esperada and tiene != esperada:
            errs.append(
                f"{tl_path.name}: se derivó de una timeline A que ya no existe "
                f"({tiene} != {esperada}). El guion se recompiló y el vídeo es viejo: "
                f"vuelve a correr pipeline/render_b.py"
            )

    print(f"\n  cues de gráfico comprobados: {total}")
    print(f"  ids con efecto en graph.yaml: {len(con_efecto)}  "
          f"(+{len(narracion)} declarados de solo narración)")
    print(f"  ids que pintan el ledger:     {len(manejados)}")
    for e in errs:
        print(f"  [ERROR] {e}")

    # El aviso al revés: una entrada del guion que ya no corresponde a ningún cue. No
    # rompe nada, pero es configuración muerta que alguien va a leer creyendo que corre.
    ids = set()
    for tl_path in media.glob("timeline.*.json"):
        tl = json.loads(tl_path.read_text(encoding="utf-8"))
        ids |= {c["id"] for c in tl.get("cues", []) if c.get("type") not in POR_TIPO}
    huerfanos = sorted((manejados | con_efecto) - ids)
    if huerfanos:
        print(f"  [aviso]  entradas del guion sin cue que las dispare: {huerfanos}")

    print(f"\n  {len(errs)} error(es)\n")
    return 1 if errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
