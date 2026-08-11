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
        if not 0.0 <= self.p_mastery_min <= 1.0:
            raise ValueError("p_mastery_min must be in [0, 1]")
        for name in ("aciertos_consecutivos", "modalidades_min"):
            if getattr(self, name) < 1:
                raise ValueError(f"{name} must be >= 1")
        for name in ("sin_andamiaje_min", "max_evidencias_del_juez_llm"):
            if getattr(self, name) < 0:
                raise ValueError(f"{name} must be >= 0")
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
    #: One declarative sentence shown BEFORE the student answers, in the nudged arm of
    #: D-1. Optional: an item whose confusions have no nudge simply is not pushable.
    #: It cannot be `socratic_probe` reused — that one is a question written for AFTER a
    #: specific wrong answer, and asking it first hands the student an interrogation with
    #: nowhere to reply, under a lead-in that promised a hint.
    nudge: Localized | None = None
    representacion_alternativa: str
    caso_numerico: str
    distractor: Localized
    nota: str | None = None


class Opcion(BaseModel):
    es: str
    en: str
    correcta: bool = False
    misconception: str | None = None


class KeyPoint(BaseModel):
    """One line of the rubric the LLM judge grades an open answer against.

    Typed rather than a bare dict because it IS the rubric: the judge reports presence
    per key point and the score is computed from that here, not taken from the model's
    own opinion of whether the answer was right.

    `esencial` is what separates "must say this or the answer is wrong" from "nice to
    have". Without it every listed point is load-bearing, which makes a two-point
    rubric an all-or-nothing gate whether the author meant that or not.
    """

    id: str
    es: str
    en: str
    esencial: bool = True


class Question(BaseModel):
    id: str
    subskill_primary: str
    subskills_secundarias: list[str] = Field(default_factory=list)
    tier: int = 1
    modalidad: Modalidad
    grader: Grader
    andamiaje: bool = False
    checkpoint: str | None = None
    prediction: bool = False
    enunciado: Localized
    opciones: list[Opcion] | None = None
    respuesta: dict | None = None
    verificacion: dict | None = None
    key_points: list[KeyPoint] | None = None
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
            ids = [k.id for k in self.key_points]
            if len(set(ids)) != len(ids):
                # The judge's output schema keys presence by key-point id. Duplicates
                # would make one verdict silently overwrite another.
                raise ValueError(f"{self.id}: key_points con id repetido: {ids}")
            if not any(k.esencial for k in self.key_points):
                raise ValueError(
                    f"{self.id}: ningún key_point es esencial, así que ninguna respuesta "
                    "podría ser incorrecta"
                )
        elif self.grader != "deterministic":
            raise ValueError(f"{self.id}: {self.modalidad} debe usar grader deterministic")
        return self


class Cue(BaseModel):
    id: str
    type: Literal["graph", "checkpoint", "prediction"]
    t: float | None = None
    warning: str | None = None


class TranscriptSegment(BaseModel):
    """One spoken sentence with its timing. Feeds the caption band (codex, T-011)."""

    text: str
    start_s: float
    end_s: float
    part_index: int = 0


class Timeline(BaseModel):
    """Lo que el cliente necesita para reproducir una lección.

    `variant` y `video` existen por M4. El bake-off promete que cada tecnología puede
    traer SU PROPIO ritmo y su propia estructura de escena — y eso era inalcanzable
    mientras las timelines se guardaran por idioma y nada más, porque las cuatro opciones
    compartían obligatoriamente la del camino HTML. Con esto, `timeline.es.B.json` puede
    tener cues distintos y duración distinta de `timeline.es.json`.

    `video` es opcional en vez de sobrecargar `audio` con un `.mp4`. Sobrecargarlo habría
    sido más corto y habría hecho que un cliente viejo intentara meter un MP4 en un
    `<audio>`, que falla en silencio: el elemento carga, no muestra nada, y el reloj
    corre igual.
    """

    pack: str
    lang: Lang
    audio: str
    duration_s: float
    sync_granularity: str
    cues: list[Cue]
    transcript: list[TranscriptSegment] = Field(default_factory=list)
    #: Qué opción del bake-off produjo esta timeline. "A" es el camino DOM/SVG.
    variant: str = "A"
    #: Nombre del MP4 en `media/`, cuando la opción es de vídeo pre-renderizado.
    video: str | None = None
    #: Huella de la timeline A de la que se derivó esta. Solo en variantes != A.
    #:
    #: `pipeline/cues.py` reescribe únicamente `timeline.<lang>.json`. Sin esta huella,
    #: recompilar el guion dejaba la timeline de B intacta, apuntando a un MP4 renderizado
    #: con los tiempos VIEJOS: la app dispararía los cues nuevos sobre una imagen que
    #: cuenta otra cosa, sin excepción y sin aviso. La compuerta `pipeline/check_cues.py`
    #: la compara.
    derivada_de: str | None = None


