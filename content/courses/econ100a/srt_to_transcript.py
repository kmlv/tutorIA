#!/usr/bin/env python3
"""Turn a YuJa .srt caption file into a readable, timestamped transcript.

The captions arrive as ~2-second cues, which is unreadable in bulk. This groups
them into paragraphs and prints one timestamp per paragraph, so a reader (or a
model) can still cite an exact moment in the video.

Speaker prefixes used by the two caption vendors ("- [Cristian]", ">>") are
normalized away; sound cues in parentheses are kept, since "(chill music)"
marks the intro and is useful structure.

Usage:
    srt_to_transcript.py CAPTIONS.srt [--seconds-per-para 45] > transcript.md
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TIME = re.compile(r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")
SPEAKER = re.compile(r"^\s*(?:-\s*)?(?:>>\s*)?(?:\[[^\]]+\]\s*)?")


def parse(path: Path) -> list[tuple[float, str]]:
    cues: list[tuple[float, str]] = []
    block: list[str] = []
    start: float | None = None
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line:
            if start is not None and block:
                cues.append((start, " ".join(block)))
            block, start = [], None
            continue
        m = TIME.match(line)
        if m:
            h, mi, s, ms = (int(x) for x in m.groups()[:4])
            start = h * 3600 + mi * 60 + s + ms / 1000
            continue
        if line.isdigit() and start is None:
            continue
        block.append(SPEAKER.sub("", line).strip())
    if start is not None and block:
        cues.append((start, " ".join(block)))
    return cues


def stamp(t: float) -> str:
    return f"{int(t // 60):02d}:{int(t % 60):02d}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("srt", type=Path)
    ap.add_argument("--seconds-per-para", type=float, default=45.0)
    args = ap.parse_args()

    cues = parse(args.srt)
    if not cues:
        print(f"no cues parsed from {args.srt}", file=sys.stderr)
        return 1

    print(f"# {args.srt.stem}\n")
    print(f"<!-- {len(cues)} caption cues, "
          f"{cues[-1][0] / 60:.1f} min, source: YuJa human captions -->\n")

    para_start = cues[0][0]
    words: list[str] = []
    for t, text in cues:
        if t - para_start >= args.seconds_per_para and words:
            print(f"**[{stamp(para_start)}]** {' '.join(words)}\n")
            para_start, words = t, []
        words.append(text)
    if words:
        print(f"**[{stamp(para_start)}]** {' '.join(words)}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
