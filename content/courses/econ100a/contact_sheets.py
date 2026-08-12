#!/usr/bin/env python3
"""Tile extracted frames into contact sheets for review.

Reading 250 lecture frames one by one is wasteful; most of a frame is empty
grid. Tiling them lets a whole segment of a lecture be read at once, with each
cell still large enough to make out handwriting or a slide title.

Cell size is chosen so that the finished sheet lands near 1568px on its long
edge, which is where image readers stop downscaling.

Usage:
    contact_sheets.py FRAMEDIR OUTDIR --cols 2 --rows 2 [--final-only]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("framedir", type=Path)
    ap.add_argument("outdir", type=Path)
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--rows", type=int, default=2)
    ap.add_argument("--cell-width", type=int, default=780)
    ap.add_argument("--final-only", action="store_true")
    args = ap.parse_args()

    index = json.loads((args.framedir / "index.json").read_text())
    frames = index["frames"]
    if args.final_only:
        frames = [f for f in frames if f["is_final_state"]]
    if not frames:
        print(f"no frames in {args.framedir}")
        return 0

    args.outdir.mkdir(parents=True, exist_ok=True)
    per_sheet = args.cols * args.rows
    sheets = []

    for s in range(0, len(frames), per_sheet):
        chunk = frames[s : s + per_sheet]
        sheet_no = s // per_sheet + 1
        dest = args.outdir / f"sheet{sheet_no:02d}.jpg"

        inputs: list[str] = []
        for f in chunk:
            inputs += ["-i", str(args.framedir / f["file"])]

        # Pad the last sheet so the tile filter always gets a full grid.
        n = len(chunk)
        filt = "".join(
            f"[{i}:v]scale={args.cell_width}:-1,pad=iw+8:ih+8:4:4:color=0x303030[c{i}];"
            for i in range(n)
        )
        if n < per_sheet:
            filt += f"color=c=0x101010:s={args.cell_width}x{int(args.cell_width*0.75)}[blank];"
            for k in range(n, per_sheet):
                filt += f"[blank]split[blank][c{k}];" if k < per_sheet - 1 else f"[blank]copy[c{k}];"
        filt += "".join(f"[c{i}]" for i in range(per_sheet))
        filt += f"xstack=inputs={per_sheet}:layout="
        layout = []
        for r in range(args.rows):
            for c in range(args.cols):
                x = "0" if c == 0 else "+".join(["w0"] * c)
                y = "0" if r == 0 else "+".join(["h0"] * r)
                layout.append(f"{x}_{y}")
        filt += "|".join(layout) + "[out]"

        cmd = ["ffmpeg", "-v", "error", *inputs, "-filter_complex", filt,
               "-map", "[out]", "-frames:v", "1", "-q:v", "3", str(dest), "-y"]
        subprocess.run(cmd, capture_output=True, text=True)

        sheets.append({
            "sheet": dest.name,
            "cells": [{"pos": i + 1, "file": f["file"], "t": f["t"]}
                      for i, f in enumerate(chunk)],
        })

    (args.outdir / "sheets.json").write_text(json.dumps(
        {"source": index["video"], "layout": f"{args.cols}x{args.rows}",
         "n_sheets": len(sheets), "sheets": sheets}, indent=1))
    print(f"{index['video']}: {len(frames)} frames -> {len(sheets)} sheets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
