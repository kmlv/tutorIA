#!/usr/bin/env bash
# Extract screens for every ingested ECON-100A lecture.
# Module 1 is handwriting on an iPad; Module 2 is a reveal.js screen recording.
# Both respond well to the same cut threshold, so the only difference is that
# the handwritten videos get denser intermediate sampling (content accumulates
# within a page, whereas a slide is static once shown).
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
VID="$REPO/workspace/econ100a/video"
OUT="$REPO/workspace/econ100a/frames"
PY="$REPO/content/courses/econ100a/extract_screens.py"

for f in "$VID"/*.mp4; do
  slug="$(basename "$f" .mp4)"
  if [ -f "$OUT/$slug/index.json" ]; then
    echo "skip (done): $slug"
    continue
  fi
  case "$slug" in
    m1-*) max_interval=60 ;;   # handwriting builds up within a page
    *)    max_interval=120 ;;  # a slide is static once it is on screen
  esac
  python3 "$PY" "$f" "$OUT/$slug" --threshold 0.05 --max-interval "$max_interval"
done

echo "=== done ==="
for d in "$OUT"/*/; do
  [ -f "$d/index.json" ] || continue
  n=$(ls -1 "$d"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
  echo "$(basename "$d"): $n frames"
done
