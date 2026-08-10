"""Tests de M0: el pack carga y es coherente, la DB funciona, el servidor responde."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.server.core.content.loader import FilesystemPackSource
from app.server.core.content.schema import Dominio, Pack
from app.server.db.repo import Repo


@pytest.fixture(scope="module")
def pack() -> Pack:
    return FilesystemPackSource().get_pack("budget-line")


# ---- contenido -------------------------------------------------------------

def test_pack_carga_y_es_coherente(pack: Pack) -> None:
    assert pack.id == "budget-line"
    assert len(pack.sub_skills) == 6
    assert len(pack.misconceptions) == 7
    assert len(pack.questions) == 16


def test_ejemplo_da_la_pendiente_del_guion(pack: Pack) -> None:
    assert pack.ejemplo.pendiente == -3.0
    assert pack.ejemplo.intercepto_x2 == 100.0
    assert round(pack.ejemplo.intercepto_x1, 2) == 33.33


def test_el_enum_del_juez_lleva_los_escapes(pack: Pack) -> None:
    """Sin NINGUNA/FUERA_DE_CATALOGO el gate 'cero ids fuera de catálogo' se pasaría
    por construcción, porque el juez estaría obligado a inventar un diagnóstico."""
    assert pack.enum_misconceptions[-2:] == ["NINGUNA", "FUERA_DE_CATALOGO"]
    assert len(pack.enum_misconceptions) == len(pack.misconceptions) + 2


def test_los_timelines_estan_alineados(pack: Pack) -> None:
    assert set(pack.timelines) == {"es", "en"}
    for lang, tl in pack.timelines.items():
        assert len(tl.cues) == 10, lang
        sin_alinear = [c.id for c in tl.cues if c.t is None]
        assert not sin_alinear, f"{lang}: cues sin alinear {sin_alinear}"
        # los cues deben ir en orden temporal estricto
        ts = [c.t for c in tl.cues]
        assert ts == sorted(ts), f"{lang}: cues desordenados"


def test_cada_subskill_esencial_puede_alcanzar_dominio(pack: Pack) -> None:
    """El criterio exige >=2 modalidades y, como el juez LLM aporta como mucho 1 de 3
    evidencias, al menos 2 ítems deterministas por sub-skill."""
    necesarias = pack.dominio.aciertos_consecutivos - pack.dominio.max_evidencias_del_juez_llm
    for s in pack.sub_skills:
        if not s.esencial:
            continue
        mias = [q for q in pack.questions if q.subskill_primary == s.id]
        assert len({q.modalidad for q in mias}) >= pack.dominio.modalidades_min, s.id
        det = [q for q in mias if q.grader == "deterministic"]
        assert len(det) >= necesarias, f"{s.id}: {len(det)} deterministas, faltan {necesarias}"


def test_todas_las_misconceptions_son_detectables_sin_llm(pack: Pack) -> None:
    """Hace viable la contingencia del PLAN R1: si el juez no pasa el gate, el
    diagnóstico se apoya solo en ítems deterministas."""
    detectables = set()
    for q in pack.questions:
        if q.grader != "deterministic":
            continue
        detectables |= {o.misconception for o in (q.opciones or []) if o.misconception}
        detectables |= {v for v in (q.diagnostico_si_falla or {}).values() if v}
    faltan = {m.id for m in pack.misconceptions} - detectables
    assert not faltan, f"solo detectables con LLM: {sorted(faltan)}"


def test_dominio_incoherente_es_rechazado() -> None:
    with pytest.raises(ValueError, match="max_evidencias_del_juez_llm"):
        Dominio(aciertos_consecutivos=1, max_evidencias_del_juez_llm=2)
    with pytest.raises(ValueError, match="sin_andamiaje_min"):
        Dominio(aciertos_consecutivos=2, sin_andamiaje_min=3)


# ---- base de datos ---------------------------------------------------------

@pytest.fixture()
def repo(tmp_path) -> Repo:
    r = Repo(tmp_path / "t.sqlite")
    yield r
    r.close()


def test_sesion_y_eventos_append_only(repo: Repo) -> None:
    sid = repo.create_session(concept_id="budget-line", pack_version="0.1.0", lang="es")
    repo.append_event(sid, "cue.fired", {"id": "slope"})
    repo.set_phase(sid, "delivery.checkpoint")
    evs = repo.events(sid)
    assert [e["seq"] for e in evs] == [1, 2, 3]
    assert evs[0]["type"] == "session.started"
    assert evs[-1]["type"] == "phase.changed"


def test_el_esquema_no_guarda_credenciales(repo: Repo) -> None:
    """C15: tutorIA nunca almacena passwords; solo reserva el mapeo al auth del destino."""
    cols = {r["name"] for r in repo.conn.execute("PRAGMA table_info(students)")}
    assert "external_auth_id" in cols
    assert not {c for c in cols if "pass" in c.lower() or "hash" in c.lower()}


# ---- servidor --------------------------------------------------------------

@pytest.fixture(scope="module")
def client() -> TestClient:
    from app.server.main import app
    return TestClient(app)


def test_health(client: TestClient) -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert "budget-line" in r.json()["packs"]


def test_crear_sesion_devuelve_media_y_checkpoints(client: TestClient) -> None:
    r = client.post("/api/session", json={"concept_id": "budget-line", "lang": "es"})
    assert r.status_code == 200
    body = r.json()
    assert body["media"]["duration_s"] > 0
    assert len(body["checkpoints"]) == 2
    r2 = client.get(f"/api/session/{body['session_id']}")
    assert r2.json()["phase"] == "delivery.playing"


def test_idioma_inexistente_da_400(client: TestClient) -> None:
    r = client.post("/api/session", json={"concept_id": "budget-line", "lang": "fr"})
    assert r.status_code == 422 or r.status_code == 400


def test_pack_inexistente_da_404(client: TestClient) -> None:
    assert client.get("/api/packs/no-existe").status_code == 404
