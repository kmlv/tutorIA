"""Esquema tipado de un content pack.

El runtime consume SIEMPRE estos modelos y nunca sabe de dónde vinieron: hoy los
produce `FilesystemPackSource` leyendo `content/packs/<id>/`, mañana los producirá
`GeneratedPackSource` a partir de un LLM. Ese es el punto de extensión del PLAN §2.2,
y por eso los modelos viven aquí y no dentro del loader.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

Lang = Literal["es", "en"]
Modalidad = Literal["numeric", "mcq", "open", "manip"]
Grader = Literal["deterministic", "llm"]


class Localized(BaseModel):
    """Texto que debe existir en los dos idiomas. Sin `extra=forbid` a propósito:
    añadir un tercer idioma no debe romper el esquema."""

    es: str
    en: str


class Ejemplo(BaseModel):
    bien_1: Localized
    bien_2: Localized
    p1: float
    p2: float
    m: float

    @property
    def pendiente(self) -> float:
        return -self.p1 / self.p2

    @property
    def intercepto_x1(self) -> float:
        return self.m / self.p1

    @property
    def intercepto_x2(self) -> float:
        return self.m / self.p2


class SubSkill(BaseModel):
    id: str
    esencial: bool = True
    umbral: float = 0.80
    titulo: Localized
    misconceptions: list[str] = Field(default_factory=list)
    estado: str | None = None


class Checkpoint(BaseModel):
    id: str
    despues_de_cue: str
    pregunta_ref: str


class Dominio(BaseModel):
    """Criterio de dominio del PLAN §3.2, endurecido tras T-002."""

    p_mastery_min: float = 0.80
    aciertos_consecutivos: int = 3
    modalidades_min: int = 2
    sin_andamiaje_min: int = 1
    max_evidencias_del_juez_llm: int = 1
    sin_misconception_activa: bool = True

    @model_validator(mode="after")
    def _coherente(self) -> Dominio:
        if self.max_evidencias_del_juez_llm > self.aciertos_consecutivos:
            raise ValueError(
                "max_evidencias_del_juez_llm no puede superar aciertos_consecutivos"
            )
        if self.sin_andamiaje_min > self.aciertos_consecutivos:
            raise ValueError(
                "sin_andamiaje_min no puede superar aciertos_consecutivos"
            )
        return self


class Misconception(BaseModel):
    id: str
    nombre: Localized
    subskills: list[str]
    señal_observable: str
    socratic_probe: Localized
    representacion_alternativa: str
    caso_numerico: str
    distractor: Localized
    nota: str | None = None


class Opcion(BaseModel):
    es: str
    en: str
    correcta: bool = False
    misconception: str | None = None


class Question(BaseModel):
    id: str
    subskill_primary: str
    subskills_secundarias: list[str] = Field(default_factory=list)
    tier: int = 1
    modalidad: Modalidad
    grader: Grader
    andamiaje: bool = False
    checkpoint: str | None = None
    enunciado: Localized
    opciones: list[Opcion] | None = None
    respuesta: dict | None = None
    verificacion: dict | None = None
    key_points: list[dict] | None = None
    misconceptions_vigilar: list[str] = Field(default_factory=list)
    diagnostico_si_falla: dict | None = None

    @model_validator(mode="after")
    def _forma_por_modalidad(self) -> Question:
        if self.modalidad == "mcq":
            if not self.opciones:
                raise ValueError(f"{self.id}: mcq sin opciones")
            n = sum(1 for o in self.opciones if o.correcta)
            if n != 1:
                raise ValueError(f"{self.id}: {n} opciones correctas, debe ser exactamente 1")
        if self.modalidad == "numeric" and not self.respuesta:
            raise ValueError(f"{self.id}: numeric sin respuesta")
        if self.modalidad == "manip" and not self.verificacion:
            raise ValueError(f"{self.id}: manip sin verificacion")
        if self.modalidad == "open":
            if not self.key_points:
                raise ValueError(f"{self.id}: abierta sin key_points")
            if self.grader != "llm":
                raise ValueError(f"{self.id}: abierta debe usar grader llm")
        elif self.grader != "deterministic":
            raise ValueError(f"{self.id}: {self.modalidad} debe usar grader deterministic")
        return self


class Cue(BaseModel):
    id: str
    type: Literal["graph", "checkpoint"]
    t: float | None = None
    warning: str | None = None


class Timeline(BaseModel):
    pack: str
    lang: Lang
    audio: str
    duration_s: float
    sync_granularity: str
    cues: list[Cue]


class Pack(BaseModel):
    """Lo que consume el runtime. Un `Pack` completo y validado."""

    id: str
    version: str
    titulo: Localized
    lang: list[Lang]
    media_variant_default: str = "A"
    ejemplo: Ejemplo
    checkpoints: list[Checkpoint]
    sub_skills: list[SubSkill]
    dominio: Dominio
    misconceptions: list[Misconception] = Field(default_factory=list)
    questions: list[Question] = Field(default_factory=list)
    timelines: dict[str, Timeline] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _integridad_referencial(self) -> Pack:
        skill_ids = {s.id for s in self.sub_skills}
        misc_ids = {m.id for m in self.misconceptions}
        q_ids = {q.id for q in self.questions}
        errs: list[str] = []

        for s in self.sub_skills:
            for mid in s.misconceptions:
                if mid not in misc_ids:
                    errs.append(f"sub-skill {s.id} apunta al misconception inexistente {mid}")
        for m in self.misconceptions:
            for sid in m.subskills:
                if sid not in skill_ids:
                    errs.append(f"misconception {m.id} apunta a la sub-skill inexistente {sid}")
        for q in self.questions:
            if q.subskill_primary not in skill_ids:
                errs.append(f"pregunta {q.id}: sub-skill {q.subskill_primary} no existe")
            citados = set(q.misconceptions_vigilar)
            citados |= {v for v in (q.diagnostico_si_falla or {}).values() if v}
            citados |= {o.misconception for o in (q.opciones or []) if o.misconception}
            for mid in citados:
                if mid not in misc_ids:
                    errs.append(f"pregunta {q.id} cita el misconception inexistente {mid}")
        for cp in self.checkpoints:
            if cp.pregunta_ref not in q_ids:
                errs.append(f"checkpoint {cp.id}: pregunta_ref {cp.pregunta_ref} no está en el banco")

        # el criterio de dominio debe ser alcanzable con el banco que hay
        for s in self.sub_skills:
            if not s.esencial:
                continue
            mias = [q for q in self.questions if q.subskill_primary == s.id]
            mods = {q.modalidad for q in mias}
            det = [q for q in mias if q.grader == "deterministic"]
            if mods and len(mods) < self.dominio.modalidades_min:
                errs.append(
                    f"sub-skill {s.id}: {len(mods)} modalidad(es) en el banco, "
                    f"el dominio exige {self.dominio.modalidades_min}"
                )
            necesarias = self.dominio.aciertos_consecutivos - self.dominio.max_evidencias_del_juez_llm
            if mias and len(det) < necesarias:
                errs.append(
                    f"sub-skill {s.id}: {len(det)} ítem(s) determinista(s), hacen falta "
                    f"{necesarias} porque el juez LLM aporta como mucho "
                    f"{self.dominio.max_evidencias_del_juez_llm}"
                )

        if errs:
            raise ValueError("pack incoherente:\n  - " + "\n  - ".join(errs))
        return self

    def sub_skill(self, sid: str) -> SubSkill:
        return next(s for s in self.sub_skills if s.id == sid)

    def misconception(self, mid: str) -> Misconception:
        return next(m for m in self.misconceptions if m.id == mid)

    @property
    def enum_misconceptions(self) -> list[str]:
        """El enum que ve el juez. Incluye los dos valores de escape.

        Sin ellos el juez está obligado a emitir uno de los ids del catálogo aunque el
        alumno no cometa ningún error, y el gate "cero ids fuera de catálogo" se pasa
        por construcción. Hallazgo del carril C de T-002.
        """
        return [m.id for m in self.misconceptions] + ["NINGUNA", "FUERA_DE_CATALOGO"]
