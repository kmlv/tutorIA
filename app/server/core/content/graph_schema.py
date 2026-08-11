"""El esquema JSON del guion del gráfico (decisión D-3).

La decisión dice: *Kristian define el esquema una vez; el modelo genera el JSON de cada
concepto.* Este módulo construye ese esquema, y lo construye **para una lista concreta de
cues** en vez de ser un documento fijo.

Esa es la diferencia entre un esquema y una barandilla. Con las claves libres, un modelo
puede inventarse un cue que la timeline no dispara —o saltarse uno que sí— y el JSON sigue
siendo válido; el fallo aparece después, en pantalla, como una lección que no dibuja.
Enumerando los cues, el propio decodificador del proveedor impide las dos cosas: los
`strict` de OpenAI exigen `additionalProperties: false` y que **todas** las propiedades
estén en `required`, así que un cue de más no se puede escribir y uno de menos no se puede
omitir.

Queda una cosa que ningún esquema puede comprobar y que por eso vive en `script.ts`: si la
lección que el documento describe es la correcta. El esquema garantiza que el JSON se pueda
ejecutar; `revisar()` garantiza que las expresiones estén en la gramática; y solo un humano
—o el golden— garantiza que enseñe lo que se quería enseñar.
"""
from __future__ import annotations

#: Sincronizados a mano con `app/web/src/graph/script.ts`. Duplicados a propósito y no
#: importados: el intérprete vive en TypeScript porque lo ejecuta el navegador, y generar
#: el esquema desde allí obligaría a arrancar node para pedirle un JSON a un modelo. El
#: precio de la duplicación es esta lista, y `test_d3_graph_script.py` falla si divergen.
CAPAS = ["ejes", "linea", "interceptos", "conjunto", "pendiente"]
DESTACADOS = ["ninguno", "intercepto_x1", "intercepto_x2", "pendiente"]
FANTASMAS = ["base", "ninguno"]
VARIABLES = ["p1", "p2", "m"]


def _op_schema() -> dict:
    """Una operación: exactamente una de las cinco formas.

    `anyOf` y no un objeto con cinco campos opcionales: con campos opcionales, un modelo
    puede emitir `{mostrar: ..., destacar: ...}` y el orden entre las dos mitades no está
    definido en ninguna parte. `revisar()` en el cliente rechaza eso mismo; tenerlo también
    aquí lo convierte en imposible en vez de en detectable.

    `anyOf` y no `oneOf` porque el modo estricto de OpenAI **rechaza `oneOf`** con un 400.
    Las cinco ramas son mutuamente excluyentes de todas formas —cada una fija su única
    clave y prohíbe las demás— así que aquí `anyOf` significa lo mismo.

    Sin `minItems`, `minProperties` ni `pattern`: el subconjunto estricto tampoco los
    admite. Lo que esos guardaban lo comprueba `revisar()`, que es de todas formas quien
    tiene la última palabra — un esquema que el proveedor no puede aplicar no protege nada.
    """
    def solo(nombre: str, valor: dict) -> dict:
        return {
            "type": "object",
            "properties": {nombre: valor},
            "required": [nombre],
            "additionalProperties": False,
        }

    capa = {"type": "string", "enum": CAPAS}
    lista_capas = {"anyOf": [capa, {"type": "array", "items": capa}]}
    # Las expresiones van como cadena y su gramática la comprueba `revisar()`: JSON Schema
    # sabe describir "cadena" y no "una variable, un operador y un término", y el modo
    # estricto ni siquiera admite `pattern`.
    #: Anulable Y obligatoria en las tres variables. El modo estricto exige que `required`
    #: contenga TODAS las propiedades, así que "cambia solo p1" no se puede expresar
    #: omitiendo p2 y m: hay que enviarlos como null. Es el idioma documentado, y obliga a
    #: que el intérprete ignore los nulos — `aplicarOps` y `revisar` lo hacen.
    expr = {"type": ["string", "null"]}
    return {
        "anyOf": [
            solo("mostrar", lista_capas),
            solo("ocultar", lista_capas),
            solo("destacar", {"type": "string", "enum": DESTACADOS}),
            solo("fantasma", {"type": "string", "enum": FANTASMAS}),
            solo("set", {
                "type": "object",
                "properties": {v: expr for v in VARIABLES},
                "required": VARIABLES,
                "additionalProperties": False,
            }),
        ]
    }


def build_schema(cue_ids: list[str]) -> dict:
    """El esquema para ESTOS cues. `strict`-compatible.

    Todos los cues son obligatorios. Un cue que solo narra se expresa con una lista vacía
    de operaciones, no omitiéndolo: obligar a escribir `[]` convierte "aquí no pasa nada"
    en una decisión visible en el documento, que es justo lo que la compuerta necesita para
    distinguir un cue mudo a propósito de uno que el modelo se saltó.
    """
    op = _op_schema()
    return {
        "type": "object",
        "properties": {
            "version": {"type": "integer", "enum": [1]},
            "cues": {
                "type": "object",
                "properties": {
                    cid: {"type": "array", "items": op} for cid in cue_ids
                },
                "required": list(cue_ids),
                "additionalProperties": False,
            },
        },
        "required": ["version", "cues"],
        "additionalProperties": False,
    }