class Pack(BaseModel):
    """Lo que consume el runtime. Un `Pack` completo y validado."""

    id: str
    version: str
    titulo: Localized
    lang: list[Lang]
    media_variant_default: str = "A"
    ejemplo: Ejemplo
    checkpoints: list[Checkpoint]
    predictions: dict[str, str] = Field(default_factory=dict)
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
        for pid, qid in self.predictions.items():
            if qid not in q_ids:
                errs.append(f"prediction {pid}: question {qid} is not in the bank")
            elif not next(q for q in self.questions if q.id == qid).prediction:
                errs.append(f"prediction {pid}: {qid} is not marked `prediction: true`")

        # Mastery must be REACHABLE with the bank that exists. codex T-005 showed the
        # previous version was only a partial lower bound: it skipped skills with zero
        # questions, checked modality and determinism independently instead of as one
        # selectable set, and ignored `sin_andamiaje_min` entirely.
        d = self.dominio
        for s in self.sub_skills:
            if not s.esencial:
                continue
            mias = [q for q in self.questions if q.subskill_primary == s.id]
            if len(mias) < d.aciertos_consecutivos:
                errs.append(
                    f"sub-skill {s.id}: {len(mias)} question(s) in the bank, mastery needs "
                    f"{d.aciertos_consecutivos} consecutive correct answers"
                )
                continue
            det = [q for q in mias if q.grader == "deterministic"]
            if len(det) < d.aciertos_consecutivos - d.max_evidencias_del_juez_llm:
                errs.append(
                    f"sub-skill {s.id}: {len(det)} deterministic item(s); the LLM judge "
                    f"supplies at most {d.max_evidencias_del_juez_llm} of "
                    f"{d.aciertos_consecutivos}"
                )
            if not _reachable(mias, d):
                errs.append(
                    f"sub-skill {s.id}: no set of {d.aciertos_consecutivos} items satisfies "
                    f"modalities>={d.modalidades_min}, llm<={d.max_evidencias_del_juez_llm} "
                    f"and unscaffolded>={d.sin_andamiaje_min} at the same time"
                )

        if errs:
            raise ValueError("pack incoherente:\n  - " + "\n  - ".join(errs))
        return self

    def timeline(self, lang: str, variant: str = "A") -> Timeline | None:
        """La timeline de esa variante, con fallback a A.

        El fallback no es cortesía: sin él, pedir `?variant=B` antes de que exista la
        timeline de B devolvería `None` y la app diría "este pack no tiene media
        compilada", que es un mensaje sobre el pack y no sobre lo que pasó.
        """
        return (self.timelines.get(f"{lang}/{variant}")
                or self.timelines.get(f"{lang}/A"))

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


def _reachable(items: list[Question], d: Dominio) -> bool:
    """Is there a set of `aciertos_consecutivos` items meeting ALL constraints at once?

    Checking the constraints independently is not enough: a bank can have plenty of
    modalities and plenty of deterministic items and still have no single selection that
    satisfies modalities, the LLM cap and the unscaffolded minimum together.
    """
    from itertools import combinations

    n = d.aciertos_consecutivos
    if len(items) < n:
        return False
    for combo in combinations(items, n):
        if len({q.modalidad for q in combo}) < d.modalidades_min:
            continue
        if sum(1 for q in combo if q.grader == "llm") > d.max_evidencias_del_juez_llm:
            continue
        if sum(1 for q in combo if not q.andamiaje) < d.sin_andamiaje_min:
            continue
        return True
    return False
