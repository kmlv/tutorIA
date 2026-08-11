#!/usr/bin/env python3
"""Builds option B of the bake-off: the lesson pre-rendered to MP4 with Remotion.

    .venv/bin/python pipeline/render_b.py budget-line --lang es

What it does, in order: folds the compiled timeline through the SAME state machine the
live app uses, writes the resulting beats as Remotion props, renders the MP4, copies it
next to the audio, and emits `timeline.<lang>.B.json` so the app can serve it as a
variant.

The state machine is executed, never re-implemented. `app/web/src/graph/state.ts` is
compiled to JS and run under node, so the beats are by construction the states option A
would have painted at the same seconds. That is what makes the criterion-2 comparison
mean anything: change the income in `pack.yaml` and B's props change with no edit here.
The cost of the change is then a real number — the render — instead of an argument.

Requires `npm install` inside `bakeoff/remotion` once (Remotion pulls its own headless
Chrome, which is why node_modules is gitignored and this is not part of the test suite).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
REMOTION = ROOT / "bakeoff" / "remotion"
STATE_TS = ROOT / "app" / "web" / "src" / "graph" / "state.ts"
FPS = 30

sys.path.insert(0, str(ROOT))


def beats_via_node(cues: list[dict], ejemplo: dict, guion: dict) -> list[dict]:
    """Runs the app's own state machine over the cues and returns one state per cue.

    Through node rather than a Python port. A port would be shorter to write and would
    be wrong the first time someone edits one and not the other — and the failure mode is
    not a crash, it is a video that teaches a slightly different lesson than the app.
    """
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        subprocess.run(
            # `--rootDir` en `src/` y no en `src/graph/`: state.ts importa el tipo de
            # `../types`, y tsc lo cuenta como fuente aunque el import sea `import type`
            # y no sobreviva a la compilación. Con rootDir en graph/ aborta con TS6059.
            ["npx", "tsc", str(STATE_TS), str(STATE_TS.parent / "script.ts"),
             "--outDir", str(out),
             "--rootDir", str(STATE_TS.parents[1]),
             "--target", "es2020", "--module", "es2020", "--moduleResolution", "node",
             "--skipLibCheck"],
            cwd=ROOT / "app" / "web", check=True, capture_output=True, text=True,
        )
        driver = out / "driver.mjs"
        driver.write_text(
            "import {estadoInicial, aplicarCue} from './graph/state.js';\n"
            "import {revisar} from './graph/script.js';\n"
            "const {cues, ejemplo, guion} = JSON.parse(process.argv[2]);\n"
            "const errs = revisar(guion, ejemplo, new Set(cues.map(c => c.id)));\n"
            "if (errs.length) { console.error(errs.join('\\n')); process.exit(3); }\n"
            "let s = estadoInicial(ejemplo);\n"
            "const beats = [];\n"
            "for (const c of cues) {\n"
            "  s = aplicarCue(s, c.id, ejemplo, guion);\n"
            "  beats.push({cue: c.id, t: c.t, estado: s});\n"
            "}\n"
            "process.stdout.write(JSON.stringify(beats));\n",
            encoding="utf-8",
        )
        r = subprocess.run(
            ["node", str(driver),
             json.dumps({"cues": cues, "ejemplo": ejemplo, "guion": guion})],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            raise RuntimeError(f"el driver de estados falló:\n{r.stderr.strip()}")
        return json.loads(r.stdout)


def huella(tl) -> str:
    """Identifies the A timeline this render was derived from.

    Only the cues and the duration: those are what the MP4 bakes in. A change to the
    transcript alters the burnt-in captions and is worth re-rendering for, but it does not
    make the existing video WRONG, and a fingerprint that fires on every typo stops being
    read.
    """
    payload = json.dumps(
        {"cues": [(c.id, c.t) for c in tl.cues], "duration_s": round(tl.duration_s, 3)},
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def caption_for(transcript: list[dict], t: float) -> str:
    """The sentence being spoken at that instant, so the burnt-in caption matches the
    narration rather than restating the cue id."""
    for seg in transcript:
        if seg["start_s"] <= t <= seg["end_s"]:
            return seg["text"]
    posteriores = [s for s in transcript if s["start_s"] >= t]
    return posteriores[0]["text"] if posteriores else ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pack", nargs="?", default="budget-line")
    ap.add_argument("--lang", default="es")
    ap.add_argument("--props-only", action="store_true",
                    help="genera los props y para, sin renderizar")
    args = ap.parse_args()

    from app.server.core.content.loader import FilesystemPackSource

    pack = FilesystemPackSource().get_pack(args.pack, args.lang)
    tl = pack.timeline(args.lang, "A")
    if tl is None:
        print(f"  {args.pack}/{args.lang}: no hay timeline de la variante A que doblar")
        return 2

    e = pack.ejemplo
    ejemplo = {"p1": e.p1, "p2": e.p2, "m": e.m}
    # Only graph cues carry a picture. Checkpoints and predictions are handled by the
    # app, which pauses the video exactly as it pauses the audio — the MP4 has no idea
    # they exist, and that is the point: the interaction is not baked in.
    cues = [{"id": c.id, "t": c.t} for c in tl.cues if c.type == "graph" and c.t is not None]
    if not pack.graph_script:
        print(f"  {args.pack}: falta graph.yaml (D-3); sin él no hay nada que dibujar")
        return 2
    beats = beats_via_node(cues, ejemplo, pack.graph_script)

    transcript = [s.model_dump() for s in tl.transcript]
    for b in beats:
        b["caption"] = caption_for(transcript, b["t"])

    props = {
        "beats": beats,
        "audio": tl.audio,
        "bien1": getattr(e.bien_1, args.lang),
        "bien2": getattr(e.bien_2, args.lang),
        "titulo": getattr(pack.titulo, args.lang),
        # Same fixed scale as the live graph, derived from the pack for the same reason:
        # rescaling axes would make a parallel shift look like a pivot.
        "maxX": (e.m / e.p1) * 1.6,
        "maxY": (e.m / e.p2) * 1.6,
        "duration_s": tl.duration_s,
    }

    (REMOTION / "props").mkdir(parents=True, exist_ok=True)
    (REMOTION / "public").mkdir(parents=True, exist_ok=True)
    (REMOTION / "props" / "lesson.json").write_text(
        json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")

    media = ROOT / "content" / "packs" / args.pack / "media"
    shutil.copy(media / tl.audio, REMOTION / "public" / tl.audio)

    print(f"  props: {len(beats)} beats, {tl.duration_s:.1f}s, "
          f"{int(tl.duration_s * FPS)} frames")
    if args.props_only:
        return 0

    if not (REMOTION / "node_modules").is_dir():
        print(f"  falta `npm install` en {REMOTION}")
        return 2

    salida = REMOTION / "out" / f"lesson.{args.lang}.mp4"
    print("  renderizando…")
    r = subprocess.run(
        ["npx", "remotion", "render", "src/index.ts", "Lesson", str(salida),
         "--log", "error"],
        cwd=REMOTION, text=True,
    )
    if r.returncode != 0 or not salida.is_file():
        print("  el render falló")
        return 1

    destino = f"{salida.stem.replace('.', '-')}.mp4"
    shutil.copy(salida, media / destino)

    # The B timeline is A's, with the video attached. Deliberately the same cues at the
    # same seconds: the bake-off compares how the picture is drawn, and a B with its own
    # pacing would be comparing two lessons instead of two technologies.
    b_tl = tl.model_copy(update={"variant": "B", "video": destino,
                                 "derivada_de": huella(tl)})
    (media / f"timeline.{args.lang}.B.json").write_text(
        b_tl.model_dump_json(indent=1), encoding="utf-8")

    mb = (media / destino).stat().st_size / 1e6
    audio_mb = (media / tl.audio).stat().st_size / 1e6
    print(f"  {destino}: {mb:.2f} MB (el MP3 de A pesa {audio_mb:.2f} MB, "
          f"+{mb - audio_mb:.2f} MB)")
    print(f"  timeline.{args.lang}.B.json escrita — pruébala con ?variant=B")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
