#!/usr/bin/env python3
"""Extract the distinct on-screen states ("screens") from a lecture video.

Two lecture formats appear in ECON-100A:

  * Module 1 - handwriting on an iPad grid. Content accumulates stroke by
    stroke, so the informative frame is the one just BEFORE a page turn, when
    the page is complete. Slow strokes produce small frame deltas; a page turn
    produces a large one.
  * Module 2 - a screen recording of a reveal.js deck. Slide changes are clean
    cuts.

Both are handled the same way: find the cuts, then sample each interval near
its end (the settled state), adding intermediate samples for long intervals so
that a page written on for several minutes is not reduced to one frame.

Usage:
    extract_screens.py VIDEO OUTDIR [--threshold 0.05] [--max-interval 75]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

PTS = re.compile(r"pts_time:([0-9.]+)")


def run(cmd: list[str]) -> str:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.stdout + proc.stderr


def duration_of(video: Path) -> float:
    out = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(video),
    ])
    return float(out.strip().splitlines()[0])


def detect_cuts(video: Path, threshold: float) -> list[float]:
    """Timestamps where the screen changes substantially."""
    out = run([
        "ffmpeg", "-v", "info", "-i", str(video),
        # Analyse at low resolution: 30x faster and the deltas we care about
        # (page turns, slide changes) survive downscaling intact.
        "-vf", f"scale=320:-1,select='gt(scene,{threshold})',showinfo",
        "-f", "null", "-",
    ])
    cuts = sorted({round(float(m), 3) for m in PTS.findall(out)})
    return cuts


def plan_samples(cuts: list[float], total: float, max_interval: float,
                 settle: float = 1.2) -> list[dict]:
    """Turn cut points into a list of frames worth extracting.

    For each interval between cuts, take a frame `settle` seconds before the
    interval ends (the completed state), plus evenly spaced extra frames when
    the interval runs longer than `max_interval`.
    """
    bounds = [0.0] + [c for c in cuts if 0.0 < c < total] + [total]
    samples: list[dict] = []
    for i in range(len(bounds) - 1):
        start, end = bounds[i], bounds[i + 1]
        span = end - start
        if span < 2.0:  # transition artefact, not a real screen
            continue
        # How many frames does this interval deserve?
        n_extra = int(span // max_interval)
        points = []
        for k in range(1, n_extra + 1):
            points.append(start + k * (span / (n_extra + 1)))
        points.append(max(start + 0.5, end - settle))  # the settled state
        for t in points:
            samples.append({
                "t": round(t, 2),
                "interval_start": round(start, 2),
                "interval_end": round(end, 2),
                "is_final_state": abs(t - (end - settle)) < 0.01,
            })
    return samples


def extract(video: Path, samples: list[dict], outdir: Path, width: int) -> list[dict]:
    outdir.mkdir(parents=True, exist_ok=True)
    written = []
    for i, s in enumerate(samples, 1):
        name = f"{i:03d}_{int(s['t']//60):02d}m{int(s['t']%60):02d}s.jpg"
        dest = outdir / name
        run([
            "ffmpeg", "-v", "error", "-ss", str(s["t"]), "-i", str(video),
            "-frames:v", "1", "-vf", f"scale={width}:-1", "-q:v", "4",
            str(dest), "-y",
        ])
        if dest.exists() and dest.stat().st_size > 0:
            written.append({**s, "file": name})
    return written


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("outdir", type=Path)
    ap.add_argument("--threshold", type=float, default=0.05)
    ap.add_argument("--max-interval", type=float, default=75.0)
    ap.add_argument("--width", type=int, default=1000)
    args = ap.parse_args()

    if not args.video.exists():
        print(f"missing video: {args.video}", file=sys.stderr)
        return 1

    total = duration_of(args.video)
    cuts = detect_cuts(args.video, args.threshold)
    samples = plan_samples(cuts, total, args.max_interval)
    written = extract(args.video, samples, args.outdir, args.width)

    index = {
        "video": args.video.name,
        "duration_s": round(total, 2),
        "threshold": args.threshold,
        "max_interval_s": args.max_interval,
        "n_cuts": len(cuts),
        "n_frames": len(written),
        "cuts": cuts,
        "frames": written,
    }
    (args.outdir / "index.json").write_text(json.dumps(index, indent=1))
    print(f"{args.video.name}: {len(cuts)} cuts -> {len(written)} frames "
          f"({total/60:.1f} min)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
