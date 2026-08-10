#!/usr/bin/env bash
# audio-gc.sh — borra los MP3 de explainer con mas de 2 dias.
#
# Politica (pedida por Kristian): el audio es efimero, el transcript .md es permanente.
# Los .md viven en docs/audio/ y NUNCA se tocan aqui.
#
# Alcance deliberadamente estrecho: solo archivos regulares, solo dentro de .audio/,
# sin recursion, y solo las extensiones que produce audioexplain.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIO_DIR="$REPO/.audio"
TTL_DAYS=2

[ -d "$AUDIO_DIR" ] || { echo "audio-gc: no existe $AUDIO_DIR; nada que hacer."; exit 0; }

DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

found=0
while IFS= read -r -d '' f; do
  found=$((found + 1))
  if [ "$DRY" -eq 1 ]; then
    echo "[dry-run] borraria: ${f#"$REPO"/}"
  else
    rm -f -- "$f"
    echo "borrado: ${f#"$REPO"/}"
  fi
done < <(find "$AUDIO_DIR" -maxdepth 1 -type f \
           \( -name '*.mp3' -o -name '*.json' -o -name '*.html' \) \
           -mtime "+$TTL_DAYS" -print0)

if [ "$found" -eq 0 ]; then
  echo "audio-gc: nada con mas de $TTL_DAYS dias."
else
  echo "audio-gc: $found archivo(s) con mas de $TTL_DAYS dias."
fi
