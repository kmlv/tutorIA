"""El menos tipográfico `−` no es el guion de ASCII, y esa diferencia invisible tiene dos
consecuencias que se arreglan a la vez o no se arreglan.

Salió al escribir bien la matemática del contenido: mejorar la tipografía habría abierto
un agujero pedagógico, porque el guardián que impide que el tutor suelte la respuesta
busca números con una expresión regular de ASCII.
"""
import pytest

from app.server.core.chat.tutor import leaks_answer
from app.server.core.content.loader import FilesystemPackSource
from app.server.core.judge.deterministic import grade_numeric


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack("budget-line", "es")


def _pendiente(pack):
    """El ítem cuya respuesta es negativa: el único donde el signo decide."""
    for q in pack.questions:
        if q.modalidad == "numeric" and (q.respuesta or {}).get("expr", "").strip().startswith("-"):
            return q
    pytest.skip("el banco no tiene ningún ítem numérico de respuesta negativa")


def test_el_guardian_bloquea_el_menos_tipografico(pack):
    """LA MISMA FRASE con los dos signos. Antes, una pasaba."""
    q = _pendiente(pack)
    assert leaks_answer("La pendiente es -3", q, pack.ejemplo)
    assert leaks_answer("La pendiente es −3", q, pack.ejemplo), (
        "el guardián deja pasar el menos tipográfico: el tutor puede soltar la respuesta "
        "escribiéndola con el signo que el propio gráfico dibuja")


def test_el_alumno_puede_pegar_lo_que_ve(pack):
    """El gráfico dibuja `−3`. Copiarlo y pegarlo tiene que valer."""
    q = _pendiente(pack)
    v = grade_numeric(q, "−3", pack.ejemplo)
    assert not v.invalida, "copiar el número del gráfico da 'no es un número'"
    assert v.correcta

    # Y los guiones que pone solo un procesador de textos.
    assert grade_numeric(q, "–3", pack.ejemplo).correcta


def test_no_se_ablanda_la_correccion(pack):
    """Normalizar signos no puede convertir en válida una respuesta que no lo es."""
    q = _pendiente(pack)
    assert grade_numeric(q, "tres", pack.ejemplo).invalida
    assert not grade_numeric(q, "3", pack.ejemplo).correcta
