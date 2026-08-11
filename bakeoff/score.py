#!/usr/bin/env python3
"""Turns the M4 measurement matrix into a decision — and says when it cannot.

    .venv/bin/python bakeoff/score.py                    # matriz + barrido
    .venv/bin/python bakeoff/score.py --weights 40,20,10,20,10
    .venv/bin/python bakeoff/score.py --self-test        # verifica el barrido

Un ranking bajo UN vector de pesos es una opinión con decimales. Este archivo existe
para no entregar eso.

Lo que hace de más: recorre el símplex de ponderaciones plausibles y reporta, para cada
opción, en qué fracción de ellas gana. Con eso la pregunta de los pesos deja de ser un
juicio a ciegas:

  - Si una opción gana en casi todo el símplex, los pesos nunca importaron y la discusión
    sobre ellos era innecesaria. Se reporta y se sigue.
  - Si el ganador cambia entre ponderaciones razonables, ESO es el hallazgo: la decisión
    es sobre qué valoramos, no sobre qué tecnología es mejor, y la toma Kristian.

La normalización es min-max por criterio, no z-score, y no es un detalle. Con cuatro
opciones un z-score deja que un único valor extremo domine la escala entera; el min-max
dice "el mejor de los que hay" y "el peor de los que hay", que es exactamente la pregunta
de un bake-off cerrado. El costo es que la escala depende del conjunto: añadir una quinta
opción re-escala a las otras cuatro. Se acepta, y se reporta el valor crudo al lado de la
puntuación para que nadie lea el normalizado como si fuera absoluto.
"""
from __future__ import annotations

import argparse
import math
import pathlib
import random
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent
RESULTS = ROOT / "results.yaml"
PREREG = {"c1": 0.20, "c2": 0.35, "c3": 0.05, "c4": 0.25, "c5": 0.15}

#: Cada peso se mantiene dentro de esto durante el barrido. Un peso de cero significa
#: "este criterio no existe", que no es una ponderación plausible sino otra pregunta;
#: y uno de 0.6 significa que los otros cuatro juntos pesan menos que uno.
W_MIN, W_MAX = 0.05, 0.50
SWEEP_N = 20000
SEED = 20260811

B, DIM, RST = "\033[1m", "\033[2m", "\033[0m"


def load(path: pathlib.Path | None = None) -> dict:
    p = path or RESULTS
    if not p.is_file():
        raise SystemExit(
            f"no existe {p}.\n"
            "Es el archivo que llena el bake-off: una fila por opción, una columna por\n"
            "criterio, con el valor crudo medido y su unidad."
        )
    return yaml.safe_load(p.read_text(encoding="utf-8")) or {}


def normalise(values: dict[str, float], higher_is_better: bool) -> dict[str, float]:
    """Min-max a [0,1] dentro del conjunto de opciones medidas.

    Cuando todas empatan devuelve 1.0 para todas, no 0.0: un criterio en el que nadie se
    distingue no debe penalizar a nadie, y con 0.0 penalizaría a todos por igual, que es
    lo mismo salvo que además hunde la escala global.
    """
    if not values:
        return {}
    lo, hi = min(values.values()), max(values.values())
    if math.isclose(lo, hi):
        return {k: 1.0 for k in values}
    out = {}
    for k, v in values.items():
        n = (v - lo) / (hi - lo)
        out[k] = n if higher_is_better else 1.0 - n
    return out


def matrix(data: dict) -> tuple[list[str], dict[str, dict[str, float]], dict[str, dict]]:
    """Devuelve (opciones, normalizado[criterio][opción], meta[criterio])."""
    criteria = data.get("criteria", {})
    options = list(data.get("options", {}))
    norm: dict[str, dict[str, float]] = {}
    for cid, meta in criteria.items():
        raw = {}
        for opt in options:
            v = (data["options"][opt] or {}).get(cid)
            if isinstance(v, dict):
                v = v.get("value")
            if v is None:
                continue
            raw[opt] = float(v)
        norm[cid] = normalise(raw, bool(meta.get("higher_is_better", True)))
    return options, norm, criteria


