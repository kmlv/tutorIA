"""Carga de content packs.

`PackSource` es el punto de extensión del PLAN §2.2. Hoy solo existe
`FilesystemPackSource`; el día que haya generación al vuelo se añade
`GeneratedPackSource` con la misma firma y **el runtime no cambia**.
"""
from __future__ import annotations

import pathlib
from typing import Protocol

import yaml

from .schema import Pack, Timeline

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
PACKS_DIR = REPO_ROOT / "content" / "packs"


class StudentProfile(Protocol):
    """Lo que la generación futura necesitará para personalizar. Hoy nadie lo usa."""

    id: str
    lang: str


class PackSource(Protocol):
    def get_pack(self, concept_id: str, lang: str,
                 student: StudentProfile | None = None) -> Pack: ...


class FilesystemPackSource:
    """Lee `content/packs/<id>/`. Es la fuente de HOY."""

    def __init__(self, root: pathlib.Path | None = None) -> None:
        self.root = root or PACKS_DIR

    def available(self) -> list[str]:
        if not self.root.is_dir():
            return []
        return sorted(p.name for p in self.root.iterdir()
                      if (p / "pack.yaml").exists())

    def get_pack(self, concept_id: str, lang: str = "es",
                 student: StudentProfile | None = None) -> Pack:
        d = self.root / concept_id
        if not (d / "pack.yaml").exists():
            raise FileNotFoundError(f"no existe el pack {concept_id} en {self.root}")

        data = _yaml(d / "pack.yaml")

        misc_file = d / "misconceptions.yaml"
        data["misconceptions"] = _yaml(misc_file).get("misconceptions", []) if misc_file.exists() else []

        q_file = d / "questions.yaml"
        data["questions"] = _yaml(q_file).get("questions", []) if q_file.exists() else []

        # las timelines son opcionales: el pack es válido antes de compilar el audio
        timelines: dict[str, Timeline] = {}
        media = d / "media"
        if media.is_dir():
            for tl in sorted(media.glob("timeline.*.json")):
                import json
                t = Timeline.model_validate(json.loads(tl.read_text(encoding="utf-8")))
                timelines[t.lang] = t
        data["timelines"] = timelines

        # `salidas` e `iesa_micro` son metadatos de autoría, no los consume el runtime
        for k in ("salidas", "iesa_micro"):
            data.pop(k, None)

        pack = Pack.model_validate(data)
        _fill_templates(pack)
        return pack


def _yaml(path: pathlib.Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def _fill_templates(pack: Pack) -> None:
    """Substitutes {{p1}}, {{p2}}, {{m}}, {{slope}}, {{slope_abs}} in question text.

    The templates live in the YAML on purpose: changing the numbers in `pack.yaml`
    must regenerate every wording without editing `questions.yaml`. That is exactly the
    property criterion 2 of the bake-off measures — how cheap it is to personalise.
    """
    e = pack.ejemplo
    subs = {
        "p1": _fmt(e.p1), "p2": _fmt(e.p2), "m": _fmt(e.m),
        "slope": _fmt(e.pendiente), "slope_abs": _fmt(abs(e.pendiente)),
        "intercept_x1": _fmt(e.intercepto_x1), "intercept_x2": _fmt(e.intercepto_x2),
    }

    def apply(s: str) -> str:
        for k, v in subs.items():
            s = s.replace("{{" + k + "}}", v)
        return s

    for q in pack.questions:
        q.enunciado.es = apply(q.enunciado.es)
        q.enunciado.en = apply(q.enunciado.en)
        for kp in q.key_points or []:
            for lang in ("es", "en"):
                if isinstance(kp.get(lang), str):
                    kp[lang] = apply(kp[lang])


def _fmt(v: float) -> str:
    """Renders 3.0 as "3" and 33.333… as "33.3": a trailing .0 in a question stem reads
    like a typo to a student."""
    return str(int(v)) if float(v).is_integer() else f"{v:.1f}"
