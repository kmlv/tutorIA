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

    # ---- banco de preguntas -------------------------------------------------
    qfile = pack_dir / "questions.yaml"
    qs: list[dict] = []
    if qfile.exists():
        qs = yaml.safe_load(qfile.read_text(encoding="utf-8"))["questions"]
        qids = [q["id"] for q in qs]
        if len(qids) != len(set(qids)):
            errs.append("questions.yaml: ids duplicados")

        for q in qs:
            qid = q["id"]
            if q["subskill_primary"] not in skills:
                errs.append(f"{qid}: subskill_primary {q['subskill_primary']} no existe")
            for sid in q.get("subskills_secundarias", []):
                if sid not in skills:
                    errs.append(f"{qid}: subskill secundaria {sid} no existe")

            # todo misconception citado debe existir
            cited = set(q.get("misconceptions_vigilar", []))
            cited |= {v for v in (q.get("diagnostico_si_falla") or {}).values() if v}
            for o in q.get("opciones", []):
                if o.get("misconception"):
                    cited.add(o["misconception"])
            for mid in cited:
                if mid not in cat:
                    errs.append(f"{qid}: cita el misconception inexistente {mid}")

            # exactamente una opción correcta en las de opción múltiple
            if q["modalidad"] == "mcq":
                n = sum(1 for o in q["opciones"] if o.get("correcta"))
                if n != 1:
                    errs.append(f"{qid}: {n} opciones marcadas correctas, debe ser 1")
                for o in q["opciones"]:
                    if set(o) - {"es", "en", "correcta", "misconception"}:
                        errs.append(f"{qid}: opción con campos inesperados")

            # las abiertas necesitan key_points para el reference-guided grading
            if q["modalidad"] == "open" and not q.get("key_points"):
                errs.append(f"{qid}: abierta sin key_points")

            if q["modalidad"] == "open" and q.get("grader") != "llm":
                errs.append(f"{qid}: abierta debe tener grader llm")
            if q["modalidad"] != "open" and q.get("grader") != "deterministic":
                errs.append(f"{qid}: no-abierta debe tener grader deterministic")

        # cada sub-skill esencial necesita evidencia posible en >=2 modalidades
        # (criterio de dominio) y suficientes ítems deterministas
        for sid, s in skills.items():
            if not s.get("esencial"):
                continue
            mios = [q for q in qs if q["subskill_primary"] == sid]
            mods = {q["modalidad"] for q in mios}
            det = [q for q in mios if q.get("grader") == "deterministic"]
            if len(mods) < 2:
                errs.append(f"{sid}: solo {len(mods)} modalidad(es); el dominio exige >=2")
            if len(det) < 2:
                errs.append(f"{sid}: solo {len(det)} ítem(s) determinista(s); el juez LLM "
                            f"aporta como mucho 1 de 3 evidencias, hacen falta >=2")

        # los checkpoints del manifiesto deben existir en el banco
        for cp in pack.get("checkpoints", []):
            ref = cp.get("pregunta_ref")
            if ref and ref not in {q["id"] for q in qs}:
                errs.append(f"checkpoint {cp['id']}: pregunta_ref {ref} no está en el banco")
    else:
        warns.append("no hay questions.yaml todavía")

    print(f"pack: {pack['id']} v{pack['version']}")
    print(f"  sub-skills    : {len(skills)}")
    print(f"  misconceptions: {len(cat)}")
    if qs:
        det = sum(1 for q in qs if q.get("grader") == "deterministic")
        print(f"  preguntas     : {len(qs)} ({det} deterministas, {len(qs) - det} juez LLM)")
    for w in warns:
        print(f"  [warn]  {w}")
    for e in errs:
        print(f"  [ERROR] {e}")
    print(f"  {len(errs)} error(es), {len(warns)} aviso(s)")
    return 1 if errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