def score(options: list[str], norm: dict, weights: dict[str, float]) -> dict[str, float]:
    out = {}
    for opt in options:
        total, used = 0.0, 0.0
        for cid, w in weights.items():
            if opt in norm.get(cid, {}):
                total += w * norm[cid][opt]
                used += w
        # Renormaliza por el peso realmente usado: una opción a la que le falta una
        # medición no debe puntuar bajo por la ausencia, debe puntuar sobre lo que hay
        # — y el reporte dice cuántas mediciones le faltaban.
        out[opt] = total / used if used else 0.0
    return out


def sweep(options: list[str], norm: dict, criteria: list[str],
          n: int = SWEEP_N) -> dict[str, float]:
    """Fracción del símplex plausible en la que gana cada opción.

    Muestreo por rechazo sobre una Dirichlet uniforme, recortado a [W_MIN, W_MAX]. La
    semilla es fija: un barrido cuyo resultado cambia entre ejecuciones no se puede citar
    en una decisión.
    """
    rng = random.Random(SEED)
    wins = {o: 0 for o in options}
    k, tries = len(criteria), 0
    got = 0
    while got < n and tries < n * 60:
        tries += 1
        # Dirichlet(1,...,1) via exponenciales normalizadas
        xs = [-math.log(rng.random()) for _ in range(k)]
        s = sum(xs)
        w = [x / s for x in xs]
        if any(x < W_MIN or x > W_MAX for x in w):
            continue
        got += 1
        sc = score(options, norm, dict(zip(criteria, w)))
        best = max(sc.values())
        top = [o for o, v in sc.items() if math.isclose(v, best, abs_tol=1e-12)]
        for o in top:
            wins[o] += 1 / len(top)   # empates se reparten
    return {o: (wins[o] / got if got else 0.0) for o in options}


def decisive(options: list[str], norm: dict, criteria: list[str],
             weights: dict[str, float]) -> list[tuple[str, float]]:
    """Cuánto se mueve la ventaja del ganador si un criterio se lleva todo el peso.

    Es la lectura útil de "qué criterio decide": no cuál pesa más en el vector, sino cuál
    cambiaría el resultado si pesara distinto.
    """
    base = score(options, norm, weights)
    winner = max(base, key=base.get)
    out = []
    for cid in criteria:
        solo = score(options, norm, {cid: 1.0})
        top = max(solo, key=solo.get)
        out.append((cid, 0.0 if top == winner else solo[top] - solo.get(winner, 0.0)))
    return sorted(out, key=lambda t: -t[1])


def render(data: dict, weights: dict[str, float]) -> int:
    options, norm, criteria = matrix(data)
    if not options:
        print("no hay opciones medidas todavía en results.yaml")
        return 2
    cids = list(criteria)
    sc = score(options, norm, weights)
    order = sorted(options, key=lambda o: -sc[o])

    print(f"\n{B}MATRIZ{RST}   valor crudo (normalizado)\n")
    head = "  " + " " * 26 + "".join(f"{c:>18}" for c in cids)
    print(head)
    for opt in order:
        row = f"  {opt:<26}"
        for cid in cids:
            v = (data["options"][opt] or {}).get(cid)
            if isinstance(v, dict):
                v = v.get("value")
            if v is None:
                row += f"{'—':>18}"
            else:
                row += f"{v:>10.4g} ({norm[cid][opt]:.2f})"[-18:].rjust(18)
        print(row)

    print(f"\n  {DIM}" + "  ".join(
        f"{c}={criteria[c].get('nombre', c)} [{criteria[c].get('unidad','')}"
        f"{'↑' if criteria[c].get('higher_is_better', True) else '↓'}]" for c in cids)
        + f"{RST}")

    faltan = {o: sum(1 for c in cids if o not in norm.get(c, {})) for o in options}
    if any(faltan.values()):
        print(f"\n  {DIM}mediciones faltantes: " +
              ", ".join(f"{o}:{n}" for o, n in faltan.items() if n) +
              f" — la puntuación se renormaliza sobre lo medido{RST}")

    print(f"\n{B}PUNTUACIÓN{RST}  con los pesos "
          + " ".join(f"{c}={weights[c]:.0%}" for c in cids) + "\n")
    for i, opt in enumerate(order, 1):
        bar = "█" * round(sc[opt] * 28)
        print(f"  {i}. {opt:<24} {sc[opt]:.3f}  {bar}")

    print(f"\n{B}BARRIDO DE PONDERACIONES{RST}  "
          f"{DIM}fracción del símplex plausible en que gana cada una{RST}\n")
    frac = sweep(options, norm, cids)
    for opt in sorted(options, key=lambda o: -frac[o]):
        bar = "█" * round(frac[opt] * 28)
        print(f"     {opt:<24} {frac[opt]:6.1%}  {bar}")

    top_opt = max(frac, key=frac.get)
    if frac[top_opt] >= 0.90:
        print(f"\n  {B}Los pesos no importan.{RST} {top_opt} gana en {frac[top_opt]:.0%} de "
              "las ponderaciones plausibles,")
        print("  así que discutirlos habría sido discutir sobre nada.")
    elif frac[top_opt] >= 0.60:
        print(f"\n  {top_opt} gana en {frac[top_opt]:.0%} del símplex: robusto, pero no "
              "unánime. Los pesos")
        print("  mueven el resultado en el resto, y ahí la decisión es de Kristian.")
    else:
        print(f"\n  {B}El ganador depende de los pesos.{RST} Nadie pasa del "
              f"{frac[top_opt]:.0%} del símplex.")
        print("  Eso NO es un empate técnico: es que la decisión es sobre qué valoramos,")
        print("  no sobre qué tecnología es mejor. La toma Kristian, no esta tabla.")

    print(f"\n{B}QUÉ CRITERIO DECIDE{RST}  {DIM}cuánto cambiaría si se llevara todo el "
          f"peso{RST}\n")
    for cid, delta in decisive(options, norm, cids, weights):
        if delta <= 0:
            print(f"     {cid:<6} {criteria[cid].get('nombre', ''):<34} "
                  f"{DIM}no cambia el ganador{RST}")
        else:
            print(f"     {cid:<6} {criteria[cid].get('nombre', ''):<34} "
                  f"lo cambiaría, por {delta:.2f}")
    print()
    return 0


