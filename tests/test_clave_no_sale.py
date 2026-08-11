"""La clave de respuestas no puede llegar al navegador.

Existe porque llegaba. `/api/packs/{id}` devolvía `pack.model_dump()` entero, y el pack
entero lleva `respuesta`, `opciones[].correcta`, los `key_points` de la rúbrica y el
catálogo de misconceptions: con F12 se leía qué opción es la correcta de las 21 preguntas.

El veredicto sí se decidía en el servidor, así que la mitad de la afirmación era cierta.
La otra mitad no, y nadie lo había mirado — apareció al preguntarse qué haría falta para
publicar el PoC en un host estático.

La prueba mira el JSON REAL de las rutas, no la función que lo construye. Comprobar la
función dejaría pasar el día que alguien añada una ruta nueva que vuelva a volcar el pack.
"""
from __future__ import annotations

import json
import os

import pytest
from fastapi.testclient import TestClient

#: Nombres que, si aparecen en cualquier parte de una respuesta al navegador, significan
#: que se está publicando algo que decide si una respuesta es correcta.
PROHIBIDOS = (
    "respuesta", "correcta", "verificacion", "key_points", "diagnostico_si_falla",
    "misconceptions_vigilar", "socratic_probe", "distractor", "señal_observable",
)


@pytest.fixture(scope="module")
def cliente(tmp_path_factory):
    os.environ["TUTORIA_DB"] = str(tmp_path_factory.mktemp("db") / "t.sqlite")
    import importlib

    import app.server.main as m
    importlib.reload(m)
    return TestClient(m.app)


def _fugas(nodo, ruta="$") -> list[str]:
    fuera: list[str] = []
    if isinstance(nodo, dict):
        for k, v in nodo.items():
            if k in PROHIBIDOS:
                fuera.append(f"{ruta}.{k}")
            fuera += _fugas(v, f"{ruta}.{k}")
    elif isinstance(nodo, list):
        for i, v in enumerate(nodo):
            fuera += _fugas(v, f"{ruta}[{i}]")
    return fuera


def test_el_pack_publico_no_lleva_la_clave(cliente) -> None:
    r = cliente.get("/api/packs/budget-line?lang=es")
    assert r.status_code == 200
    d = r.json()
    # Que la prueba no pase por estar vacía: tiene que traer las preguntas de verdad.
    assert len(d["questions"]) >= 20, d
    assert any(q.get("opciones") for q in d["questions"]), "ninguna pregunta con opciones"
    assert not _fugas(d), _fugas(d)


def test_la_sesion_no_lleva_la_clave(cliente) -> None:
    r = cliente.post("/api/session", json={"concept_id": "budget-line", "lang": "es"})
    assert r.status_code == 200
    d = r.json()
    assert d["media"]["cues"], "sin cues: la prueba no comprobaría nada"
    assert not _fugas(d), _fugas(d)


def test_el_siguiente_item_no_lleva_la_clave(cliente) -> None:
    sid = cliente.post("/api/session",
                       json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]
    r = cliente.get(f"/api/session/{sid}/next")
    assert r.status_code == 200
    d = r.json()
    assert d.get("question"), "sin ítem: la prueba no comprobaría nada"
    assert not _fugas(d), _fugas(d)


def test_el_detector_distingue() -> None:
    """Si `_fugas` no encontrara nada nunca, las tres pruebas de arriba serían adorno."""
    assert _fugas({"questions": [{"opciones": [{"es": "a", "correcta": True}]}]})
    assert _fugas({"a": {"b": [{"respuesta": {"expr": "m/p1"}}]}})
    assert not _fugas({"questions": [{"id": "q", "enunciado": {"es": "¿cuánto?"}}]})


def test_el_texto_crudo_tampoco_los_lleva(cliente) -> None:
    """Por si un campo se colara con otro nombre dentro de una cadena: se mira el cuerpo
    entero como texto y se buscan los valores que delatarían la clave."""
    cuerpo = cliente.get("/api/packs/budget-line?lang=es").text
    for aguja in ('"correcta"', '"respuesta"', '"key_points"', "tolerancia"):
        assert aguja not in cuerpo, f"{aguja} aparece en el JSON público"
    json.loads(cuerpo)


