"""D-1 / RNP: las propiedades que, si se rompen, convierten el diseño en otra cosa.

No prueban que el estadístico dé un número —a un estudiante no dará ninguno, y esa es la
conducta correcta— sino que la recogida es válida: que los brazos son recuperables del
log, que el emparejamiento no puede dejar el dominio fuera de alcance, y que nada de esto
entra en el cálculo de dominio.
"""
from __future__ import annotations

import json
import pathlib

import pytest

from app.server.core.content.loader import FilesystemPackSource
from app.server.core.mastery import assist
from app.server.db.repo import Repo

ROOT = pathlib.Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack("budget-line", "es")


def test_la_pista_nunca_puede_entregar_la_respuesta(pack) -> None:
    """Sin dígitos: es lo que hace estructuralmente imposible que una pista mostrada
    ANTES de contestar contenga el resultado del ítem que precede. Comprobable en una
    línea, a diferencia de "a un revisor le parece justo"."""
    # Sin este conteo la prueba pasa cuando no hay NINGUNA pista, que es como empezó el
    # repositorio y como quedaría si alguien borra el campo. La prueba de extremo a extremo
    # ya enseñó lo que cuesta una aserción que nunca se ejecuta.
    assert sum(1 for m in pack.misconceptions if m.nudge) >= 2
    for m in pack.misconceptions:
        if m.nudge is None:
            continue
        for lang in ("es", "en"):
            texto = getattr(m.nudge, lang)
            assert not any(c.isdigit() for c in texto), f"{m.id}/{lang} tiene dígitos"
            assert "?" not in texto and "¿" not in texto, (
                f"{m.id}/{lang} es una pregunta; la pista es una pista, y una pregunta "
                "antes del primer intento es un interrogatorio sin dónde contestar"
            )


def test_la_sonda_siempre_pertenece_a_la_sub_skill(pack) -> None:
    """El filtro on-target. Empujar sobre pendiente justo antes de una pregunta de
    interceptos es peor que callarse: es el tutor sin escuchar, y quedaría en el log como
    una observación tratada."""
    comprobados = 0
    for q in pack.questions:
        for mid in assist.on_target(pack, q):
            comprobados += 1
            assert q.subskill_primary in pack.misconception(mid).subskills
    assert comprobados >= 5, "on_target no devolvió nada: la prueba no comprobó nada"


def test_el_dominio_sigue_alcanzable_bajo_cualquier_asignacion() -> None:
    """La demostración del §2 de la especificación, ejecutada.

    `sin_andamiaje_min = 1` exige que al menos una de las tres respuestas de la racha sea
    sin ayuda, y las filas empujadas son las únicas que RNP marca asistidas. Un bloque
    lleva exactamente un empuje, así que dos empujes solo pueden quedar contiguos cruzando
    la frontera de un bloque, y nunca tres seguidos.
    """
    from itertools import product
    ordenes = [(assist.PUSH, assist.SOLO), (assist.SOLO, assist.PUSH)]
    for n in (1, 2, 3, 4):
        for combo in product(ordenes, repeat=n):
            assert assist.bloque_respeta_sin_andamiaje(list(combo)), combo


def test_tres_empujes_seguidos_serian_detectados() -> None:
    """La prueba anterior no vale nada si la propiedad es cierta para todo. Esta muestra
    que el detector distingue: una secuencia que el emparejamiento no puede producir, y
    que sí dejaría el dominio fuera de alcance, falla."""
    assert not assist.bloque_respeta_sin_andamiaje(
        [(assist.PUSH, assist.PUSH), (assist.PUSH, assist.SOLO)])


def test_el_experimento_no_alimenta_el_dominio() -> None:
    """Estructural y no recordada: ni `state.py` ni `select.py` importan `assist`.

    Es la garantía de que la asignación aleatoria no puede colarse en el criterio por un
    import que alguien añada de buena fe dentro de seis meses.
    """
    for archivo in ("state.py", "select.py"):
        src = (ROOT / "app" / "server" / "core" / "mastery" / archivo).read_text("utf-8")
        assert "assist" not in src, f"{archivo} importa o menciona assist"


