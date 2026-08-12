#!/usr/bin/env bash
# Move downloaded YuJa MP4s from ~/Downloads into the gitignored workspace,
# renaming CloudFront UUID filenames to lecture slugs.
# Safe to re-run: only moves files that have finished downloading.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEST="$REPO/workspace/econ100a/video"
SRC="$HOME/Downloads"
mkdir -p "$DEST"

map() {
  case "$1" in
    Video-085c8670-bec7-4022-b73e-5d4871f803ea_processed.mp4) echo m1-l1-intro-microeconomics ;;
    Video-bedf663a-7a65-4b1b-a1de-e5fe99c6ac1f_processed.mp4) echo m1-l2-consumption-bundles-and-budget-line ;;
    Video-76bec10f-8a17-458e-9ba3-e8d9f1fdbc5e_processed.mp4) echo m1-l3-changes-in-budget-line ;;
    Video-c2156c7e-effd-42aa-822e-61054a5c46ba_processed.mp4) echo m1-l4-taxes ;;
    Video-de79346a-c5b8-4992-bde2-d6aa4a8e3d26_processed.mp4) echo m2-l1-preferences-part1 ;;
    Video-0274cf7b-dcf6-47d7-aab8-d3045760eaad_processed.mp4) echo m2-l2-preferences-part2 ;;
    Video-a79c76c8-fe2a-4b8b-b6a1-e8a03c2fa88a_processed.mp4) echo m2-l3-utility-part1 ;;
    Video-ea769891-e6b9-4e37-9c02-297e92e1b8b0_processed.mp4) echo m2-l4-utility-part2 ;;
    Video-5e4f03d2-b6e0-46cc-bd1a-32321043dd78_processed.mp4) echo m2-l5-typical-utility-function ;;
    Video-58036a7c-2e85-470b-8615-48ad557cd531_processed.mp4) echo m2-l6-marginal-utility ;;
    Video-fcaa567c-cb15-4894-ab2d-3ee0ca01e193_processed.mp4) echo m2-l7-marginal-rate-of-substitution ;;
    *) echo "" ;;
  esac
}

moved=0
for f in "$SRC"/Video-*_processed.mp4; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  slug="$(map "$base")"
  if [ -z "$slug" ]; then
    echo "SKIP (unmapped): $base"
    continue
  fi
  # Skip if Chrome is still writing it (a matching .crdownload exists)
  if compgen -G "$SRC"/*.crdownload > /dev/null 2>&1 && [ ! -s "$f" ]; then
    echo "WAIT (incomplete): $base"
    continue
  fi
  mv "$f" "$DEST/$slug.mp4"
  echo "OK $slug.mp4"
  moved=$((moved+1))
done

echo "---"
echo "moved this run: $moved"
echo "in workspace:   $(ls -1 "$DEST"/*.mp4 2>/dev/null | wc -l | tr -d ' ') / 11"
echo "still downloading: $(ls -1 "$SRC"/*.crdownload 2>/dev/null | wc -l | tr -d ' ')"
