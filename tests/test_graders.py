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
    assert "giró" in v.detalle["por_que"]


def test_manip_precio_correcto(pack) -> None:
    v = grade(q(pack, "q_cs_p_manip"), {"p1": 4, "p2": 1, "m": 100}, pack.ejemplo)
    assert v.correcta


def test_manip_desplazo_cuando_debia_girar_es_BL_M3(pack) -> None:
    """Mover el intercepto que no cambia es exactamente BL-M3."""
    v = grade(q(pack, "q_cs_p_manip"), {"p1": 3, "p2": 1, "m": 75}, pack.ejemplo)
    assert not v.correcta and v.misconception_id == "BL-M3"


def test_abierta_no_pasa_por_grader_determinista(pack) -> None:
    with pytest.raises(ValueError, match="no es determinista"):
        grade(q(pack, "q_slope_open"), "lo que sea", pack.ejemplo)