def test_el_brazo_es_recuperable_del_log(tmp_path, pack) -> None:
    """Sin la semilla y el orden en el evento, los brazos son un relato y no un
    experimento: nadie puede comprobar que no se asignaron después de ver los
    resultados."""
    repo = Repo(str(tmp_path / "t.sqlite"))
    sid = repo.create_session(concept_id="budget-line", pack_version=pack.version,
                              lang="es", media_variant="A")
    q1 = next(q for q in pack.questions if assist.es_emparejable(pack, q))
    bloque = assist.abrir_bloque(pack, sid, q1, set(), 0)
    assert bloque is not None
    repo.append_event(sid, assist.TIPO_BLOQUE, bloque.payload())

    leidos = assist.bloques_del_log(repo.events(sid))
    assert len(leidos) == 1
    b = leidos[0]
    assert (b.q1, b.q2, b.orden, b.seed) == (bloque.q1, bloque.q2, bloque.orden, bloque.seed)
    # Y la moneda es re-derivable a partir de la semilla, que es lo que permite auditarla.
    assert assist.abrir_bloque(pack, sid, q1, set(), 0).orden == bloque.orden
    repo.close()


def test_exactamente_un_empuje_por_bloque(pack) -> None:
    """Y que la moneda no esté pegada: 40 semillas tienen que producir los dos órdenes."""
    ordenes = set()
    for i in range(40):
        q1 = next(q for q in pack.questions if assist.es_emparejable(pack, q))
        b = assist.abrir_bloque(pack, f"s{i}", q1, set(), 0)
        assert b is not None
        assert sorted(b.orden) == [assist.PUSH, assist.SOLO]
        ordenes.add(b.orden)
    assert len(ordenes) == 2, f"la moneda siempre sale igual: {ordenes}"


def test_un_bloque_cerrado_ya_no_reclama_sus_items(pack) -> None:
    """Sin esto, volver a servir q1 tras un fallo escribiría una segunda fila de posición
    1 con el mismo pair_id y convertiría un par de dos celdas en tres."""
    q1 = next(q for q in pack.questions if assist.es_emparejable(pack, q))
    b = assist.abrir_bloque(pack, "s", q1, set(), 0)
    assert assist.situar([b], set(), b.q1) is not None
    assert assist.situar([b], {b.q1}, b.q2) is not None
    assert assist.situar([b], {b.q1, b.q2}, b.q1) is None


def test_el_universo_del_estadistico_excluye_lo_no_emparejado(tmp_path, pack) -> None:
    """`assist_arm` es columna y no un campo dentro de `raw_answer` justamente para poder
    escribir esto: la lectura tiene que poder filtrar explícitamente."""
    repo = Repo(str(tmp_path / "t.sqlite"))
    sid = repo.create_session(concept_id="budget-line", pack_version=pack.version,
                              lang="es", media_variant="A")
    repo.record_answer(session_id=sid, question_id="a", modalidad="mcq", raw_answer=0,
                       grader="deterministic", score=1.0,
                       assist_arm=assist.PUSH, pair_id="p1", pair_pos=1, probe_id="BL-M1")
    repo.record_answer(session_id=sid, question_id="b", modalidad="mcq", raw_answer=0,
                       grader="deterministic", score=1.0,
                       assist_arm=assist.SOLO, pair_id="p1", pair_pos=2)
    repo.record_answer(session_id=sid, question_id="c", modalidad="mcq", raw_answer=0,
                       grader="deterministic", score=0.0)
    filas = repo.conn.execute(
        "SELECT assist_arm, pair_id, pair_pos FROM answers WHERE session_id = ? "
        "ORDER BY id", (sid,)).fetchall()
    assert [r["assist_arm"] for r in filas] == ["push", "solo", "na"]
    assert [r["pair_id"] for r in filas] == ["p1", "p1", None]
    repo.close()


