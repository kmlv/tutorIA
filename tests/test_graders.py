"""Los graders deterministas no solo corrigen: diagnostican.

Es lo que sostiene la contingencia del PLAN R1 — si el juez LLM no pasa el gate de
concordancia, el diagnóstico se apoya solo en esto.
"""
from __future__ import annotations

import pytest

from app.server.core.content.loader import FilesystemPackSource
from app.server.core.judge.deterministic import eval_expr, grade


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack("budget-line")


def q(pack, qid: str):
    return next(x for x in pack.questions if x.id == qid)


# ---- evaluador de expresiones ---------------------------------------------

def test_eval_expr_resuelve_las_del_banco() -> None:
    p = {"p1": 3.0, "p2": 1.0, "m": 100.0}
    assert eval_expr("m / p2", p) == 100
    assert eval_expr("-p1 / p2", p) == -3
    assert eval_expr("(m - p1*12) / p2", p) == 64


def test_eval_expr_rechaza_codigo_arbitrario() -> None:
    """Estas expresiones vienen de archivos de contenido que algún día podría emitir un
    LLM. No pueden ser código."""
    for malo in ["__import__('os').system('ls')", "open('/etc/passwd')", "m.__class__"]:
        with pytest.raises(ValueError):
            eval_expr(malo, {"m": 1.0})


# ---- numéricas --------------------------------------------------------------

def test_numerica_correcta(pack) -> None:
    v = grade(q(pack, "q_int_numeric_1"), "100", pack.ejemplo)
    assert v.correcta and v.score == 1.0


def test_numerica_acepta_coma_decimal(pack) -> None:
    """Un estudiante hispanohablante escribe 33,3 y eso no es un error conceptual."""
    v = grade(q(pack, "q_int_numeric_2"), "33,3", pack.ejemplo)
    assert v.correcta


def test_numerica_diagnostica_el_intercepto_cambiado(pack) -> None:
    """Responder 33.3 donde va 100 no es 'incorrecto y ya': es BL-M6."""
    v = grade(q(pack, "q_int_numeric_1"), "33.33", pack.ejemplo)
    assert not v.correcta and v.misconception_id == "BL-M6"


def test_pendiente_invertida_es_BL_M1(pack) -> None:
    v = grade(q(pack, "q_slope_numeric"), "-0.333", pack.ejemplo)
    assert v.misconception_id == "BL-M1"


def test_pendiente_sin_signo_es_BL_M5(pack) -> None:
    v = grade(q(pack, "q_slope_numeric"), "3", pack.ejemplo)
    assert v.misconception_id == "BL-M5"


def test_numerica_no_numerica_no_revienta(pack) -> None:
    v = grade(q(pack, "q_slope_numeric"), "no sé", pack.ejemplo)
    assert not v.correcta and v.misconception_id is None


# ---- opción múltiple --------------------------------------------------------

def test_mcq_correcta_y_distractor_diagnostico(pack) -> None:
    qq = q(pack, "q_slope_mcq")
    correcto = next(i for i, o in enumerate(qq.opciones) if o.correcta)
    assert grade(qq, correcto, pack.ejemplo).correcta

    invertida = next(i for i, o in enumerate(qq.opciones) if o.misconception == "BL-M1")
    v = grade(qq, invertida, pack.ejemplo)
    assert not v.correcta and v.misconception_id == "BL-M1"


def test_mcq_indice_invalido(pack) -> None:
    assert not grade(q(pack, "q_slope_mcq"), 99, pack.ejemplo).correcta


# ---- manipulación del gráfico ----------------------------------------------

def test_manip_region_interior_es_correcta(pack) -> None:
    v = grade(q(pack, "q_feas_manip"), {"x1": 10, "x2": 20}, pack.ejemplo)
    assert v.correcta  # gasta 50 de 100


def test_manip_sobre_la_recta_es_BL_M4(pack) -> None:
    """Quedarse sobre la recta cuando se pedía el interior delata que confunde la
    línea con el conjunto."""
    v = grade(q(pack, "q_feas_manip"), {"x1": 20, "x2": 40}, pack.ejemplo)
    assert not v.correcta and v.misconception_id == "BL-M4"


def test_manip_ingreso_correcto(pack) -> None:
    v = grade(q(pack, "q_cs_m_manip"), {"p1": 3, "p2": 1, "m": 150}, pack.ejemplo)
    assert v.correcta


def test_manip_giro_cuando_debia_desplazar_es_BL_M2(pack) -> None:
    """El diagnóstico es DIRECCIONAL: distingue rotar de desplazar."""
    v = grade(q(pack, "q_cs_m_manip"), {"p1": 1.5, "p2": 1, "m": 150}, pack.ejemplo)
    assert not v.correcta and v.misconception_id == "BL-M2"
    assert "rotated" in v.detalle["why"]


