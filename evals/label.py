#!/usr/bin/env python3
"""Etiquetado humano del gold set. Es la única fuente de verdad del hito M3.

    .venv/bin/python evals/label.py                 # sigue donde lo dejaste
    .venv/bin/python evals/label.py --redo gs-0007  # vuelve a etiquetar uno
    .venv/bin/python evals/label.py --stats         # cuánto falta

Se guarda después de CADA ítem, así que puedes cortar cuando quieras y volver.

Dos decisiones que no son de comodidad:

**El orden se baraja con semilla fija.** Si los ítems llegaran agrupados por arquetipo
—todos los de un mismo error seguidos— etiquetarías por patrón en vez de por lectura, y
el acuerdo con el juez saldría inflado por una razón que no tiene nada que ver con el
juez. La semilla es fija para que el orden sea reproducible.

**Nunca ves para qué fue escrita la respuesta.** El gold set guarda esa intención, pero
este programa no la muestra. Si la vieras, "el juez concuerda con Kristian" pasaría a
significar, sin que nadie lo note, "el juez concuerda con quien redactó el fixture".
"""
from __future__ import annotations

import argparse
import datetime
import pathlib
import random
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.server.core.content.loader import FilesystemPackSource  # noqa: E402
from evals.goldset import GoldItem, default_path, load, save  # noqa: E402

SHUFFLE_SEED = 20260811
PACK = "budget-line"

B, DIM, RST = "\033[1m", "\033[2m", "\033[0m"


def ask(prompt: str, valid: set[str]) -> str:
    while True:
        r = input(prompt).strip().lower()
        if r in valid:
            return r
        print(f"   responde con: {', '.join(sorted(valid))}")


def label_one(item: GoldItem, pack, n: int, total: int) -> dict | None:
    q = next(x for x in pack.questions if x.id == item.question_id)
    lang = item.lang

    print(f"\n{'='*74}")
    print(f"{DIM}{n}/{total}  ·  {item.id}  ·  {item.question_id}  ·  {lang}{RST}")
    print(f"{'='*74}")
    print(f"\n{B}PREGUNTA{RST}  {getattr(q.enunciado, lang)}\n")
    print(f"{B}RESPUESTA DEL ALUMNO{RST}")
    for line in item.answer.splitlines() or [""]:
        print(f"  │ {line}")
    print()

    kps: dict[str, bool] = {}
    for k in q.key_points:
        tag = "" if k.esencial else f" {DIM}(opcional){RST}"
        print(f"{B}¿Dice esto?{RST}{tag}")
        print(f"  {getattr(k, lang)}")
        r = ask("  [s]í / [n]o / [q]uit > ", {"s", "n", "q"})
        if r == "q":
            return None
        kps[k.id] = r == "s"
        print()

    watched = list(dict.fromkeys(
        list(q.misconceptions_vigilar)
        + [v for v in (q.diagnostico_si_falla or {}).values() if v]
    ))
    print(f"{B}¿Muestra alguno de estos errores?{RST}")
    opts = {"0": "NINGUNA"}
    print(f"  0  NINGUNA — no muestra ninguno de los del catálogo")
    for i, mid in enumerate(watched, start=1):
        m = pack.misconception(mid)
        opts[str(i)] = mid
        print(f"  {i}  {mid} — {getattr(m.nombre, lang)}")
        print(f"     {DIM}{m.señal_observable.strip()[:110]}{RST}")
    fuera = str(len(watched) + 1)
    opts[fuera] = "FUERA_DE_CATALOGO"
    print(f"  {fuera}  FUERA_DE_CATALOGO — error conceptual claro que no está arriba")

    r = ask("  > ", set(opts) | {"q"})
    if r == "q":
        return None

    note = input(f"  {DIM}nota (opcional, Enter para saltar) > {RST}").strip()

    return {
        "key_points": kps,
        "misconception": opts[r],
        "note": note,
        "labelled_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "labeller": "kristian",
    }


def stats(items: list[GoldItem]) -> None:
    done = [i for i in items if i.labelled]
    print(f"\n  {len(done)}/{len(items)} etiquetados")
    if not done:
        return
    by_q: dict[str, int] = {}
    by_m: dict[str, int] = {}
    for i in done:
        by_q[i.question_id] = by_q.get(i.question_id, 0) + 1
        m = i.human["misconception"]
        by_m[m] = by_m.get(m, 0) + 1
    print("\n  por pregunta:")
    for k, v in sorted(by_q.items()):
        print(f"    {k:<30} {v}")
    print("\n  por misconception (según tú):")
    for k, v in sorted(by_m.items(), key=lambda kv: -kv[1]):
        flag = "" if v >= 3 or k in ("NINGUNA", "FUERA_DE_CATALOGO") else "  <- menos de 3: no se puede medir recall"
        print(f"    {k:<30} {v}{flag}")
    print()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", default=PACK)
    ap.add_argument("--redo", help="id del ítem a re-etiquetar")
    ap.add_argument("--stats", action="store_true")
    args = ap.parse_args()

    path = default_path(args.pack)
    items = load(path)
    if not items:
        print(f"no hay gold set en {path}")
        return 2

    if args.stats:
        stats(items)
        return 0

    pack = FilesystemPackSource().get_pack(args.pack, "es")

    if args.redo:
        target = next((i for i in items if i.id == args.redo), None)
        if target is None:
            print(f"no existe el ítem {args.redo}")
            return 2
        queue = [target]
    else:
        queue = [i for i in items if not i.labelled]
        random.Random(SHUFFLE_SEED).shuffle(queue)

    if not queue:
        print("\n  ya está todo etiquetado.")
        stats(items)
        return 0

    print(f"\n  {len(queue)} ítem(s) por etiquetar. Se guarda después de cada uno; "
          "[q] sale cuando quieras.")

    for n, item in enumerate(queue, start=1):
        h = label_one(item, pack, n, len(queue))
        if h is None:
            print("\n  guardado. Vuelve con el mismo comando cuando quieras.\n")
            break
        item.human = h
        save(items, path)

    stats(items)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