def _sin_red(m) -> None:
    """Corta al proveedor LLM. La primera versión de esta prueba tardó 85 s porque el juez
    en sombra llamaba de verdad a la API en cada ítem abierto: una suite que necesita red
    y saldo no es una suite."""
    from app.server.core.llm.provider import LLMError

    class Cortado:
        name = "cortado"

        def complete(self, *a, **k):
            raise LLMError("el proveedor está cortado en las pruebas")

    m.provider = Cortado()


def _valor_correcto(pack, q):
    """La respuesta correcta de un ítem, desde el pack. Existe porque la primera versión
    de la prueba de extremo a extremo contestaba mal a todo, el selector se quedaba
    clavado en la primera sub-skill —que no tiene ítems emparejables— y la prueba pasaba
    EN VACÍO: ni un solo par abierto, y todas las aserciones sobre el brazo empujado sin
    ejecutarse nunca. Pasó a la primera, que es justo cuando hay que desconfiar."""
    from app.server.core.judge.deterministic import eval_expr   # AST con lista blanca
    e = pack.ejemplo
    ctx = {"p1": e.p1, "p2": e.p2, "m": e.m}
    if q.modalidad == "mcq":
        return next(i for i, o in enumerate(q.opciones) if o.correcta)
    if q.modalidad == "numeric":
        return eval_expr(q.respuesta["expr"], ctx)
    if q.modalidad == "manip":
        # El corrector NO recibe pendiente e intercepto: recibe los p1/p2/m que la recta
        # arrastrada implica, y deriva de ahí. Enviar la forma equivocada se corrige como
        # respuesta INCORRECTA y no como error — la primera versión de este ayudante lo
        # hizo, el alumno simulado nunca superaba la primera sub-skill, y el recorrido no
        # llegaba jamás a un ítem emparejable.
        v = q.verificacion
        if v.get("tipo") == "region":
            # Una canasta asequible: gasta la mitad del ingreso en un solo bien.
            return {"x1": 0.0, "x2": (e.m / e.p2) / 2}
        pend = v["pendiente_esperada"]
        icpt = v["intercepto_x2_esperado"]
        pendiente = eval_expr(pend, ctx) if isinstance(pend, str) else float(pend)
        int_x2 = eval_expr(icpt, ctx) if isinstance(icpt, str) else float(icpt)
        p2 = 1.0
        return {"p1": -pendiente * p2, "p2": p2, "m": int_x2 * p2}
    return "sin respuesta"


def test_un_par_completo_se_abre_y_se_cierra_de_verdad(tmp_path, pack) -> None:
    """El recorrido real: contestando BIEN, el alumno avanza hasta una sub-skill con
    ítems emparejables y se abre un bloque con sus dos brazos.

    La aserción que importa es que HUBO un empuje. Sin ella esta prueba vuelve a ser la
    que pasaba sin ejercitar nada.
    """
    from fastapi.testclient import TestClient
    import importlib
    import os
    os.environ["TUTORIA_DB"] = str(tmp_path / "e2e.sqlite")
    import app.server.main as m
    importlib.reload(m)
    _sin_red(m)
    c = TestClient(m.app)
    sid = c.post("/api/session",
                 json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]

    brazos = []
    for _ in range(40):
        nxt = c.get(f"/api/session/{sid}/next").json()
        if nxt.get("done") or "question" not in nxt:
            break
        qid = nxt["question"]["id"]
        q = next(x for x in pack.questions if x.id == qid)
        brazos.append((qid, nxt.get("assist", {}).get("arm")))
        c.post(f"/api/session/{sid}/answer",
               json={"question_id": qid, "valor": _valor_correcto(pack, q),
                     "think_ms": 3300})

    empujados = [x for x in brazos if x[1] == "push"]
    solos = [x for x in brazos if x[1] == "solo"]
    assert empujados, f"ningún ítem empujado en todo el recorrido: {brazos}"
    assert solos, f"ningún ítem en el brazo solo: {brazos}"

    pares = m.repo.conn.execute(
        "SELECT pair_id, COUNT(DISTINCT pair_pos) n FROM answers WHERE session_id = ? "
        "AND pair_id IS NOT NULL GROUP BY pair_id", (sid,)).fetchall()
    completos = [r["pair_id"] for r in pares if r["n"] == 2]
    assert completos, f"ningún par llegó a cerrarse: {[dict(r) for r in pares]}"