def test_manip_precio_correcto(pack) -> None:
    v = grade(q(pack, "q_cs_p_manip"), {"p1": 4, "p2": 1, "m": 100}, pack.ejemplo)
    assert v.correcta


def test_manip_desplazo_cuando_debia_girar_es_BL_M3(pack) -> None:
    """Mover el intercepto que no cambia es exactamente BL-M3."""
    v = grade(q(pack, "q_cs_p_manip"), {"p1": 3, "p2": 1, "m": 75}, pack.ejemplo)
    assert not v.correcta and v.misconception_id == "BL-M3"


def test_abierta_no_pasa_por_grader_determinista(pack) -> None:
    with pytest.raises(ValueError, match="not deterministic"):
        grade(q(pack, "q_slope_open"), "lo que sea", pack.ejemplo)


# ---------------------------------------------------------------------------
# Adversarial cases from codex's T-005 review. The original suite only proved happy
# paths, so every one of these used to pass wrongly or raise a 500.
# ---------------------------------------------------------------------------

from app.server.core.judge.deterministic import ExpressionError  # noqa: E402


def test_manip_rejects_missing_keys(pack) -> None:
    """`{}` used to grade as CORRECT: x1/x2 defaulted to zero, which spends nothing."""
    v = grade(q(pack, "q_feas_manip"), {}, pack.ejemplo)
    assert v.invalida and not v.correcta


def test_manip_rejects_negative_quantities(pack) -> None:
    v = grade(q(pack, "q_feas_manip"), {"x1": -100, "x2": 0}, pack.ejemplo)
    assert v.invalida and not v.correcta


def test_manip_rejects_zero_price(pack) -> None:
    """`p2: 0` used to raise ZeroDivisionError and surface as a 500 to the student."""
    v = grade(q(pack, "q_cs_m_manip"), {"p1": 3, "p2": 0, "m": 100}, pack.ejemplo)
    assert v.invalida and not v.correcta


def test_manip_rejects_non_dict(pack) -> None:
    assert grade(q(pack, "q_cs_m_manip"), "nope", pack.ejemplo).invalida


def test_manip_arbitrary_wrong_line_claims_no_misconception(pack) -> None:
    """An arbitrary wrong line used to be labelled BL-M3 just because both fields were
    off. Naming a confusion the student did not show poisons the diagnosis."""
    v = grade(q(pack, "q_cs_p_manip"), {"p1": 1, "p2": 1, "m": 1000}, pack.ejemplo)
    assert not v.correcta and v.misconception_id is None


def test_manip_rotation_with_imperfect_intercept_is_still_BL_M2(pack) -> None:
    """Asked to shift, the student rotated. Both fields are off, but the signature is
    unambiguous: the slope changed on a shift task. Used to return no id."""
    v = grade(q(pack, "q_cs_m_manip"), {"p1": 1.5, "p2": 1, "m": 100}, pack.ejemplo)
    assert v.misconception_id == "BL-M2"


def test_manip_unchanged_line_on_pivot_task_gets_no_false_reason(pack) -> None:
    """Submitting the original line on the price item used to come back with the reason
    'rotated when it should have shifted' — which is false twice over."""
    v = grade(q(pack, "q_cs_p_manip"), {"p1": 3, "p2": 1, "m": 100}, pack.ejemplo)
    assert not v.correcta
    assert "rotated" not in v.detalle.get("why", "")


def test_eval_expr_rejects_huge_exponent_and_division_by_zero() -> None:
    for bad in ["2 ** 1000000000", "1 / 0", "m / (p1 - p1)"]:
        with pytest.raises(ExpressionError):
            eval_expr(bad, {"m": 1.0, "p1": 3.0})


def test_eval_expr_rejects_bool_and_syntax_errors() -> None:
    with pytest.raises(ExpressionError):
        eval_expr("True", {})
    with pytest.raises(ExpressionError):
        eval_expr("m +", {"m": 1.0})


def test_eval_expr_rejects_oversized_input() -> None:
    with pytest.raises(ExpressionError):
        eval_expr("m + " * 200 + "m", {"m": 1.0})


def test_numeric_rejects_bad_input_as_invalid(pack) -> None:
    v = grade(q(pack, "q_slope_numeric"), None, pack.ejemplo)
    assert v.invalida


def test_mcq_rejects_bool_index(pack) -> None:
    """`True` is an int subclass, so it used to select option 1."""
    assert grade(q(pack, "q_slope_mcq"), True, pack.ejemplo).invalida


def test_unreachable_mastery_is_rejected_at_load() -> None:
    """The validator must reject a bank that cannot deliver the mastery it promises."""
    from app.server.core.content.schema import Pack
    base = FilesystemPackSource().get_pack("budget-line").model_dump()
    base["questions"] = [q for q in base["questions"]
                         if q["subskill_primary"] != "BL.EQ"][:]
    with pytest.raises(ValueError, match="BL.EQ"):
        Pack.model_validate(base)