def test_la_respuesta_se_revela_al_segundo_fallo_y_no_antes(cliente) -> None:
    """Instrucción de Kristian tras probarlo: "contesté mal... no me da la respuesta
    correcta. Creo que eso debería corregirse."

    Al SEGUNDO fallo y no al primero: la primera equivocación es donde vive la sonda
    socrática, y revelar antes convierte el tutor en un solucionario. Y lo decide el
    servidor, porque la clave no puede estar en el navegador."""
    sid = cliente.post("/api/session",
                       json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]

    # El ítem tiene que haber sido SERVIDO. Sin esto la revelación no llega, y ese es
    # justo el candado que impide que /answer sea un oráculo.
    cliente.get(f"/api/session/{sid}/next")
    qid = "q_cp1_income_direction"
    cliente.post(f"/api/session/{sid}/events",
                 json={"type": "practice.item_shown", "payload": {"question_id": qid}})

    def fallar():
        return cliente.post(f"/api/session/{sid}/answer",
                            json={"question_id": qid, "valor": 3}).json()

    primera = fallar()
    assert primera["correcta"] is False
    assert "revelacion" not in primera, "no debe revelar al primer intento"

    segunda = fallar()
    assert segunda["correcta"] is False
    assert "revelacion" in segunda, "al segundo fallo tiene que decir cuál era"
    assert "desplaza hacia afuera" in segunda["revelacion"], segunda["revelacion"]


def test_acertar_nunca_revela(cliente) -> None:
    """Si revelara al acertar, el mensaje sobraría; y si revelara SIEMPRE, el ítem
    quedaría quemado para el resto de la sesión."""
    sid = cliente.post("/api/session",
                       json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]
    cliente.post(f"/api/session/{sid}/events",
                 json={"type": "practice.item_shown",
                       "payload": {"question_id": "q_cp1_income_direction"}})
    r = cliente.post(f"/api/session/{sid}/answer",
                     json={"question_id": "q_cp1_income_direction", "valor": 0}).json()
    assert r["correcta"] is True
    assert "revelacion" not in r


def test_answer_no_es_un_oraculo(cliente) -> None:
    """El ataque exacto que ejecutó codex: sin reproducir la lección, mandar valores basura
    contra cada id del pack y cosechar las respuestas. Sacó 15 de 15 en 30 peticiones.

    El candado es que el ítem tiene que haber sido SERVIDO a esta sesión. Se prueba con el
    ataque y no con la función, porque lo que importa es lo que la red permite."""
    sid = cliente.post("/api/session",
                       json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]
    publico = cliente.get("/api/packs/budget-line?lang=es").json()
    ids = [q["id"] for q in publico["questions"] if q.get("opciones")]
    assert len(ids) >= 8, "el pack público no trae MCQ: la prueba no comprobaría nada"

    cosechadas = 0
    for qid in ids:
        for _ in range(3):                       # fallar de sobra para forzar la revelación
            r = cliente.post(f"/api/session/{sid}/answer",
                             json={"question_id": qid, "valor": 99}).json()
            if "revelacion" in r:
                cosechadas += 1
                break
    assert cosechadas == 0, f"{cosechadas} respuestas extraídas sin jugar la lección"


def test_contestar_bien_y_luego_mal_no_revela(cliente) -> None:
    """Se cuentan FALLOS, no envíos. Antes se contaban todas las filas, así que acertar y
    luego equivocarse revelaba en el primer error."""
    sid = cliente.post("/api/session",
                       json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]
    qid = "q_cp1_income_direction"
    cliente.post(f"/api/session/{sid}/events",
                 json={"type": "practice.item_shown", "payload": {"question_id": qid}})
    cliente.post(f"/api/session/{sid}/answer", json={"question_id": qid, "valor": 0})
    r = cliente.post(f"/api/session/{sid}/answer", json={"question_id": qid, "valor": 3}).json()
    assert "revelacion" not in r, "un solo fallo no debe revelar, aunque haya envíos previos"
