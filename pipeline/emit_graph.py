#!/usr/bin/env python3
"""D-3 medido: pedirle a un modelo que escriba el guion del gráfico, y ver si sale bien.

    .venv/bin/python pipeline/emit_graph.py budget-line --lang es
    .venv/bin/python pipeline/emit_graph.py budget-line --contra-golden   # el experimento

La decisión D-3 dice, textualmente, que esto *"es exactamente lo que hay que probar,
porque nadie ha medido si sale bien"*. Este archivo es la medición.

Al modelo se le da el guion HABLADO —lo que la narración dice en cada cue— y la lista de
cues, y se le pide el documento. No se le da el `graph.yaml` existente ni nada derivado de
él: si se lo diéramos, mediríamos su capacidad de copiar.

## Cómo se sabe si salió bien

Con `--contra-golden`, el documento emitido se ejecuta contra los mismos estados que
`app/web/test/golden-estados.json` —capturados del `switch` de TypeScript original— y se
compara cue a cue. Eso responde la pregunta de verdad, que no es "¿es JSON válido?" sino
**"¿la lección que dibuja es la misma?"**. Un documento puede pasar el esquema, pasar
`revisar()`, y destacar el intercepto equivocado en el pivote — que es el único momento de
toda la lección donde el destacado ES el contenido.

El bucle de reparación existe porque es la forma realista de usar esto: los errores de
`revisar()` se le devuelven al modelo y se reintenta. Cuántas vueltas hicieron falta es
parte del resultado y se imprime.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "app" / "web" / "src" / "graph"
sys.path.insert(0, str(ROOT))

SYSTEM = """Escribes la capa de configuración que dice qué muestra un gráfico económico en
cada momento de una lección narrada. Devuelves solo el JSON del esquema.

El gráfico es una línea presupuestaria en el plano de dos bienes: x1 en el eje horizontal,
x2 en el vertical. Su estado son tres números (p1, p2, m) y qué capas están visibles.

Vocabulario, y no hay más:
- mostrar / ocultar una o varias capas: ejes, linea, interceptos, conjunto, pendiente
- destacar: ninguno | intercepto_x1 | intercepto_x2 | pendiente
- fantasma: base (deja a la vista la recta del ejemplo original, para comparar) | ninguno
- set: nuevos valores de p1, p2 o m

Las expresiones de `set` se evalúan SIEMPRE contra el ejemplo base del pack, nunca contra
el estado actual, y son de una sola operación: `m * 1.5`, `p1 + 1`, `m`. Sin paréntesis y
sin funciones.

Reglas de la lección:
- Las capas son acumulativas: lo que se muestra sigue mostrado hasta que se oculte.
- Un cue cuya narración no cambia la imagen lleva una lista vacía de operaciones.
- Cuando la narración compara un antes y un después, el antes va como fantasma.
- Cuando la narración señala que algo NO se mueve, eso es lo que hay que destacar.
- Un cue de recapitulación o cierre devuelve la imagen al ejemplo base: los valores
  originales de p1, p2 y m, sin fantasma y sin nada destacado.

Esa última regla existe porque la narración no la dice en voz alta y aun así el alumno
tiene que salir viendo el caso original: es una convención de la lección, no algo que se
pueda deducir del texto hablado.

Además del gráfico escribes el LEDGER: una banda con la ecuación del presupuesto y dos
fichas, una por bien, que se van rellenando según la narración menciona cada cosa.

- revelar: {bien: g1|g2, estaciones: [...]} — enciende partes de una ficha. Las estaciones
  son glyph (el icono), unit (en qué se mide), symbol (cómo se llama la cantidad) y price
  (cuánto cuesta). Se revelan cuando la narración las nombra por primera vez.
- destacar: [terminos] — enciende esos símbolos a la vez en la ecuación y en la ficha que
  los contiene. Los términos son x1, x2, p1, p2, m. La LISTA VACÍA apaga todo, y es lo
  correcto cuando el momento de la narración es la ecuación entera y no un símbolo suyo.
- comprimir: true|false — encoge las fichas para dar sitio al gráfico. Se comprime cuando
  la lección ya no necesita el andamiaje al mismo tamaño, y se descomprime al recapitular.
