#!/usr/bin/env python3
"""Reporte de concordancia y compuerta del hito M3.

    .venv/bin/python evals/report.py                          # la corrida más reciente
    .venv/bin/python evals/report.py 20260811-...__....jsonl   # una corrida concreta
    .venv/bin/python evals/report.py a.jsonl b.jsonl            # bake-off entre dos

La compuerta que fijó Kristian:

  1. ≥80% de acuerdo con el intervalo reportado
  2. recall ≥70% en cada misconception con n≥3
  3. cero ids fuera de catálogo

Sobre el intervalo. El criterio dice "≥80% **con el intervalo reportado**", así que la
compuerta se evalúa sobre la ESTIMACIÓN PUNTUAL y el intervalo se imprime al lado. Es lo
que Kristian fijó y no me toca endurecerlo por mi cuenta.

Pero conviene saber lo que el intervalo dice, porque es incómodo: con 60 ítems, un 85%
observado trae un IC95% de aproximadamente [74%, 92%]. O sea que el dato es compatible
con una concordancia real del 74%. Para que el LÍMITE INFERIOR llegue al 80% haría falta
un acuerdo observado del 90% con n≈60, o bajar el acuerdo exigido, o subir n bastante.
El reporte calcula e imprime ese n cuando el límite inferior no llega, para que la
diferencia entre "pasó la compuerta" y "está demostrado" quede a la vista en vez de
quedar implícita en un número.
"""
from __future__ import annotations

import argparse
import collections
import json
import math
import pathlib
import statistics
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.server.core.content.loader import FilesystemPackSource  # noqa: E402
from evals.goldset import RUNS_DIR, default_path, load  # noqa: E402

AGREEMENT_MIN = 0.80
RECALL_MIN = 0.70
RECALL_MIN_N = 3

OK, BAD, MEH = "  ok  ", " FALLA", " aviso"
B, DIM, RST = "\033[1m", "\033[2m", "\033[0m"


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Intervalo de Wilson. El normal (Wald) es directamente inválido con n pequeño y
    p cerca de 1: da límites por encima de 1 y un intervalo de ancho cero cuando el
    acuerdo es perfecto, que es justo el caso en el que más falta hace saber cuánta
    incertidumbre queda."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    s = z * math.sqrt(max(p * (1 - p) / n + z * z / (4 * n * n), 0.0))
    return ((c - s) / d, (c + s) / d)


def needed_n(p: float, floor: float, cap: int = 4000) -> int | None:
    """Cuántos ítems harían falta, al mismo ritmo de acuerdo `p`, para que el límite
    inferior de Wilson supere `floor`. Devuelve None si `p` no está por encima del
    umbral, porque entonces ningún tamaño de muestra lo consigue."""
    if p <= floor:
        return None
    n = 10
    while n <= cap:
        if wilson(round(p * n), n)[0] >= floor:
            return n
        n += 5
    return None


def kappa(pairs: list[tuple[bool, bool]]) -> float | None:
    """Cohen's kappa. El porcentaje de acuerdo crudo miente cuando una clase domina:
    con 90% de respuestas correctas, un juez que dijera "correcta" siempre acertaría el
    90% sin saber nada. Kappa descuenta el acuerdo por azar."""
    n = len(pairs)
    if n == 0:
        return None
    po = sum(1 for a, b in pairs if a == b) / n
    pa = sum(1 for a, _ in pairs if a) / n
    pb = sum(1 for _, b in pairs if b) / n
    pe = pa * pb + (1 - pa) * (1 - pb)
    return None if pe >= 1.0 else (po - pe) / (1 - pe)


def pct(x: float) -> str:
    return f"{100*x:5.1f}%"


def reference(item, use_intent: bool) -> dict:
    """La opinión contra la que se compara al juez.

    Normalmente la de Kristian. Con `--vs-intent` se usa la INTENCIÓN con que se escribió
    la respuesta, que **no es verdad y no vale para la compuerta**: es la opinión de otro
    modelo. Sirve para dos cosas concretas y para nada más — ejercitar todo el camino del
    reporte antes de que nadie invierta una hora etiquetando, y detectar que el juez esté
    groseramente roto mientras todavía sale barato arreglarlo.
    """
    if use_intent:
        return {"key_points": {k: True for k in item.intent.get("key_points", [])},
                "misconception": item.intent.get("misconception", "NINGUNA")}
    return item.human


