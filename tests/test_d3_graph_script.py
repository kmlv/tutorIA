"""D-3: el esquema del guion del gráfico, del lado del servidor.

El intérprete y su validador viven en TypeScript porque los ejecuta el navegador, y se
prueban en `app/web/test/script.golden.mjs`. Aquí se prueba lo que solo existe en Python:
el esquema JSON que se le manda al modelo, y que su vocabulario no se haya separado del
del intérprete.
"""
from __future__ import annotations

import json
import pathlib
import re

import pytest

from app.server.core.content import graph_schema as gs
from app.server.core.content.loader import FilesystemPackSource

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT_TS = ROOT / "app" / "web" / "src" / "graph" / "script.ts"


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack("budget-line", "es")


def _lista_ts(nombre: str) -> list[str]:
    src = SCRIPT_TS.read_text(encoding="utf-8")
    m = re.search(rf"export const {nombre} = \[(.*?)\] as const;", src, re.S)
    assert m, f"no encontré {nombre} en script.ts"
    return re.findall(r'"([^"]+)"', m.group(1))


@pytest.mark.parametrize("nombre,py", [
    ("CAPAS", gs.CAPAS), ("DESTACADOS", gs.DESTACADOS),
    ("FANTASMAS", gs.FANTASMAS), ("VARIABLES", gs.VARIABLES),
    ("BIENES", gs.BIENES), ("ESTACIONES", gs.ESTACIONES), ("TERMINOS", gs.TERMINOS),
])
def test_el_vocabulario_no_se_ha_separado(nombre: str, py: list[str]) -> None:
    """El esquema está en Python y el intérprete en TypeScript, así que el vocabulario
    está duplicado. La duplicación es deliberada —generar el esquema desde TS obligaría a
    arrancar node solo para pedirle un JSON a un modelo— y este test es su precio.

    Si divergen, el fallo es de los silenciosos: el modelo emite una capa que el esquema
    acepta y el intérprete no conoce, y el gráfico deja de dibujar esa parte sin queja."""
    assert _lista_ts(nombre) == py


def test_el_esquema_cumple_el_modo_estricto() -> None:
    """Las tres reglas de `strict` de OpenAI, que ya costaron dos 400 seguidos:
    `additionalProperties: false` en todo objeto, `required` con TODAS las propiedades, y
    nada de `oneOf`."""
    esquema = gs.build_schema(["a", "b"])

    problemas: list[str] = []

    def revisar(nodo, ruta="$"):
        if isinstance(nodo, dict):
            if "oneOf" in nodo:
                problemas.append(f"{ruta}: oneOf no está permitido en modo estricto")
            if nodo.get("type") == "object":
                if nodo.get("additionalProperties") is not False:
                    problemas.append(f"{ruta}: falta additionalProperties: false")
                props = set(nodo.get("properties") or {})
                req = set(nodo.get("required") or [])
                if props != req:
                    problemas.append(f"{ruta}: required {sorted(req)} != properties {sorted(props)}")
            for k, v in nodo.items():
                revisar(v, f"{ruta}.{k}")
        elif isinstance(nodo, list):
            for i, v in enumerate(nodo):
                revisar(v, f"{ruta}[{i}]")

    revisar(esquema)
    assert not problemas, "\n".join(problemas)


def test_el_esquema_enumera_los_cues_reales(pack) -> None:
    """Enumerar los cues es lo que convierte el esquema en una barandilla: con claves
    libres, un modelo puede inventarse un cue que nadie dispara o saltarse uno que sí, y
    el JSON sigue siendo válido."""
    tl = pack.timeline("es", "A")
    ids = [c.id for c in tl.cues if c.type == "graph"]
    esquema = gs.build_schema(ids)
    cues = esquema["properties"]["cues"]
    assert set(cues["properties"]) == set(ids)
    assert cues["required"] == ids
    assert cues["additionalProperties"] is False


def test_set_admite_nulos_y_los_exige_todos() -> None:
    """El modo estricto obliga a que `required` lleve las tres variables, así que "cambia
    solo p1" se expresa mandando p2 y m en null. El intérprete los ignora; si el esquema
    no los aceptara, el modelo no tendría forma legal de decirlo."""
    op = gs.build_schema(["x"])["properties"]["cues"]["properties"]["x"]["items"]
    rama_set = next(r for r in op["anyOf"] if "set" in r["properties"])
    campo = rama_set["properties"]["set"]
    assert sorted(campo["required"]) == ["m", "p1", "p2"]
    for v in campo["properties"].values():
        assert "null" in v["type"]


def test_los_terminos_del_ledger_existen_en_el_katex_generado() -> None:
    """`destacar` apunta a símbolos que `pipeline/render_math.mjs` etiquetó dentro del
    KaTeX en tiempo de compilación. Si el vocabulario y las etiquetas se separan, el
    destacado no enciende nada y no hay ningún error: el fallo es exactamente invisible."""
    formulas = (ROOT / "app/web/src/generated/formulas.ts").read_text(encoding="utf-8")
    etiquetados = set(re.findall(r'data-term=\\"([a-z0-9]+)', formulas))
    assert etiquetados, "no encontré ningún data-term en formulas.ts"
    assert etiquetados <= set(gs.TERMINOS), (
        f"el KaTeX etiqueta términos que el vocabulario no conoce: "
        f"{sorted(etiquetados - set(gs.TERMINOS))}"
    )


def test_el_guion_del_ledger_solo_usa_terminos_etiquetados() -> None:
    import yaml
    g = yaml.safe_load(
        (ROOT / "content/packs/budget-line/graph.yaml").read_text(encoding="utf-8"))
    usados = {t for ops in (g.get("ledger") or {}).values()
              for op in ops for t in (op.get("destacar") or [])}
    assert usados, "el guion del ledger no destaca nada: la prueba no comprobaría nada"
    assert usados <= set(gs.TERMINOS), sorted(usados - set(gs.TERMINOS))


def test_el_guion_del_pack_cubre_todos_sus_cues(pack) -> None:
    """La misma comprobación que hace la compuerta, aquí para que rompa la suite y no solo
    un script que alguien tiene que acordarse de correr."""
    import yaml
    g = yaml.safe_load(
        (ROOT / "content/packs/budget-line/graph.yaml").read_text(encoding="utf-8"))
    declarados = set(g["cues"]) | set(g.get("narracion") or [])
    for lang in ("es", "en"):
        tl = pack.timeline(lang, "A")
        if tl is None:
            continue
        del_grafico = {c.id for c in tl.cues if c.type == "graph"}
        faltan = del_grafico - declarados
        assert not faltan, f"{lang}: cues sin declarar en graph.yaml: {sorted(faltan)}"
        # Y el ledger: todo cue de gráfico tiene que pintar su banda, incluidos los que
        # solo narran — ahí es justo donde se revelan las fichas.
        sin_ledger = del_grafico - set(g.get("ledger") or {})
        assert not sin_ledger, f"{lang}: cues sin ledger: {sorted(sin_ledger)}"


def test_el_pack_expone_el_guion(pack) -> None:
    assert pack.graph_script is not None
    assert pack.graph_script["version"] == 1
    # Y llega al cliente por la sesión, o el gráfico no dibuja nada.
    import os
    from fastapi.testclient import TestClient
    os.environ.setdefault("TUTORIA_DB", ":memory:")
    from app.server.main import app
    c = TestClient(app)
    r = c.post("/api/session", json={"concept_id": "budget-line", "lang": "es"}).json()
    assert r["graph_script"]["version"] == 1
    assert json.dumps(r["graph_script"])  # serializable
