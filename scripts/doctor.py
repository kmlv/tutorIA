#!/usr/bin/env python3
"""Checks the LLM setup without ever printing a credential.

    .venv/bin/python scripts/doctor.py          # config only, no network, free
    .venv/bin/python scripts/doctor.py --live   # one real call, a fraction of a cent

The key is reported as a length and its last four characters. That is enough to tell a
key apart from a placeholder, a truncated paste, or a stale one — and not enough to be
worth anything to whoever ends up reading your terminal, your screen recording, or the
transcript of a chat.
"""
from __future__ import annotations

import argparse
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.server.config import REPO_ROOT, load_dotenv  # noqa: E402
from app.server.core.judge import shadow  # noqa: E402
from app.server.core.llm import FakeProvider, Router, default_provider  # noqa: E402
from app.server.core.llm.provider import LLMError, LLMRequest  # noqa: E402

OK, BAD, MEH = "  ok  ", " FALLA", " aviso"


def redact(v: str) -> str:
    return f"{len(v)} chars, termina en …{v[-4:]}" if len(v) >= 8 else "demasiado corta"


def _env_lines(path: pathlib.Path) -> dict[str, str]:
    """Lee el .env crudo, SIN tocar el entorno. Sirve para distinguir «la línea no
    está» de «la línea está y está vacía», que es la diferencia que dice qué hacer."""
    if not path.is_file():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip().strip("'\"")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true",
                    help="hace UNA llamada real para comprobar que la key funciona")
    args = ap.parse_args()

    env_file = REPO_ROOT / ".env"
    loaded = load_dotenv()
    problems = 0

    print(f"\n.env              {OK if env_file.is_file() else MEH}  {env_file}")
    if not env_file.is_file():
        print("                        no existe. `cp .env.example .env` y edítalo.")
        problems += 1
    else:
        # TextEdit guarda en RTF si el documento está en modo texto enriquecido, y el
        # archivo resultante *parece* correcto en la ventana y es ilegible para
        # cualquier lector de .env. Es el modo de fallo más probable de "lo pegué y no
        # funcionó", así que se detecta explícitamente en vez de aparecer como una
        # variable misteriosamente vacía.
        head = env_file.read_bytes()[:6]
        if head.startswith(b"{\\rtf"):
            print(f"                {BAD}  está guardado en RTF, no en texto plano.")
            print("                        En TextEdit: Formato > Convertir en texto normal,")
            print("                        vuelve a guardar. O usa `nano .env`.")
            problems += 1
        if loaded:
            print(f"                        variables leídas: {', '.join(loaded)}")

    # Diagnóstico por línea. `load_dotenv` no distingue "la línea no está" de "la línea
    # está vacía", y esa diferencia es justo la que dice qué hacer a continuación.
    lines = _env_lines(env_file)

    found = None
    for name in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY"):
        v = os.environ.get(name, "")
        if v:
            found = name
            print(f"{name:<17} {OK}  {redact(v)}")
            break
        if name in lines and not lines[name]:
            print(f"{name:<17} {BAD}  la línea existe en .env pero está VACÍA: "
                  "no llegaste a pegar la key, o no se guardó el archivo")
        elif name in lines:
            # .env tiene valor pero el entorno gana, y el entorno la tiene vacía. Un
            # `export FOO=` olvidado en el shell produce exactamente esto y es
            # invisible mirando el archivo, que es donde uno mira.
            print(f"{name:<17} {BAD}  .env trae un valor, pero tu shell ya define "
                  f"{name} como vacía y el shell manda. Corre: unset {name}")
        else:
            print(f"{name:<17} {MEH}  sin definir")
    if not found:
        problems += 1

    prov = default_provider()
    is_fake = isinstance(prov, FakeProvider)
    print(f"proveedor         {MEH if is_fake else OK}  {prov.name}"
          + ("  (sin key: el juez no juzga, la lección sigue funcionando)" if is_fake else ""))

    router = Router()
    print(f"config            {OK}  {router.path.name} v{router.version}")
    for role in router.roles():
        s = router.spec(role)
        print(f"  {role:<12}          {s.model:<16} effort={s.effort:<7} "
              f"${s.usd_in_per_mtok}/${s.usd_out_per_mtok} por MTok")

    mode = shadow.judge_mode()
    raw = os.environ.get("JUDGE_MODE", "shadow")
    print(f"modo del juez     {OK}  {mode}"
          + ("  (pediste 'live' pero falta JUDGE_GATE_PASSED=1)"
             if raw == "live" and mode != "live" else ""))

    if args.live:
        if is_fake:
            print(f"llamada real      {BAD}  no hay proveedor real que probar")
            problems += 1
        else:
            spec = router.spec("chat")  # el rol más barato: esto es un ping, no un juicio
            try:
                r = prov.complete(spec, LLMRequest(
                    system="Answer with exactly one word.", user="Say: ok"))
                print(f"llamada real      {OK}  {r.model}  {r.latency_ms} ms  "
                      f"${r.cost_usd:.6f}  -> {r.text.strip()[:40]!r}")
            except LLMError as e:
                print(f"llamada real      {BAD}  {e}")
                problems += 1

    print(f"\n{'todo listo' if not problems else f'{problems} cosa(s) por arreglar'}\n")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
