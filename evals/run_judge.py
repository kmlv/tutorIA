#!/usr/bin/env python3
"""Corre el juez sobre el gold set y guarda las salidas crudas.

    .venv/bin/python evals/run_judge.py                       # el modelo configurado
    .venv/bin/python evals/run_judge.py --model gpt-5.4-mini  # bake-off contra otro
    .venv/bin/python evals/run_judge.py --dry                 # sin red, sin costo

Correr y reportar están separados a propósito. Un veredicto cuesta dinero y tarda; el
reporte se va a rehacer muchas veces mientras discutimos qué mide. Con un archivo de
corrida por medio, cambiar el reporte es gratis, comparar dos modelos es comparar dos
archivos, y el gold set se etiqueta UNA vez aunque probemos cinco jueces.

El archivo de corrida es inmutable: lleva el modelo y la huella del prompt en el nombre,
así que dos corridas nunca se pisan ni se confunden.
"""
from __future__ import annotations

import argparse
import datetime
import json
import pathlib
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.server.config import load_dotenv  # noqa: E402
from app.server.core.content.loader import FilesystemPackSource  # noqa: E402
from app.server.core.judge.grader_open import judge_open, prompt_id  # noqa: E402
from app.server.core.llm import FakeProvider, Router, default_provider  # noqa: E402
from evals.goldset import RUNS_DIR, default_path, load  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", default="budget-line")
    ap.add_argument("--model", help="pisa el modelo del rol judge_open")
    ap.add_argument("--limit", type=int, help="corre sólo los primeros N")
    ap.add_argument("--all", action="store_true",
                    help="incluye los ítems sin etiquetar (por defecto sólo etiquetados)")
    ap.add_argument("--dry", action="store_true", help="proveedor falso: sin red, sin costo")
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    load_dotenv()
    items = load(default_path(args.pack))
    if not items:
        print(f"no hay gold set para {args.pack}")
        return 2
    if not args.all:
        items = [i for i in items if i.labelled]
    if args.limit:
        items = items[: args.limit]
    if not items:
        print("no hay ítems etiquetados. Corre primero: evals/label.py")
        return 2

    pack = FilesystemPackSource().get_pack(args.pack, "es")
    by_id = {q.id: q for q in pack.questions}
    router = Router()
    spec = router.spec("judge_open", model=args.model)
    provider = FakeProvider() if args.dry else default_provider()

    if isinstance(provider, FakeProvider) and not args.dry:
        print("no hay proveedor real configurado. Corre: scripts/doctor.py")
        return 2

    print(f"\n  modelo    {spec.model}  effort={spec.effort}")
    print(f"  prompt    {prompt_id()}")
    print(f"  ítems     {len(items)}")
    print(f"  proveedor {provider.name}\n")

    def one(item):
        q = by_id[item.question_id]
        v = judge_open(q, item.answer, pack, lang=item.lang,
                       provider=provider, spec=spec)
        print(("  ok  " if not v.invalida else " FALLA") +
              f"  {item.id}  {v.latency_ms or 0:>6} ms  ${v.cost_usd:.5f}"
              + (f"  {v.error}" if v.error else ""))
        return {
            "id": item.id,
            "question_id": item.question_id,
            "correcta": v.correcta,
            "score": v.score,
            "misconception": v.misconception_id or (
                v.judge.get("misconception_id") if isinstance(v.judge, dict) else None),
            "invalida": v.invalida,
            "error": v.error,
            "model": v.model,
            "prompt_version": v.prompt_version,
            "latency_ms": v.latency_ms,
            "cost_usd": v.cost_usd,
            "judge": v.judge,
        }

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        rows = list(pool.map(one, items))

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    safe_model = spec.model.replace("/", "_")
    out = RUNS_DIR / f"{stamp}__{args.pack}__{safe_model}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")

    total = sum(r["cost_usd"] for r in rows)
    bad = sum(1 for r in rows if r["invalida"])
    print(f"\n  {len(rows)} veredictos, {bad} inválidos, ${total:.4f} en total")
    print(f"  {out}\n")
    print("  Reporte:")
    print(f"    .venv/bin/python evals/report.py {out.name}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
