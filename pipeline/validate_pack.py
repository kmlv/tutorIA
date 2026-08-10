#!/usr/bin/env python3
"""Valida un content pack: esquema, integridad referencial y cobertura.

Existe porque en M1 se comiteo un pack.yaml con YAML invalido: una clave suelta
dentro de una lista. Se valida ANTES de comitear, no despues.

Uso:  validate_pack.py content/packs/<pack>
"""
from __future__ import annotations

import pathlib
import sys

import yaml

REQ_MISCONCEPTION = {
    "id", "nombre", "subskills", "señal_observable", "socratic_probe",
    "representacion_alternativa", "caso_numerico", "distractor",
}


def main() -> int:
    pack_dir = pathlib.Path(sys.argv[1])
    errs: list[str] = []
    warns: list[str] = []

    try:
        pack = yaml.safe_load((pack_dir / "pack.yaml").read_text(encoding="utf-8"))
        misc = yaml.safe_load((pack_dir / "misconceptions.yaml").read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        print(f"YAML invalido: {e}")
        return 1

    skills = {s["id"]: s for s in pack["sub_skills"]}
    cat = {m["id"]: m for m in misc["misconceptions"]}

    # esquema de cada misconception
    for mid, m in cat.items():
        falta = REQ_MISCONCEPTION - set(m)
        if falta:
            errs.append(f"{mid}: faltan campos {sorted(falta)}")
        for lang_field in ("nombre", "socratic_probe", "distractor"):
            v = m.get(lang_field)
            if isinstance(v, dict) and set(v) != {"es", "en"}:
                errs.append(f"{mid}.{lang_field}: debe tener es y en, tiene {sorted(v)}")

    # integridad referencial en las dos direcciones
    referenciadas: set[str] = set()
    for sid, s in skills.items():
        for mid in s.get("misconceptions", []):
            referenciadas.add(mid)
            if mid not in cat:
                errs.append(f"{sid} apunta a {mid}, que no existe en el catalogo")
    for mid, m in cat.items():
        for sid in m["subskills"]:
            if sid not in skills:
                errs.append(f"{mid} apunta a la sub-skill inexistente {sid}")

    huerfanas = set(cat) - referenciadas
    if huerfanas:
        warns.append(f"misconceptions no referenciadas por ninguna sub-skill: {sorted(huerfanas)}")

    sin_misc = [sid for sid, s in skills.items() if not s.get("misconceptions")]
    for sid in sin_misc:
        estado = skills[sid].get("estado")
        if estado == "revisar_en_validacion":
            warns.append(f"{sid}: sin misconception, marcada revisar_en_validacion (esperado)")
        else:
            errs.append(f"{sid}: sin misconception y sin marcar para revision")

    # los checkpoints deben apuntar a cues que existan en el guion
    for lang in pack.get("lang", []):
        script = pack_dir / f"script.{lang}.md"
        if not script.exists():
            errs.append(f"falta {script.name}")
            continue
        txt = script.read_text(encoding="utf-8")
        for cp in pack.get("checkpoints", []):
            if f"cue:checkpoint:{cp['id']}" not in txt:
                errs.append(f"{script.name}: falta la marca del checkpoint {cp['id']}")
            if f"cue:{cp['despues_de_cue']}" not in txt:
                errs.append(f"{script.name}: falta el cue {cp['despues_de_cue']}")

    # el criterio de dominio no debe pedir mas evidencia del juez de la que permite
    dom = pack.get("dominio", {})
    if dom.get("max_evidencias_del_juez_llm", 0) > dom.get("aciertos_consecutivos", 0):
        errs.append("dominio: max_evidencias_del_juez_llm supera aciertos_consecutivos")
    if dom.get("sin_andamiaje_min", 0) > dom.get("aciertos_consecutivos", 0):
        errs.append("dominio: sin_andamiaje_min supera aciertos_consecutivos")

    print(f"pack: {pack['id']} v{pack['version']}")
    print(f"  sub-skills    : {len(skills)}")
    print(f"  misconceptions: {len(cat)}")
    for w in warns:
        print(f"  [warn]  {w}")
    for e in errs:
        print(f"  [ERROR] {e}")
    print(f"  {len(errs)} error(es), {len(warns)} aviso(s)")
    return 1 if errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