def self_test() -> int:
    """Verifica el barrido con matrices cuyo resultado se conoce de antemano."""
    cids = ["c1", "c2", "c3", "c4", "c5"]
    crit = {c: {"higher_is_better": True} for c in cids}

    dominante = {"options": {"A": {c: 5 for c in cids}, "B": {c: 1 for c in cids}},
                 "criteria": crit}
    opts, norm, _ = matrix(dominante)
    f = sweep(opts, norm, cids, n=3000)
    assert f["A"] > 0.999, f"una opción mejor en TODO debe ganar siempre: {f}"

    # A gana c1..c2, B gana c4..c5, empatan en c3: el ganador debe depender de los pesos
    mixta = {"options": {"A": {"c1": 5, "c2": 5, "c3": 3, "c4": 1, "c5": 1},
                         "B": {"c1": 1, "c2": 1, "c3": 3, "c4": 5, "c5": 5}},
             "criteria": crit}
    opts, norm, _ = matrix(mixta)
    f = sweep(opts, norm, cids, n=3000)
    assert 0.2 < f["A"] < 0.8, f"con fuerzas opuestas nadie debe dominar el símplex: {f}"

    # un criterio en el que todos empatan no penaliza a nadie
    n = normalise({"A": 3.0, "B": 3.0}, True)
    assert n == {"A": 1.0, "B": 1.0}, n

    # menor-es-mejor invierte
    n = normalise({"A": 1.0, "B": 9.0}, False)
    assert n["A"] == 1.0 and n["B"] == 0.0, n

    # reproducible: la misma matriz da el mismo barrido
    assert sweep(opts, norm, cids, n=1500) == sweep(opts, norm, cids, n=1500)

    print("  self-test ok: dominancia, dependencia de pesos, empates, inversión, "
          "reproducibilidad")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", type=pathlib.Path)
    ap.add_argument("--weights", help="c1,c2,c3,c4,c5 en porcentaje; por defecto el "
                                      "pre-registro de docs/M4-PREREGISTRO.md")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    data = load(args.results)
    weights = dict(PREREG)
    if args.weights:
        vals = [float(x) for x in args.weights.split(",")]
        cids = list(data.get("criteria", PREREG))
        if len(vals) != len(cids):
            raise SystemExit(f"hacen falta {len(cids)} pesos, llegaron {len(vals)}")
        s = sum(vals)
        weights = {c: v / s for c, v in zip(cids, vals)}
        print(f"\n  {DIM}pesos dados en la línea de comandos, no el pre-registro{RST}")
    return render(data, weights)


if __name__ == "__main__":
    sys.exit(main())
