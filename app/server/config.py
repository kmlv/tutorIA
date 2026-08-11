"""Server-side configuration.

`.env` is read here and nowhere else. It is in `.gitignore`, it is never logged, and no
value read from it is ever put into an HTTP response — the API key stays behind this
process (decision 20).

Environment variables already set win over the file. That ordering is what lets a
deployment inject a key without a file, and lets a shell override a stale local one.
"""
from __future__ import annotations

import os
import pathlib

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

#: Names that must never be echoed back, whatever the caller asks for.
SECRET_HINTS = ("key", "token", "secret", "password")


def load_dotenv(path: pathlib.Path | None = None) -> list[str]:
    """Loads `KEY=value` lines. Returns the NAMES it set — never the values."""
    p = path or (REPO_ROOT / ".env")
    if not p.is_file():
        return []
    loaded: list[str] = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip()
        if v[:1] in ("'", '"') and v[-1:] == v[:1] and len(v) > 1:
            v = v[1:-1]
        if k and k not in os.environ:
            os.environ[k] = v
            loaded.append(k)
    return loaded


def is_secret(name: str) -> bool:
    low = name.lower()
    return any(h in low for h in SECRET_HINTS)
