"""Graders deterministas: numéricas, opción múltiple y manipulación del gráfico.

Deterministic-first (C7): el LLM sólo juzga respuestas abiertas, y eso llega en M3.
Aquí no se invoca ningún modelo. Estos tres graders son los que sostienen el criterio
de dominio, porque el juez LLM aporta como mucho 1 de las 3 evidencias.

*(Desviación menor del PLAN §2.3, que listaba `grader_numeric.py`, `grader_mcq.py` y
`grader_manip.py` por separado: van juntos porque comparten el evaluador de expresiones
y suman menos de 200 líneas. `grader_open.py` sí irá aparte, porque tiene proveedor,
prompt versionado y modo sombra.)*
"""
from __future__ import annotations

import ast
import operator
from dataclasses import dataclass, field
from typing import Any

from ..content.schema import Ejemplo, Question

_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.Pow: operator.pow, ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def eval_expr(expr: str, params: dict[str, float]) -> float:
    """Evalúa `m / p2`, `-p1 / p2`, `(m - p1*12) / p2`.

    Con `ast` y una lista blanca de operadores en vez de `eval`: estas expresiones
    vienen de archivos de contenido que algún día podría emitir un LLM, así que no
    pueden ser código arbitrario.
    """
    def walk(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return walk(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.Name):
            if node.id not in params:
                raise ValueError(f"variable desconocida: {node.id}")
            return float(params[node.id])
        if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](walk(node.left), walk(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](walk(node.operand))
        raise ValueError(f"expresión no permitida: {ast.dump(node)}")

    return walk(ast.parse(expr, mode="eval"))


@dataclass
class Veredicto:
    correcta: bool
    score: float
    misconception_id: str | None = None
    esperado: Any = None
    detalle: dict = field(default_factory=dict)


def _params(e: Ejemplo) -> dict[str, float]:
    return {"p1": e.p1, "p2": e.p2, "m": e.m}


# --- numéricas --------------------------------------------------------------

def grade_numeric(q: Question, raw: str, e: Ejemplo) -> Veredicto:
    try:
        dado = float(str(raw).replace(",", ".").strip())
    except ValueError:
        return Veredicto(False, 0.0, detalle={"error": "no es un número"})

    spec = q.respuesta or {}
    esperado = eval_expr(spec["expr"], _params(e))
    tol = float(spec.get("tolerancia", 0.01))
    if abs(dado - esperado) <= tol:
        return Veredicto(True, 1.0, esperado=esperado)

    # ¿el error coincide con una confusión conocida? Eso es lo que hace diagnóstico a
    # un grader determinista, en vez de un simple corrector.
    for expr, mid in (q.diagnostico_si_falla or {}).items():
        if not isinstance(expr, str) or not mid:
            continue
        try:
            alt = eval_expr(expr, _params(e))
        except ValueError:
            continue
        if abs(dado - alt) <= tol:
            return Veredicto(False, 0.0, misconception_id=mid, esperado=esperado,
                             detalle={"coincide_con": expr})
    return Veredicto(False, 0.0, esperado=esperado)


# --- opción múltiple --------------------------------------------------------

def grade_mcq(q: Question, indice: int) -> Veredicto:
    ops = q.opciones or []
    if not isinstance(indice, int) or not 0 <= indice < len(ops):
        return Veredicto(False, 0.0, detalle={"error": "índice fuera de rango"})
    elegida = ops[indice]
    correcto = next(i for i, o in enumerate(ops) if o.correcta)
    if elegida.correcta:
        return Veredicto(True, 1.0, esperado=correcto)
    # cada distractor está mapeado a la confusión que delata
    return Veredicto(False, 0.0, misconception_id=elegida.misconception, esperado=correcto)


# --- manipulación del gráfico ----------------------------------------------

def grade_manip(q: Question, dado: dict, e: Ejemplo) -> Veredicto:
    """El cliente manda la recta que construyó el estudiante; aquí se decide.

    El diagnóstico es DIRECCIONAL: no basta con decir "está mal", hay que distinguir
    si rotó cuando debía desplazar (BL-M2) o desplazó cuando debía rotar (BL-M3).
    """
    v = q.verificacion or {}
    diag = q.diagnostico_si_falla or {}
    p = _params(e)

    if v.get("tipo") == "region":
        x1, x2 = float(dado.get("x1", 0)), float(dado.get("x2", 0))
        gasto = e.p1 * x1 + e.p2 * x2
        margen = float(v.get("margen", 2.0))
        if gasto < e.m - margen:
            return Veredicto(True, 1.0, detalle={"gasto": gasto})
        if abs(gasto - e.m) <= margen:
            return Veredicto(False, 0.0, misconception_id=diag.get("sobre_la_recta"),
                             detalle={"gasto": gasto, "por_que": "quedó sobre la recta"})
        return Veredicto(False, 0.0, detalle={"gasto": gasto, "por_que": "no es alcanzable"})

    # tipo recta: se comparan pendiente e intercepto por separado, y la combinación de
    # cuál falla es lo que identifica la confusión
    pend_dada = -float(dado["p1"]) / float(dado["p2"])
    int_dado = float(dado["m"]) / float(dado["p2"])

    pend_esp = _num(v.get("pendiente_esperada"), p)
    int_esp = _num(v.get("intercepto_x2_esperado"), p)
    tol_p = float(v.get("tolerancia_pendiente", 0.10))
    tol_i = float(v.get("tolerancia_intercepto", 3.0))

    pend_ok = abs(pend_dada - pend_esp) <= abs(pend_esp) * tol_p
    int_ok = abs(int_dado - int_esp) <= tol_i

    if pend_ok and int_ok:
        return Veredicto(True, 1.0)

    detalle = {"pendiente": [pend_dada, pend_esp], "intercepto_x2": [int_dado, int_esp]}
    if not pend_ok and int_ok:
        # cambió la pendiente cuando no debía: giró en vez de desplazar
        return Veredicto(False, 0.0, misconception_id=diag.get("pendiente_cambio"),
                         detalle=detalle | {"por_que": "giró cuando debía desplazar"})
    if pend_ok and not int_ok:
        return Veredicto(False, 0.0, misconception_id=diag.get("intercepto_x2_cambio"),
                         detalle=detalle | {"por_que": "movió el intercepto que no cambia"})
    return Veredicto(False, 0.0, misconception_id=diag.get("desplazamiento_paralelo"),
                     detalle=detalle | {"por_que": "pendiente e intercepto mal"})


def _num(v: Any, params: dict[str, float]) -> float:
    return eval_expr(v, params) if isinstance(v, str) else float(v)


# --- despacho ---------------------------------------------------------------

def grade(q: Question, valor: Any, e: Ejemplo) -> Veredicto:
    if q.modalidad == "numeric":
        return grade_numeric(q, valor, e)
    if q.modalidad == "mcq":
        return grade_mcq(q, valor)
    if q.modalidad == "manip":
        return grade_manip(q, valor, e)
    raise ValueError(f"{q.id}: modalidad {q.modalidad} no es determinista")