- precio: {bien, valor} — cambia un precio EN LA FICHA, con la misma gramática de
  expresiones. Va junto al `set` del gráfico cuando la narración sube un precio: la ficha y
  la recta cuentan el mismo cambio.

Reglas del ledger:
- Una estación revelada sigue revelada; no hace falta repetirla.
- Destaca lo que la narración está nombrando en ese segundo, no todo lo que se ve.

Calendario de revelaciones. La ficha se rellena POCO A POCO, una estación por cue, y NO
todas de golpe: es un andamiaje que acompaña a la narración, y adelantarlo lo convierte en
una tabla de datos que el alumno tiene que ignorar hasta que le sirva. En el primer cue
donde la narración introduce cada cosa:

  1. glyph   cuando la narración habla de los bienes por primera vez
  2. unit    cuando dice o implica en qué se miden
  3. symbol  cuando les pone nombre a las cantidades
  4. price   cuando aparecen los precios y el ingreso

Cada uno de esos pasos va en un cue DISTINTO, en ese orden, aunque la narración de un cue
mencione dos. Si la lección tiene más cues que estaciones, los sobrantes no revelan nada."""


def user_prompt(cues: list[dict], ejemplo: dict) -> str:
    lineas = [
        f"Ejemplo base del pack: p1={ejemplo['p1']}, p2={ejemplo['p2']}, m={ejemplo['m']}.",
        "",
        "Los cues de la lección, en orden, con lo que la narración dice en cada uno:",
        "",
    ]
    for c in cues:
        lineas.append(f"  {c['id']}  ({c['t']:.0f}s)")
        lineas.append(f"      «{c['dice']}»")
    lineas += ["", "Devuelve el JSON con una entrada por cada cue de la lista."]
    return "\n".join(lineas)


def frase_en(transcript: list[dict], t: float, hasta: float | None = None) -> str:
    """TODO lo que se dice desde este cue hasta el siguiente.

    Empezó siendo dos frases y era demasiado poco, de una forma que solo se vio al medir el
    ledger. Las fichas de los bienes se rellenan cuando la narración nombra cada cosa por
    primera vez —"se mide en kilos", "tres dólares el kilo"— y con dos frases por cue el
    modelo sencillamente **no puede saber** dónde cae esa primera mención. Acertaba 1 o 2
    de 10, y era un problema de la entrada y no del modelo: yo le estaba pidiendo que
    dedujera de un texto que no le había dado.
    """
    trozo = [s for s in transcript
             if s["end_s"] >= t and (hasta is None or s["start_s"] < hasta)]
    return " ".join(s["text"] for s in trozo).strip()


def revisar_con_node(doc: dict, ejemplo: dict, cue_ids: list[str]) -> list[str]:
    """Ejecuta el `revisar` de TypeScript. La misma comprobación que corre el navegador,
    no una reimplementación que pueda divergir de ella justo cuando importe."""
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        subprocess.run(
            ["npx", "tsc", str(SRC / "script.ts"), str(SRC / "state.ts"),
             "--outDir", str(out), "--rootDir", str(SRC.parent),
             "--target", "es2020", "--module", "es2020", "--moduleResolution", "node",
             "--skipLibCheck"],
            cwd=ROOT / "app" / "web", check=True, capture_output=True, text=True,
        )
        drv = out / "d.mjs"
        drv.write_text(
            "import {revisar} from './graph/script.js';\n"
            "const {doc, ejemplo, ids} = JSON.parse(process.argv[2]);\n"
            "process.stdout.write(JSON.stringify(revisar(doc, ejemplo, new Set(ids))));\n",
            encoding="utf-8")
        r = subprocess.run(
            ["node", str(drv), json.dumps({"doc": doc, "ejemplo": ejemplo, "ids": cue_ids})],
            capture_output=True, text=True)
        if r.returncode != 0:
            return [f"el validador no pudo correr: {r.stderr.strip()[:300]}"]
        return json.loads(r.stdout)


def estados_de(doc: dict, ejemplo: dict, cue_ids: list[str]) -> list[dict]:
    """Los estados que ese documento produce, cue a cue, con el intérprete real."""
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        subprocess.run(
            ["npx", "tsc", str(SRC / "script.ts"), str(SRC / "state.ts"),
             "--outDir", str(out), "--rootDir", str(SRC.parent),
             "--target", "es2020", "--module", "es2020", "--moduleResolution", "node",
             "--skipLibCheck"],
            cwd=ROOT / "app" / "web", check=True, capture_output=True, text=True,
        )
        drv = out / "e.mjs"
        drv.write_text(
            "import {estadoInicial, aplicarCue} from './graph/state.js';\n"
            "const {doc, ejemplo, ids} = JSON.parse(process.argv[2]);\n"
            "let s = estadoInicial(ejemplo);\n"
            "const r = [];\n"
            "for (const id of ids) { s = aplicarCue(s, id, ejemplo, doc); "
            "r.push({cue: id, estado: s}); }\n"
            "process.stdout.write(JSON.stringify(r));\n",
            encoding="utf-8")
        r = subprocess.run(
            ["node", str(drv), json.dumps({"doc": doc, "ejemplo": ejemplo, "ids": cue_ids})],
            capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip()[:500])
        return json.loads(r.stdout)


def llamadas_ledger(ops: list, ejemplo: dict) -> list:
    """Traduce las operaciones del ledger a la lista de llamadas que producirían.

    En Python y no llamando al intérprete de TypeScript: aquí no se ejecuta nada, solo se
    reescribe una forma en otra para poder compararla con el golden. Si divergiera del
    intérprete real, `script.golden.mjs` lo cazaría — ese sí lo ejecuta.
    """
    fuera = []
    for op in ops:
        if "revelar" in op:
            fuera.append(["reveal", op["revelar"]["bien"], *op["revelar"]["estaciones"]])
        elif "destacar" in op:
            fuera.append(["highlight", *op["destacar"]])
        elif "comprimir" in op:
            fuera.append(["compress", op["comprimir"]])
        elif "precio" in op:
            v = op["precio"]["valor"]
            if isinstance(v, str):
                t = v.replace(" ", "")
                for k in ("p1", "p2", "m"):
                    t = t.replace(k, str(ejemplo[k]))
                v = eval(t, {"__builtins__": {}}, {})   # noqa: S307 - solo dígitos y +-*/
            fuera.append(["morphPrice", op["precio"]["bien"], v])
    return fuera


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pack", nargs="?", default="budget-line")
    ap.add_argument("--lang", default="es")
    ap.add_argument("--rol", default="batch", help="rol de config/models.yaml")
    ap.add_argument("--intentos", type=int, default=3)
    ap.add_argument("--contra-golden", action="store_true",
                    help="compara los estados emitidos con los del switch original")
    ap.add_argument("--escribir", type=str, default=None,
                    help="ruta donde volcar el YAML emitido (por defecto no escribe nada)")
    args = ap.parse_args()

    from app.server.config import load_dotenv
    load_dotenv()
    from app.server.core.content.graph_schema import build_schema
    from app.server.core.content.loader import FilesystemPackSource
    from app.server.core.llm import default_provider
    from app.server.core.llm.provider import LLMError, LLMRequest
    from app.server.core.llm.roles import Router

    pack = FilesystemPackSource().get_pack(args.pack, args.lang)
    tl = pack.timeline(args.lang, "A")
    if tl is None:
        print(f"  {args.pack}: sin timeline compilada")
        return 2

    transcript = [s.model_dump() for s in tl.transcript]
    grafico = [c for c in tl.cues if c.type == "graph" and c.t is not None]
    siguientes = [c.t for c in grafico[1:]] + [None]
    cues = [{"id": c.id, "t": c.t, "dice": frase_en(transcript, c.t, sig)}
            for c, sig in zip(grafico, siguientes)]
    ids = [c["id"] for c in cues]
    e = pack.ejemplo
    ejemplo = {"p1": e.p1, "p2": e.p2, "m": e.m}

    provider, router = default_provider(), Router()
    spec = router.spec(args.rol)
    schema = build_schema(ids)
    user = user_prompt(cues, ejemplo)

    print(f"  {len(ids)} cues · modelo {spec.model} · esfuerzo {spec.effort}")

    doc, errs, gastado = None, [], 0.0
    for intento in range(1, args.intentos + 1):
        try:
            res = provider.complete(
                spec, LLMRequest(system=SYSTEM, user=user, json_schema=schema))
        except LLMError as err:
            print(f"  intento {intento}: el proveedor falló — {err}")
            return 1
        gastado += spec.cost_usd(res.input_tokens, res.output_tokens, res.cache_read_tokens)
        try:
            doc = json.loads(res.text)
        except json.JSONDecodeError as err:
            errs = [f"la respuesta no es JSON: {err}"]
            doc = None
        if doc is not None:
            errs = revisar_con_node(doc, ejemplo, ids)
        if not errs:
            print(f"  intento {intento}: válido")
            break
        print(f"  intento {intento}: {len(errs)} problema(s)")
        for x in errs[:4]:
            print(f"      {x}")
        # Devolverle los errores es la forma realista de usar esto. Se le dan TODOS.
        user = (user_prompt(cues, ejemplo)
                + "\n\nTu intento anterior tuvo estos problemas. Corrígelos todos:\n"
                + "\n".join(f"- {x}" for x in errs))
    else:
        print(f"  sin documento válido en {args.intentos} intentos · ${gastado:.4f}")
        return 1

    print(f"  coste: ${gastado:.4f}")

    if args.escribir:
        import yaml
        pathlib.Path(args.escribir).write_text(
            yaml.safe_dump(doc, allow_unicode=True, sort_keys=False), encoding="utf-8")
        print(f"  escrito en {args.escribir}")

    if args.contra_golden:
        # El ledger se compara aparte porque su golden son LLAMADAS y no estados: la banda
        # no tiene estado propio que inspeccionar, así que lo comprobable es qué se le pidió.
        gl = json.loads(
            (ROOT / "app/web/test/golden-ledger.json").read_text(encoding="utf-8"))

        # Dos cuentas, porque una sola engaña. `compress` y `morphPrice` en un mismo cue
        # conmutan —el resultado en pantalla es idéntico— así que exigir el mismo orden
        # cuenta como fallo algo que no lo es. La estricta se da igual porque el orden SÍ
        # importa entre `reveal` y `highlight` cuando destacan el mismo término.
        def norm(v):
            # `repr` distingue 3.0 de 3 y `==` no, así que la cuenta "laxa" salía MENOR
            # que la estricta — imposible por construcción, y la señal de que el
            # comparador estaba mal. Los números se normalizan antes de comparar.
            return [float(x) if isinstance(x, (int, float)) and not isinstance(x, bool)
                    else x for x in v]

        def multiset(x):
            return sorted(repr(norm(v)) for v in x)

        estricta = sum(1 for cue, esp in gl.items()
                       if llamadas_ledger(doc.get("ledger", {}).get(cue, []), ejemplo) == esp)
        laxa = sum(1 for cue, esp in gl.items()
                   if multiset(llamadas_ledger(doc.get("ledger", {}).get(cue, []), ejemplo))
                   == multiset(esp))
        print(f"\n  ledger: {estricta}/{len(gl)} idénticos, "
              f"{laxa}/{len(gl)} salvo el orden de operaciones que conmutan")
        for cue, esp in gl.items():
            mio = llamadas_ledger(doc.get("ledger", {}).get(cue, []), ejemplo)
            if multiset(mio) != multiset(esp):
                print(f"      {cue}: {mio}  !=  {esp}")

        golden = json.loads(
            (ROOT / "app/web/test/golden-estados.json").read_text(encoding="utf-8"))
        obtenido = estados_de(doc, ejemplo, [g["cue"] for g in golden])
        iguales = [a["cue"] for a, b in zip(obtenido, golden) if a["estado"] == b["estado"]]
        distintos = [(a["cue"], a["estado"], b["estado"])
                     for a, b in zip(obtenido, golden) if a["estado"] != b["estado"]]
        print(f"\n  contra el guion escrito a mano: {len(iguales)}/{len(golden)} cues iguales")
        for cue, mio, suyo in distintos:
            dif = {k: (mio[k], suyo[k]) for k in suyo
                   if mio.get(k) != suyo.get(k)}
            print(f"      {cue}: {dif}")
        # No es un fallo: que el modelo elija otra puesta en escena no lo hace incorrecto.
        # El número es el resultado del experimento, no un veredicto.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
