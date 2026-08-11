#!/usr/bin/env python3
"""Construye `evals/gold/budget-line.jsonl` a partir de los pools crudos de generación.

    .venv/bin/python evals/build_goldset.py

Es idempotente y NO pisa el etiquetado humano: si el JSONL ya existe, las etiquetas de
Kristian se conservan por id. Eso importa porque el gold set se va a regenerar (para
añadir ítems, para arreglar un fixture) mucho después de que él haya invertido una hora
etiquetando, y perder ese trabajo sería el peor error posible de este directorio.

Los pools crudos en `gold/_raw/` se versionan a propósito. Son la procedencia: sin ellos,
`budget-line.jsonl` es un archivo de respuestas de alumno que aparecieron de la nada.

Qué hace con lo que reportó la auditoría:

- reescritura del auditor -> se aplica siempre que exista. Los auditores sólo redactan
  una cuando el TEXTO está mal, y hay dos causas distintas. Una es que suene a libro de
  texto, y entonces no mide nada: el juez la va a leer bien por razones que no se parecen
  a las de un alumno real. La otra la encontró la verificación adversarial de las
  trampas: dos de las seis respuestas escritas como "correctas pero con pinta de error"
  estaban de verdad mal — una ponía euros donde el pack tiene dólares y otra decía que
  100/4 son 20 kilos. Una trampa que en realidad es incorrecta corrompe exactamente la
  medida de precisión que existe para permitir, así que se corrige el texto y se deja
  registro en `intent.audit_problem`.
- duplicados exactos -> se queda uno. Dos copias del mismo texto no son dos evidencias,
  pero sí cuentan dos veces en el porcentaje de acuerdo, que es peor que inútil.
- `label_ok: false` o `ambiguous: true` -> se CONSERVA el ítem y se marca. La etiqueta
  discutida es la INTENCIÓN, y la intención no es la verdad; la verdad es lo que diga
  Kristian. Un ítem genuinamente ambiguo es valioso, siempre que el desacuerdo sobre él
  no se lea después como que el juez está roto.
- `soles` -> `dólares`. El pack entero está en dólares y un fixture que deriva del pack
  mide otra cosa.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from evals.goldset import GOLD_DIR, GoldItem, default_path, load, save  # noqa: E402

RAW = GOLD_DIR / "_raw"
PACK = "budget-line"

CURRENCY = [
    (re.compile(r"\bsoles\b", re.I), "dólares"),
    (re.compile(r"\bsol\b(?=\s|$|[.,])", re.I), "dólar"),
]


def fix_currency(text: str) -> str:
    for rx, rep in CURRENCY:
        text = rx.sub(rep, text)
    return text


def main() -> int:
    raws = sorted(RAW.glob("round*.json"))
    if not raws:
        print(f"no hay pools crudos en {RAW}")
        return 2

    rows: list[dict] = []
    for f in raws:
        data = json.loads(f.read_text(encoding="utf-8"))
        for a in data["pool"]:
            rows.append({**a, "_round": f.stem})

    # 1. reescrituras y moneda
    for a in rows:
        text = a["answer"]
        if a.get("audit_rewrite"):
            text = a["audit_rewrite"]
            a["_rewritten"] = True
        a["answer"] = fix_currency(text).strip()

    # 2. duplicados exactos, ignorando mayúsculas y espacios
    seen: dict[str, dict] = {}
    kept: list[dict] = []
    dropped = 0
    for a in rows:
        key = (a["question_id"], re.sub(r"\s+", " ", a["answer"].casefold()).strip())
        if key in seen:
            dropped += 1
            continue
        seen[key] = a
        kept.append(a)

    # 3. orden estable: por pregunta, luego idioma, luego texto. No depende del orden en
    #    que volvieron los agentes, así que regenerar no baraja los ids.
    kept.sort(key=lambda a: (a["question_id"], a["lang"], a["answer"]))

    previous = {i.id: i for i in load(default_path(PACK))}
    items: list[GoldItem] = []
    for n, a in enumerate(kept, start=1):
        gid = f"gs-{n:03d}"
        prev = previous.get(gid)
        # La etiqueta humana se reengancha por id Y por texto: si al regenerar el ítem
        # gs-007 pasa a ser otra respuesta, arrastrar la etiqueta vieja sería peor que
        # perderla, porque el reporte no tendría cómo notarlo.
        human = prev.human if prev and prev.answer.strip() == a["answer"] else None
        items.append(GoldItem(
            id=gid,
            question_id=a["question_id"],
            lang=a["lang"],
            answer=a["answer"],
            source="synthetic",
            intent={
                "archetype": a.get("archetype", ""),
                "key_points": a.get("key_points_present", []),
                "misconception": a.get("misconception", "NINGUNA"),
                "note": a.get("note", ""),
                "cluster": a.get("cluster", ""),
                "round": a.get("_round", ""),
                "rewritten": bool(a.get("_rewritten")),
                "audit_label_disputed": not a.get("audit_label_ok", True),
                "audit_ambiguous": bool(a.get("audit_ambiguous")),
                "audit_problem": a.get("audit_problem", ""),
                "trap_refuted_by": a.get("trap_refuted_by", 0),
            },
            human=human,
        ))

    save(items, default_path(PACK))

    carried = sum(1 for i in items if i.labelled)
    print(f"\n  {len(items)} ítems  ({dropped} duplicado(s) descartado(s))")
    print(f"  {sum(1 for i in items if i.intent['rewritten'])} reescritos por la auditoría")
    print(f"  {sum(1 for i in items if i.intent['audit_ambiguous'])} marcados ambiguos")
    print(f"  {sum(1 for i in items if i.intent['audit_label_disputed'])} con etiqueta discutida")
    print(f"  {carried} etiqueta(s) humana(s) conservada(s)")

    import collections
    print("\n  por pregunta:", dict(collections.Counter(i.question_id for i in items)))
    print("  por idioma:  ", dict(collections.Counter(i.lang for i in items)))
    mis = collections.Counter(i.intent["misconception"] for i in items)
    print("  por error (intención, no verdad):")
    for k, v in sorted(mis.items(), key=lambda kv: -kv[1]):
        flag = "" if v >= 3 or k in ("NINGUNA", "FUERA_DE_CATALOGO") else "   <- n<3"
        print(f"    {k:<20} {v}{flag}")
    print(f"\n  {default_path(PACK)}")
    print("\n  Etiquetar:  .venv/bin/python evals/label.py\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