def ref_correcta(ref: dict, q) -> bool:
    """La misma regla que usa el juez: todos los key points esenciales."""
    kps = ref["key_points"]
    return all(kps.get(k.id, False) for k in q.key_points if k.esencial)


def load_run(name: str) -> tuple[str, list[dict]]:
    p = pathlib.Path(name)
    if not p.is_file():
        p = RUNS_DIR / name
    if not p.is_file():
        raise SystemExit(f"no existe la corrida {name}")
    rows = [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
    return p.name, rows


def analyse(run_rows: list[dict], items_by_id: dict, pack, use_intent: bool = False) -> dict:
    q_by_id = {q.id: q for q in pack.questions}
    enum = set(pack.enum_misconceptions)

    paired, invalid, orphan = [], [], []
    for r in run_rows:
        item = items_by_id.get(r["id"])
        if item is None or not (item.labelled or use_intent):
            orphan.append(r)
            continue
        if r["invalida"]:
            invalid.append(r)
            continue
        paired.append((item, r))

    correctness: list[tuple[bool, bool]] = []
    kp_pairs: list[tuple[bool, bool]] = []
    kp_by_id: dict[str, list[tuple[bool, bool]]] = collections.defaultdict(list)
    mis_pairs: list[tuple[str, str]] = []
    outside_enum: list[str] = []
    flagged_agree, unflagged_agree = [], []

    for item, r in paired:
        q = q_by_id[item.question_id]
        ref = reference(item, use_intent)
        h_ok = ref_correcta(ref, q)
        correctness.append((h_ok, bool(r["correcta"])))

        judged = {k["id"]: bool(k["present"]) for k in r["judge"].get("key_points", [])}
        for k in q.key_points:
            pair = (bool(ref["key_points"].get(k.id, False)), judged.get(k.id, False))
            kp_pairs.append(pair)
            kp_by_id[f"{item.question_id}:{k.id}"].append(pair)

        jm = r["judge"].get("misconception_id", "NINGUNA")
        if jm not in enum:
            outside_enum.append(f"{item.id}: {jm!r}")
        mis_pairs.append((ref["misconception"], jm))

        unver = r["judge"].get("_derived", {}).get("evidence_unverified") or []
        (flagged_agree if unver else unflagged_agree).append(h_ok == bool(r["correcta"]))

    return {
        "paired": paired, "invalid": invalid, "orphan": orphan,
        "correctness": correctness, "kp_pairs": kp_pairs, "kp_by_id": kp_by_id,
        "mis_pairs": mis_pairs, "outside_enum": outside_enum,
        "flagged_agree": flagged_agree, "unflagged_agree": unflagged_agree,
    }


def report(name: str, rows: list[dict], items_by_id: dict, pack,
           use_intent: bool = False) -> bool:
    a = analyse(rows, items_by_id, pack, use_intent)
    paired = a["paired"]

    model = rows[0]["model"] if rows else "?"
    pv = rows[0]["prompt_version"] if rows else "?"
    print(f"\n{'='*74}\n{B}{name}{RST}\n{'='*74}")
    print(f"  modelo   {model}")
    print(f"  prompt   {pv}")
    if use_intent:
        print(f"\n  {MEH}  MODO --vs-intent: la referencia es la INTENCIÓN con que se "
              "escribió cada respuesta,")
        print("          que es la opinión de otro modelo, no la de Kristian. Esto NO "
              "es la compuerta")
        print("          y no cuenta como evidencia de nada. Sirve para ver si el juez "
              "está roto.")
    print(f"  ítems    {len(paired)} pareados"
          + (f", {len(a['invalid'])} inválidos" if a["invalid"] else "")
          + (f", {len(a['orphan'])} sin etiqueta humana" if a["orphan"] else ""))

    src = collections.Counter(i.source for i, _ in paired)
    synth = src.get("synthetic", 0)
    if synth:
        print(f"\n  {MEH}  {synth}/{len(paired)} respuestas son SINTÉTICAS. Este reporte "
              "mide si el juez")
        print("          concuerda con Kristian, no si funciona con la prosa de un "
              "alumno real.")

    if not paired:
        print(f"\n  {BAD}  nada que medir\n")
        return False

    # --- 1. acuerdo en correcta ---
    k = sum(1 for h, j in a["correctness"] if h == j)
    n = len(a["correctness"])
    lo, hi = wilson(k, n)
    kp = kappa(a["correctness"])
    # La compuerta va sobre la estimación puntual, que es como la fijó Kristian. El
    # límite inferior se reporta al lado como aviso, no como criterio.
    gate1 = (k / n) >= AGREEMENT_MIN
    print(f"\n{B}1. Acuerdo en «¿está correcta?»{RST}")
    kp_txt = f"   kappa {kp:.2f}" if kp is not None else ""
    print(f"   {OK if gate1 else BAD}  {pct(k/n)}  ({k}/{n})   "
          f"IC95% [{pct(lo)}, {pct(hi)}]{kp_txt}")
    if lo < AGREEMENT_MIN:
        need = needed_n(k / n, AGREEMENT_MIN)
        extra = f"harían falta ~{need} ítems al mismo ritmo de acuerdo" if need else (
            "ningún n lo consigue con este ritmo de acuerdo")
        print(f"   {MEH}  el límite inferior ({pct(lo)}) no llega a {pct(AGREEMENT_MIN)}: "
              f"la compuerta pasa,")
        print(f"          pero el dato es compatible con una concordancia real más baja. "
              f"Para cerrarlo,")
        print(f"          {extra}.")

    # asimetría: no es lo mismo perdonar de más que castigar de más
    fp = sum(1 for h, j in a["correctness"] if j and not h)
    fn = sum(1 for h, j in a["correctness"] if h and not j)
    if fp or fn:
        print(f"   {DIM}el juez aprobó {fp} que tú reprobaste; reprobó {fn} que tú "
              f"aprobaste{RST}")
        if fp > fn:
            print(f"   {DIM}sesgo indulgente: el modo caro de fallar, porque promueve "
                  f"sin evidencia{RST}")

    # --- 2. key points ---
    kk = sum(1 for h, j in a["kp_pairs"] if h == j)
    nn = len(a["kp_pairs"])
    kkp = kappa(a["kp_pairs"])
    print(f"\n{B}2. Acuerdo punto por punto de la rúbrica{RST}")
    print(f"   {pct(kk/nn)}  ({kk}/{nn})" + (f"   kappa {kkp:.2f}" if kkp is not None else ""))
    worst = sorted(
        ((kid, sum(1 for h, j in v if h == j) / len(v), len(v))
         for kid, v in a["kp_by_id"].items()),
        key=lambda t: t[1])[:3]
    for kid, acc, cnt in worst:
        mark = "" if acc >= 0.8 else "  <-"
        print(f"   {DIM}{kid:<46}{RST} {pct(acc)} (n={cnt}){mark}")

    # --- 3. misconceptions ---
    print(f"\n{B}3. Misconceptions{RST}")
    by_human = collections.Counter(h for h, _ in a["mis_pairs"])
    gate2 = True
    measurable = 0
    for mid, cnt in sorted(by_human.items(), key=lambda kv: -kv[1]):
        hit = sum(1 for h, j in a["mis_pairs"] if h == mid and j == mid)
        claimed = sum(1 for _, j in a["mis_pairs"] if j == mid)
        rec, prec = hit / cnt, (hit / claimed if claimed else 0.0)
        if mid in ("NINGUNA", "FUERA_DE_CATALOGO"):
            print(f"   {DIM}{mid:<20}{RST} n={cnt:<3} coincide {pct(rec)}")
            continue
        if cnt >= RECALL_MIN_N:
            measurable += 1
            ok = rec >= RECALL_MIN
            gate2 = gate2 and ok
            print(f"   {OK if ok else BAD}  {mid:<12} n={cnt:<3} recall {pct(rec)}  "
                  f"precisión {pct(prec)}")
        else:
            print(f"   {MEH}  {mid:<12} n={cnt:<3} recall {pct(rec)}  "
                  f"{DIM}(n<{RECALL_MIN_N}: no medible){RST}")
    if measurable == 0:
        gate2 = False
        print(f"   {BAD}  ninguna misconception llega a n={RECALL_MIN_N}: "
              "el criterio de recall no se puede evaluar")

    fa = sum(1 for h, j in a["mis_pairs"]
             if h == "NINGUNA" and j not in ("NINGUNA", "FUERA_DE_CATALOGO"))
    if fa:
        print(f"   {DIM}{fa} falsa(s) alarma(s): tú dijiste NINGUNA y el juez nombró "
              f"un error del catálogo{RST}")

    gate3 = not a["outside_enum"]
    print(f"   {OK if gate3 else BAD}  ids fuera del enum: {len(a['outside_enum'])}")
    for x in a["outside_enum"][:5]:
        print(f"          {x}")

    # --- 4. citas ---
    f, u = a["flagged_agree"], a["unflagged_agree"]
    if f:
        af, au = sum(f) / len(f), (sum(u) / len(u) if u else 0.0)
        print(f"\n{B}4. Citas inventadas{RST}")
        print(f"   {len(f)}/{len(f)+len(u)} veredictos citaron algo que el alumno no "
              "escribió")
        print(f"   acuerdo contigo:  con cita inventada {pct(af)}   sin ella {pct(au)}")
        if au - af >= 0.15:
            print(f"   {DIM}la cita inventada predice desacuerdo: sirve como filtro "
                  f"barato de veredictos malos{RST}")
        elif abs(au - af) < 0.05:
            print(f"   {DIM}no predice nada: la señal no separa buenos de malos "
                  f"veredictos{RST}")

    # --- 5. costo ---
    costs = [r["cost_usd"] for _, r in paired]
    lats = [r["latency_ms"] or 0 for _, r in paired]
    print(f"\n{B}5. Costo y latencia{RST}")
    print(f"   ${sum(costs):.4f} en total   ${statistics.mean(costs):.5f} por veredicto")
    print(f"   latencia p50 {statistics.median(lats):.0f} ms   "
          f"máx {max(lats)} ms")

    # --- 6. calidad del fixture ---
    dis = [] if use_intent else [
        i for i, _ in paired
        if i.intent.get("misconception")
        and i.intent["misconception"] != i.human["misconception"]]
    if dis:
        print(f"\n{B}6. Calidad del gold set{RST}")
        print(f"   {len(dis)}/{len(paired)} ítems donde TÚ no coincidiste con la "
              "intención con que se escribieron")
        print(f"   {DIM}esos ítems son ambiguos; el desacuerdo del juez ahí no es "
              f"culpa del juez{RST}")
        for i in dis[:4]:
            print(f"   {DIM}  {i.id}: escrito como {i.intent['misconception']}, "
                  f"tú dijiste {i.human['misconception']}{RST}")

    # --- compuerta ---
    passed = gate1 and gate2 and gate3
    print(f"\n{B}COMPUERTA M3{RST}")
    print(f"   {OK if gate1 else BAD}  acuerdo ≥{pct(AGREEMENT_MIN)}, con el IC reportado")
    print(f"   {OK if gate2 else BAD}  recall ≥{pct(RECALL_MIN)} en cada misconception "
          f"con n≥{RECALL_MIN_N}")
    print(f"   {OK if gate3 else BAD}  cero ids fuera de catálogo")
    print(f"\n   {B}{'APROBADA' if passed else 'NO APROBADA'}{RST}")
    if passed:
        print(f"   {DIM}Para pasar a modo vivo: JUDGE_MODE=live y JUDGE_GATE_PASSED=1 "
              f"en .env{RST}")
    print()
    return passed


def mcnemar_p(b: int, c: int) -> float:
    """Prueba exacta de McNemar, de dos colas, sobre los pares DISCORDANTES.

    Es la prueba correcta para comparar dos jueces sobre los MISMOS ítems, y no es lo
    mismo que mirar si los intervalos de confianza se solapan. Los intervalos ignoran
    que ambos modelos vieron exactamente las mismas respuestas: los ítems donde los dos
    coinciden no aportan información sobre cuál es mejor, y son casi todos. Lo único
    informativo son los `b + c` ítems donde uno acierta y el otro no.

    Con pocos discordantes —que es el caso normal cuando dos modelos buenos se comparan
    en 69 ítems— ninguna diferencia va a ser significativa, y eso NO es un defecto de la
    prueba: es el dato. Significa que el gold set no distingue a los dos modelos, y que
    elegir el caro por si acaso es pagar por algo que no se puede medir.
    """
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    # P(X <= k) + P(X >= n-k) bajo Binomial(n, 0.5)
    tail = sum(math.comb(n, i) for i in range(0, k + 1)) / (2 ** n)
    return min(1.0, 2 * tail)


def compare(runs: list[tuple[str, list[dict]]], items_by_id: dict, pack,
            use_intent: bool) -> None:
    """Tabla de bake-off. Sólo se imprime con dos corridas o más."""
    print(f"\n{'='*74}\n{B}BAKE-OFF{RST}\n{'='*74}")
    rows = []
    per_item: dict[str, dict[str, bool]] = {}
    for name, r in runs:
        a = analyse(r, items_by_id, pack, use_intent)
        k = sum(1 for h, j in a["correctness"] if h == j)
        n = len(a["correctness"])
        model = r[0]["model"] if r else "?"
        cost = sum(x["cost_usd"] for _, x in a["paired"])
        lat = statistics.median([x["latency_ms"] or 0 for _, x in a["paired"]] or [0])
        rows.append((model, k, n, wilson(k, n), kappa(a["correctness"]), cost, lat))
        q_by_id = {q.id: q for q in pack.questions}
        for item, x in a["paired"]:
            ref = reference(item, use_intent)
            ok = ref_correcta(ref, q_by_id[item.question_id]) == bool(x["correcta"])
            per_item.setdefault(item.id, {})[model] = ok

    print(f"\n  {'modelo':<16} {'acuerdo':>9}  {'IC95%':>16}  {'kappa':>6}  "
          f"{'costo':>8}  {'p50':>7}")
    for model, k, n, (lo, hi), kp, cost, lat in rows:
        kp_s = f"{kp:.2f}" if kp is not None else "  — "
        print(f"  {model:<16} {pct(k/n):>9}  [{pct(lo)},{pct(hi)}]  {kp_s:>6}  "
              f"${cost:>7.4f}  {lat:>5.0f}ms")

    if len(rows) < 2:
        return
    print(f"\n  {B}¿Son distintos?{RST}  (McNemar exacta sobre los ítems donde discrepan)")
    for i in range(len(rows)):
        for j in range(i + 1, len(rows)):
            ma, mb = rows[i][0], rows[j][0]
            b = sum(1 for v in per_item.values()
                    if v.get(ma) is True and v.get(mb) is False)
            c = sum(1 for v in per_item.values()
                    if v.get(ma) is False and v.get(mb) is True)
            p = mcnemar_p(b, c)
            verdict = "indistinguibles" if p > 0.05 else "diferencia significativa"
            print(f"  {ma} vs {mb}:  {b} a favor del primero, {c} del segundo, "
                  f"p={p:.2f}  ->  {verdict}")
            if p > 0.05 and b + c < 10:
                # Sin esta línea, "indistinguibles" se lee como "iguales", que es una
                # conclusión más fuerte de la que el dato aguanta.
                print(f"          {DIM}sólo {b+c} ítems discordantes: la prueba casi no "
                      f"tiene potencia. Significa que ESTE gold set{RST}")
                print(f"          {DIM}no los distingue, no que sean equivalentes.{RST}")
    cheapest = min(rows, key=lambda r: r[5])
    dearest = max(rows, key=lambda r: r[5])
    if cheapest[0] != dearest[0] and dearest[5] > 0:
        print(f"\n  {DIM}el más caro cuesta {dearest[5]/max(cheapest[5], 1e-9):.0f}x "
              f"lo que el más barato{RST}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("runs", nargs="*", help="archivos de corrida; por defecto el más reciente")
    ap.add_argument("--pack", default="budget-line")
    ap.add_argument("--vs-intent", action="store_true",
                    help="compara contra la intención en vez de la etiqueta humana; "
                         "NO es la compuerta")
    args = ap.parse_args()

    names = args.runs
    if not names:
        found = sorted(RUNS_DIR.glob(f"*__{args.pack}__*.jsonl"))
        if not found:
            print(f"no hay corridas en {RUNS_DIR}. Corre primero: evals/run_judge.py")
            return 2
        names = [found[-1].name]

    pack = FilesystemPackSource().get_pack(args.pack, "es")
    items = {i.id: i for i in load(default_path(args.pack))}
    if not args.vs_intent and not any(i.labelled for i in items.values()):
        print("\n  no hay ítems etiquetados todavía. Corre: evals/label.py\n")
        return 2

    results, runs = [], []
    for nm in names:
        fname, rows = load_run(nm)
        runs.append((fname, rows))
        results.append(report(fname, rows, items, pack, args.vs_intent))
    if len(runs) > 1:
        compare(runs, items, pack, args.vs_intent)
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
