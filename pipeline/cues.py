#!/usr/bin/env python3
"""Compila un guion con marcas de cue en audio + timeline.json.

POR QUE EXISTE ESTE PASO
------------------------
El PLAN asumia que se podian poner marcas `<!--cue:X-->` dentro del guion y que
`audioexplain` las ignoraria por ser comentarios HTML. **No es asi.** Verificado en
M1 con una prueba directa: un guion identico con y sin un comentario dura 6s y 4s
respectivamente. El comentario se narra en voz alta.

Asi que el compilador hace tres cosas:
  1. extrae las marcas y recuerda que oracion sigue a cada una,
  2. sintetiza el guion YA LIMPIO,
  3. casa cada marca con el `start_s` de la oracion que la seguia.

Efecto lateral: al no narrar las marcas, el guion de linea presupuestaria baja de
3:21 a ~2:57. (La duracion de 2-3 min de la decision 3 es REFERENCIAL, no un limite
duro: orienta la extension del guion, no obliga a recortar contenido.)

Uso:  cues.py content/packs/<pack>/script.<lang>.md [--voice VOZ] [--rate RATE]
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys

CUE_RE = re.compile(r"<!--\s*cue:([a-zA-Z0-9_.:-]+)\s*-->")


def norm(s: str) -> str:
    return re.sub(r"[^0-9a-záéíóúüñ]", "", s.lower())


def parse(script: str) -> tuple[str, list[dict]]:
    """Devuelve (texto_limpio, cues) donde cada cue sabe que texto le sigue."""
    cues: list[dict] = []
    out: list[str] = []
    pos = 0
    for m in CUE_RE.finditer(script):
        out.append(script[pos:m.start()])
        name = m.group(1)
        kind = "checkpoint" if name.startswith("checkpoint:") else "graph"
        cues.append({
            "id": name.split(":", 1)[-1] if kind == "checkpoint" else name,
            "type": kind,
            # el texto que sigue a la marca, hasta la siguiente marca o el final
            "_follows": None,
            "_char": len("".join(out)),
        })
        pos = m.end()
    out.append(script[pos:])
    clean = "".join(out)

    # que texto sigue a cada marca, en el texto YA limpio
    for i, c in enumerate(cues):
        start = c["_char"]
        end = cues[i + 1]["_char"] if i + 1 < len(cues) else len(clean)
        c["_follows"] = clean[start:end].strip()
    return clean, cues


def build_transcript(segments: list[dict]) -> list[dict]:
    """Keep the sentence-level timing contract needed by selectable captions.

    The audio sidecar contains provider metadata that the browser does not need.  The
    timeline owns this reduced representation so its language, audio, cues and spoken
    text cannot drift into independently cached files.
    """
    transcript: list[dict] = []
    previous_start = -1.0
    for index, segment in enumerate(segments):
        text = str(segment.get("text", "")).strip()
        start = float(segment["start_s"])
        end = float(segment["end_s"])
        if not text:
            raise ValueError(f"segment {index}: empty transcript text")
        if start < 0 or end < start:
            raise ValueError(f"segment {index}: invalid interval {start}..{end}")
        if start < previous_start:
            raise ValueError(f"segment {index}: transcript is not ordered")
        previous_start = start
        transcript.append({
            "text": text,
            "start_s": round(start, 3),
            "end_s": round(end, 3),
            "part_index": int(segment["part_index"]),
        })
    return transcript


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("script", type=pathlib.Path)
    ap.add_argument("--voice")
    ap.add_argument("--rate")
    args = ap.parse_args()

    src = args.script
    lang = src.suffixes[-2].lstrip(".") if len(src.suffixes) > 1 else "es"
    pack_dir = src.parent
    media = pack_dir / "media"
    media.mkdir(exist_ok=True)

    clean, cues = parse(src.read_text(encoding="utf-8"))
    if not cues:
        print(f"aviso: {src} no tiene marcas <!--cue:X-->", file=sys.stderr)

    clean_path = media / f"_clean.{lang}.md"
    clean_path.write_text(clean, encoding="utf-8")

    title = f"{pack_dir.name}-{lang}"
    cmd = ["audioexplain", "--input", str(clean_path), "--lang", lang,
           "--style", "mono", "--title", title, "--out-dir", str(media),
           "--project", "tutorIA", "--tag", pack_dir.name]
    if args.voice:
        cmd += ["--voice", args.voice]
    if args.rate:
        cmd += ["--rate", args.rate]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout + r.stderr, file=sys.stderr)
        return r.returncode

    # audioexplain manda sus [audioexplain] a stderr; stdout lleva SOLO la ruta del mp3
    mp3 = pathlib.Path(r.stdout.strip().splitlines()[-1])
    sidecar = mp3.with_name(mp3.stem + ".audio.json")
    if not sidecar.exists():
        print(f"no encuentro el sidecar junto a {mp3}", file=sys.stderr)
        return 1

    meta = json.loads(sidecar.read_text(encoding="utf-8"))
    segments = meta["sync"]["segments"]

    # casar cada cue con la oracion que le sigue
    resolved = []
    si = 0
    for c in cues:
        target = norm(c["_follows"])
        hit = None
        for k in range(si, len(segments)):
            seg = norm(segments[k]["text"])
            # el texto que sigue al cue EMPIEZA con esta oracion, pero puede seguir
            # mas alla de ella: comparar solo el prefijo comun mas corto de los dos.
            # el floor es bajo a proposito: oraciones cortas y legitimas como
            # "To recap." solo dan 7 caracteres normalizados. El riesgo de falso
            # positivo es bajo porque escaneamos hacia adelante desde el ultimo
            # cue resuelto y los cues estan en orden.
            n = min(len(seg), len(target), 24)
            if n >= 5 and seg[:n] == target[:n]:
                hit = k
                break
        if hit is None:
            resolved.append({"id": c["id"], "type": c["type"], "t": None,
                             "warning": "sin alinear"})
            continue
        si = hit
        resolved.append({"id": c["id"], "type": c["type"],
                         "t": round(float(segments[hit]["start_s"]), 3)})

    timeline = {
        "pack": pack_dir.name,
        "lang": lang,
        "audio": mp3.name,
        "duration_s": meta.get("duration_s"),
        "sync_granularity": meta["sync"].get("granularity"),
        "cues": resolved,
        "transcript": build_transcript(segments),
    }
    tl = media / f"timeline.{lang}.json"
    tl.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")

    bad = [c for c in resolved if c["t"] is None]
    dur = timeline["duration_s"]
    print(f"{tl}")
    print(f"  audio    : {mp3.name}  ({int(dur // 60)}:{int(dur % 60):02d})")
    print(f"  cues     : {len(resolved)} ({len(bad)} sin alinear)")
    print(f"  captions : {len(timeline['transcript'])} sentences")
    for c in resolved:
        mark = "  !" if c["t"] is None else "   "
        t = "----" if c["t"] is None else f"{c['t']:7.2f}"
        print(f"  {mark} {t}  {c['type']:10s} {c['id']}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