def test_una_respuesta_con_pista_queda_registrada_como_asistida(tmp_path, pack) -> None:
    """Registrarla como sin ayuda sería una mentira en el esquema. El criterio de dominio
    ya sabe pesar evidencia asistida; lo que no puede es que se le mienta."""
    from fastapi.testclient import TestClient
    import os
    os.environ["TUTORIA_DB"] = str(tmp_path / "app.sqlite")
    import importlib
    import app.server.main as m
    importlib.reload(m)
    c = TestClient(m.app)
    sid = c.post("/api/session", json={"concept_id": "budget-line", "lang": "es"}).json()["session_id"]

    vistos, empujados = [], []
    for _ in range(12):
        nxt = c.get(f"/api/session/{sid}/next").json()
        if nxt.get("done") or "question" not in nxt:
            break
        q = nxt["question"]
        vistos.append((q["id"], nxt.get("assist", {}).get("arm")))
        if nxt.get("assist", {}).get("arm") == "push":
            empujados.append(q["id"])
            assert nxt["assist"]["texto"].startswith(assist.LEAD_IN["es"])
        # contestar mal a propósito da igual: lo que se comprueba es el registro del brazo
        c.post(f"/api/session/{sid}/answer",
               json={"question_id": q["id"], "valor": 0, "think_ms": 4200})

    filas = m.repo.conn.execute(
        "SELECT question_id, assist_arm, con_andamiaje, think_ms FROM answers "
        "WHERE session_id = ? ORDER BY id", (sid,)).fetchall()
    assert filas, f"no se contestó nada; se vio {vistos}"
    for r in filas:
        assert r["think_ms"] == 4200
        if r["assist_arm"] == "push":
            assert r["con_andamiaje"] == 1, f"{r['question_id']} empujado sin marcar"
        # `na` ya NO implica sin andamiaje: tras revelarle la respuesta a un alumno, sus
        # aciertos posteriores en ese ítem se registran como asistidos, aunque el ítem no
        # esté en ningún par de D-1. Esa marca la puso la revisión adversarial de codex, que
        # demostró que sin ella el motor de dominio contaba una respuesta copiada como
        # evidencia limpia. Lo que sí se sigue exigiendo es que un `push` esté marcado.

    # Y el evento de apertura lleva la semilla, o nada de esto es auditable.
    ev = [json.loads(e["payload"]) for e in m.repo.events(sid)
          if e["type"] == assist.TIPO_BLOQUE]
    for p in ev:
        assert p["seed"] and p["orden"] and p["q1"] and p["q2"]


def test_ningun_item_del_juez_llm_puede_emparejarse(pack) -> None:
    """El camino de escritura de una respuesta abierta es `shadow.run`, que no lleva las
    columnas del experimento. Un par de dos ítems abiertos se abriría, serviría los dos
    brazos, mostraría la pista, y no registraría ninguno: la asignación existiría solo en
    el log de eventos, sin ningún resultado atado a ella.

    En ESTE pack no puede formarse ese par —cada ítem abierto es el único de su sub-skill—
    así que el agujero era invisible y se habría abierto el día que alguien escriba un
    segundo. Por eso la exclusión es estructural y no incidental."""
    abiertos = [q for q in pack.questions if q.grader == "llm"]
    assert abiertos, "el pack no tiene ítems del juez: esta prueba no comprobaría nada"
    for q in abiertos:
        assert not assist.es_emparejable(pack, q), q.id
