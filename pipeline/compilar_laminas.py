#!/usr/bin/env python3
"""Compila la baraja de láminas DESDE lo que ya existe.

    .venv/bin/python pipeline/compilar_laminas.py budget-line --lang es

No se escribe a mano: se deriva de `timeline.<lang>.json` y de `graph.yaml`. Esa es la
mitad falsable del experimento — si la migración necesitara autoría humana, la promesa de
"el concepto número veinte sale barato" se rompería aquí y no en la superficie.

## Lo que el debate decidió y esto implementa

**El audio de hoy sobrevive byte a byte.** Cada lámina posee una ventana `[desde, hasta)`
sobre el MISMO MP3, y las ventanas son contiguas: `hasta(N) == desde(N+1)`. Reproducir
hacia adelante no ejecuta ni un `seek`. Medido: 47 de 49 uniones con hueco 0,000 s.

**Los cues que comparten instante son la MISMA lámina.** Predicción y revelación caen en
el mismo segundo —tres veces en esta lección— porque el compilador de audio le da a una
marca sin narración detrás el timestamp de la siguiente. Tratarlos como dos láminas daría
intervalos de longitud cero. Aquí una lámina de pregunta lleva DENTRO el estado que se
revela al contestar: pregunta y revelación son un estado y su transición, no dos láminas.

**Una lámina de pregunta SÍ lleva audio.** `cp1` y `cp2` contienen sus enunciados hablados,
unas tres frases y ~23 s por idioma. La regla contraria dejaba el 10% de la grabación
huérfano; lo encontró `fable` auditando y lo confirmó `claude-b` midiéndolo.

**El estado es TOTAL.** Cada lámina trae el `GraphState` completo y las operaciones del
ledger acumuladas hasta ese punto, no un delta. Es lo que hace inexpresable F-001 —los dos
precios del café— en vez de arreglarlo.
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


def estados_por_cue(cues: list[dict], ejemplo: dict, guion: dict) -> list[dict]:
    """Pliega la máquina de estados REAL sobre los cues, ejecutándola en node.

    La misma técnica que `render_b.py`: se ejecuta `state.ts`, no se reimplementa. Una
    versión en Python sería más corta y estaría mal el día que alguien edite una y no la
    otra — y el fallo no sería un error, sería una lección que enseña otra cosa.
    """
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        subprocess.run(
            ["npx", "tsc", str(SRC / "state.ts"), str(SRC / "script.ts"),
             "--outDir", str(out), "--rootDir", str(SRC.parent),
             "--target", "es2020", "--module", "es2020", "--moduleResolution", "node",
             "--skipLibCheck"],
            cwd=ROOT / "app" / "web", check=True, capture_output=True, text=True)
        drv = out / "d.mjs"
        drv.write_text(
            "import {estadoInicial, aplicarCue} from './graph/state.js';\n"
            "const {cues, ejemplo, guion} = JSON.parse(process.argv[2]);\n"
            "let s = estadoInicial(ejemplo);\n"
            "const out = [];\n"
            "for (const c of cues) {\n"
            "  s = aplicarCue(s, c.id, ejemplo, guion);\n"
            "  out.push({cue: c.id, estado: s});\n"
            "}\n"
            "process.stdout.write(JSON.stringify(out));\n", encoding="utf-8")
        r = subprocess.run(
            ["node", str(drv), json.dumps({"cues": cues, "ejemplo": ejemplo, "guion": guion})],
            capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip()[:600])
        return json.loads(r.stdout)


def renderizar(latex: list[str]) -> dict[str, str]:
    """LaTeX -> HTML, con KaTeX y EN TIEMPO DE COMPILACIÓN.

    El JavaScript de KaTeX pesa unas veinte veces más que todo el cliente de tutorIA, así
    que no viaja: al navegador solo llegan el CSS y las fuentes, que ya se sirven. Es la
    misma vía por la que se dibuja hoy la ecuación de las fichas.
    """
    if not latex:
        return {}
    with tempfile.TemporaryDirectory() as tmp:
        drv = pathlib.Path(tmp) / "k.mjs"
        drv.write_text(
            "import {createRequire} from 'node:module';\n"
            "const katex = createRequire(process.argv[3])('katex');\n"
            "const out = {};\n"
            "for (const tex of JSON.parse(process.argv[2])) {\n"
            # `trust:false` y `strict:false`: el contenido puede venir de un modelo algún
            # día, así que se renderiza sin permitirle emitir HTML propio (\\htmlClass,
            # \\url), y un comando desconocido se pinta en rojo en vez de tumbar la
            # compilación entera.
            "  out[tex] = katex.renderToString(tex, {throwOnError: false, trust: false,\n"
            "                                        strict: false, output: 'html'});\n"
            "}\n"
            "process.stdout.write(JSON.stringify(out));\n", encoding="utf-8")
        r = subprocess.run(
            ["node", str(drv), json.dumps(latex), str(ROOT / "app" / "web" / "package.json")],
            capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip()[:600])
        return json.loads(r.stdout)


def frases_con_matematica(tl, sidecar: dict) -> list[dict]:
    """Devuelve el transcript con la matemática DEVUELTA A SU FORMA ESCRITA.

    El problema, en una frase: lo que se ve en pantalla es la transcripción del audio, y la
    transcripción está escrita PARA EL OÍDO. Donde el guion dice `$(x_1, x_2)$`, el audio
    dice —y el subtítulo muestra— "x sub 1, x sub 2". Kristian lo vio en pantalla.

    No hace falta reescribir nada ni adivinar: el compilador de audio guardó LAS DOS
    FORMAS de cada fórmula, la original en LaTeX y la hablada. Aquí se deshace el cambio.

    Además une frases: el troceador del compilador de audio partió `(x_1, x_2)` por la
    mitad, así que una fórmula se repartía entre dos subtítulos —"(x sub 1, x sub 2" en uno
    y ")." en el siguiente—. Al unirlas se conserva el arranque de la primera, que es lo
    que ancla la ventana de la lámina.
    """
    formulas = sidecar.get("formulas") or []
    frases = [s.model_dump() for s in tl.transcript]
    if not formulas:
        return [{"partes": [{"t": f["text"]}], "start_s": f["start_s"]} for f in frases]

    # 1. Unir mientras alguna forma hablada quede partida entre dos frases vecinas.
    def parte_una(a: str, b: str) -> bool:
        return any(f["spoken"] not in a and f["spoken"] not in b
                   and f["spoken"] in f"{a} {b}" for f in formulas)

    unidas: list[dict] = []
    for f in frases:
        if unidas and parte_una(unidas[-1]["text"], f["text"]):
            unidas[-1]["text"] = f"{unidas[-1]['text']} {f['text']}"
        else:
            unidas.append(dict(f))

    # 2. Partir cada frase en tramos de texto y tramos de matemática.
    html = renderizar([f["original"].strip("$ ") for f in formulas])
    salida = []
    for f in unidas:
        partes: list[dict] = [{"t": f["text"]}]
        for fo in formulas:
            nuevas: list[dict] = []
            for p in partes:
                if "t" not in p or fo["spoken"] not in p["t"]:
                    nuevas.append(p)
                    continue
                trozos = p["t"].split(fo["spoken"])
                for i, tr in enumerate(trozos):
                    if i:
                        nuevas.append({"m": html[fo["original"].strip("$ ")]})
                    if tr:
                        nuevas.append({"t": tr})
            partes = nuevas
        # La puntuación que el TTS empujó fuera de la fórmula vuelve a pegarse.
        for p in partes:
            if "t" in p:
                p["t"] = p["t"].replace(" ,", ",").replace(" .", ".").replace(" )", ")")
        salida.append({"partes": partes, "start_s": f["start_s"]})
    return salida


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pack", nargs="?", default="budget-line")
    ap.add_argument("--lang", default="es")
    args = ap.parse_args()

    from app.server.core.content.loader import FilesystemPackSource

    pack = FilesystemPackSource().get_pack(args.pack, args.lang)
    tl = pack.timeline(args.lang, "A")
    if tl is None or not pack.graph_script:
        print(f"  {args.pack}/{args.lang}: falta timeline o graph.yaml")
        return 2

    e = pack.ejemplo
    ejemplo = {"p1": e.p1, "p2": e.p2, "m": e.m}
    dur = tl.duration_s

    # 1. Los cues, en orden, AGRUPADOS por instante. Los que comparten segundo son la
    #    misma lámina: uno es la pregunta y el otro su revelación.
    cues = sorted([c for c in tl.cues if c.t is not None], key=lambda c: c.t)
    grupos: list[list] = []
    for c in cues:
        if grupos and abs(grupos[-1][0].t - c.t) < 1e-6:
            grupos[-1].append(c)
        else:
            grupos.append([c])

    # 2. El estado tras cada cue de gráfico, ejecutando la máquina real.
    solo_grafico = [{"id": c.id, "t": c.t} for c in cues if c.type == "graph"]
    plegado = {x["cue"]: x for x in
               estados_por_cue(solo_grafico, ejemplo, pack.graph_script)}

    # 3. El ledger es ACUMULADO: cada lámina trae todo lo encendido hasta ella, no el
    #    delta. Es lo que hace inexpresable que un salto atrás deje estaciones encendidas.
    #
    #    `desde_op` marca dónde empiezan las operaciones PROPIAS de esta lámina. No es un
    #    delta heredado —se deriva del total, no se arrastra— y sirve para una sola cosa:
    #    al pintar, el prefijo se aplica en silencio y solo lo nuevo se anima. Sin eso el
    #    precio del café parpadearía en todas las láminas posteriores al pivote.
    #
    #    Se copian las operaciones TAL CUAL están escritas en `graph.yaml`, no el efecto
    #    que producen. Así la baraja habla el mismo vocabulario cerrado que ya se midió en
    #    D-3, y el intérprete del navegador es el mismo — no hay un segundo formato que
    #    mantener en sincronía con el primero.
    guion_ledger = pack.graph_script.get("ledger") or {}
    acumulado: list[dict] = []
    acum_por_cue: dict[str, list] = {}
    desde_por_cue: dict[str, int] = {}
    for c in solo_grafico:
        desde_por_cue[c["id"]] = len(acumulado)
        acumulado = acumulado + list(guion_ledger.get(c["id"], []))
        acum_por_cue[c["id"]] = list(acumulado)

    # El sidecar del compilador de audio, que es quien guarda las dos formas de cada
    # fórmula. Si falta, los subtítulos salen tal cual venían: verbalizados y feos, pero
    # la lección se compila igual.
    mp3 = ROOT / "content" / "packs" / args.pack / "media" / tl.audio.split("/")[-1]
    sc = mp3.with_suffix("").with_suffix(".audio.json")
    if not sc.exists():
        sc = mp3.parent / (mp3.stem + ".audio.json")
    sidecar = json.loads(sc.read_text(encoding="utf-8")) if sc.exists() else {}
    transcript = frases_con_matematica(tl, sidecar)

    def frases(desde: float, hasta: float) -> list[list[dict]]:
        return [s["partes"] for s in transcript
                if s["start_s"] >= desde - 1e-6 and s["start_s"] < hasta - 1e-6]

    # 4. Las láminas. La ventana de la primera arranca en 0 para que el título hablado
    #    —los 2,25 s que no pertenecen a ningún cue— no quede huérfano.
    laminas = []
    for i, g in enumerate(grupos):
        desde = 0.0 if i == 0 else g[0].t
        hasta = grupos[i + 1][0].t if i + 1 < len(grupos) else dur

        grafico = next((c for c in g if c.type == "graph"), None)
        pregunta = next((c for c in g if c.type in ("checkpoint", "prediction")), None)

        ref = grafico.id if grafico else None
        lam: dict = {
            "id": g[0].id if not pregunta else pregunta.id,
            "tipo": "pregunta" if pregunta else "explica",
            "audio": {"desde": round(desde, 3), "hasta": round(hasta, 3)},
            "dice": frases(desde, hasta),
        }
        if ref:
            # Estado TOTAL, nunca un delta.
            lam["escena"] = plegado[ref]["estado"]
            lam["ledger"] = acum_por_cue[ref]
            lam["desde_op"] = desde_por_cue[ref]
        elif laminas:
            lam["escena"] = laminas[-1]["escena"]
            lam["ledger"] = laminas[-1]["ledger"]
            lam["desde_op"] = len(lam["ledger"])
        if pregunta:
            lam["item"] = (pack.predictions or {}).get(pregunta.id) or next(
                (cp.pregunta_ref for cp in pack.checkpoints if cp.id == pregunta.id), None)
            lam["clase"] = pregunta.type
            # De qué lado de la pregunta cae la voz. NO es cosmético y no es el mismo en
            # los dos casos:
            #
            #   checkpoint  -> la ventana CONTIENE el enunciado hablado. Suena, y al
            #                  acabar aparece la pregunta.
            #   prediction  -> la ventana contiene la REVELACIÓN. Se pregunta primero y
            #                  la voz explica después.
            #
            # Invertirlo en una predicción no descoloca: revienta el ítem. La ventana de
            # `price_effect` dice literalmente "la línea no se desplaza: gira", que es su
            # respuesta. Un runtime que reprodujera primero y preguntara después regalaría
            # la respuesta en tres de los cinco ítems.
            lam["momento"] = "antes" if pregunta.type == "checkpoint" else "despues"
        laminas.append(lam)

    baraja = {
        "version": 1, "pack": pack.id, "lang": args.lang,
        "audio": tl.audio, "duracion_s": dur,
        "ejemplo": ejemplo,
        "bien1": getattr(e.bien_1, args.lang), "bien2": getattr(e.bien_2, args.lang),
        "titulo": getattr(pack.titulo, args.lang),
        "laminas": laminas,
    }

    destino = ROOT / "content" / "packs" / args.pack / "media" / f"laminas.{args.lang}.json"
    destino.write_text(json.dumps(baraja, ensure_ascii=False, indent=1), encoding="utf-8")

    # --- las comprobaciones que hacen esto falsable ---------------------------------
    huecos = [round(laminas[i + 1]["audio"]["desde"] - laminas[i]["audio"]["hasta"], 6)
              for i in range(len(laminas) - 1)]
    malos = [h for h in huecos if abs(h) > 1e-6]
    cubierto = sum(l["audio"]["hasta"] - l["audio"]["desde"] for l in laminas)
    con_voz = [l["id"] for l in laminas if l["tipo"] == "pregunta" and l["dice"]]
    con_mat = sum(1 for l in laminas for fr in l["dice"] for p in fr if "m" in p)

    print(f"  {len(laminas)} láminas ({sum(1 for l in laminas if l['tipo']=='pregunta')} de pregunta)")
    print(f"  uniones sin hueco: {len(huecos) - len(malos)}/{len(huecos)}"
          + (f"  MALAS: {malos}" if malos else ""))
    print(f"  audio cubierto: {cubierto:.3f}s de {dur:.3f}s "
          f"({100*cubierto/dur:.1f}%)")
    print(f"  láminas de pregunta CON voz: {con_voz}")
    print(f"  fórmulas devueltas a su forma escrita en los subtítulos: {con_mat}")
    print(f"  -> {destino.relative_to(ROOT)}")
    return 0 if not malos and abs(cubierto - dur) < 0.01 else 1


if __name__ == "__main__":
    raise SystemExit(main())
