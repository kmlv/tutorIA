#!/usr/bin/env python3
"""Escribe la API key en `.env` sin que pase por ningún sitio donde quede registrada.

    .venv/bin/python scripts/set-key.py

Por qué existe, en vez de "edita el archivo": las tres formas obvias de meter una key
fallan de maneras distintas y silenciosas. Un `echo KEY=... >> .env` la deja en
`~/.bash_history` para siempre. TextEdit puede guardar en RTF, y entonces el archivo se
ve bien en pantalla y es ilegible para cualquier lector de `.env`. Y un `>>` sobre un
`.env` que ya trae la línea vacía crea un duplicado, donde gana el primero — o sea, la
vacía.

Aquí la key se lee con eco apagado (no aparece en pantalla ni en el historial), se
sustituye la línea existente en vez de añadir otra, se conserva el resto del archivo, y
se deja en 600 para que sólo tú puedas leerlo. Lo único que se imprime es el largo y los
últimos cuatro caracteres.
"""
from __future__ import annotations

import getpass
import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
ENV = REPO_ROOT / ".env"
EXAMPLE = REPO_ROOT / ".env.example"

KNOWN = {
    "OPENAI_API_KEY": ("sk-",),
    "ANTHROPIC_API_KEY": ("sk-ant-",),
}


def main() -> int:
    name = sys.argv[1] if len(sys.argv) > 1 else "OPENAI_API_KEY"
    if name not in KNOWN:
        print(f"variable desconocida: {name}. Usa una de {', '.join(KNOWN)}")
        return 2

    if not ENV.is_file():
        if not EXAMPLE.is_file():
            print(f"no existe {ENV} ni {EXAMPLE}")
            return 2
        ENV.write_text(EXAMPLE.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"creado {ENV} a partir de .env.example")

    print(f"\nPega la {name} y pulsa Enter. NO se va a ver mientras escribes;")
    print("eso es normal, no es que no esté recibiendo el texto.\n")
    key = getpass.getpass(f"{name}: ").strip()

    if not key:
        print("\nno pegaste nada. Nada que hacer.")
        return 1
    if re.search(r"\s", key):
        # Copiar desde una página web arrastra saltos de línea y espacios con una
        # facilidad notable, y el error que devuelve la API después no menciona nada
        # de eso.
        print("\nla key trae espacios o saltos de línea: cópiala de nuevo, completa "
              "y sin nada alrededor.")
        return 1
    prefixes = KNOWN[name]
    if not key.startswith(prefixes):
        print(f"\naviso: esto no empieza por {' ni '.join(prefixes)}. "
              "Lo escribo igual, pero revisa que sea la key correcta.")

    lines = ENV.read_text(encoding="utf-8").splitlines()
    # Sustituir TODAS las apariciones y no sólo la primera: si ya hubo un `>>` previo,
    # dejar una línea vieja detrás significa que el lector puede tomar la equivocada,
    # y sería un fallo imposible de ver mirando el final del archivo.
    hits = [i for i, ln in enumerate(lines) if ln.strip().startswith(f"{name}=")]
    for i in hits:
        lines[i] = f"{name}={key}"
    if not hits:
        lines.append(f"{name}={key}")

    ENV.write_text("\n".join(lines) + "\n", encoding="utf-8")
    ENV.chmod(0o600)

    print(f"\nescrita en {ENV}")
    print(f"  {name} = {len(key)} chars, termina en …{key[-4:]}")
    print("  permisos 600 (sólo tú puedes leerlo)")
    print(f"  líneas sustituidas: {len(hits) or 1}")
    print("\nAhora comprueba que funciona:")
    print("  .venv/bin/python scripts/doctor.py --live\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
