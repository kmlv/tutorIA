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
