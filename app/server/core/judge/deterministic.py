"""Deterministic graders: numeric, multiple choice and graph manipulation.

Deterministic-first (C7): the LLM only judges open responses, and that arrives in M3.
No model is invoked here. These three graders carry the mastery criterion, because the
LLM judge contributes at most 1 of the 3 required pieces of evidence.

*(Minor deviation from PLAN §2.3, which listed `grader_numeric.py`, `grader_mcq.py` and
`grader_manip.py` separately: they share the expression evaluator and add up to under
300 lines. `grader_open.py` will be separate — it has a provider, a versioned prompt
and a shadow mode.)*

Hardened after codex's T-005 review, which found four blockers. Each fix is marked
`codex T-005` where it lives.
"""
from __future__ import annotations

import ast
import math
import operator
from dataclasses import dataclass, field
from typing import Any

from ..content.schema import Ejemplo, Question

# Pow is deliberately absent: no expression in the bank uses it, and `2 ** 1000000000`
# hangs or raises OverflowError. codex T-005.
_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.USub: operator.neg, ast.UAdd: operator.pos,
}

MAX_EXPR_LEN = 200
MAX_NODES = 60


class ExpressionError(ValueError):
    """Any failure evaluating a content expression, normalised to one type so a poison
    expression can never surface as a 500 to a student. codex T-005."""


def eval_expr(expr: str, params: dict[str, float]) -> float:
    """Evaluates `m / p2`, `-p1 / p2`, `(m - p1*12) / p2`.

    `ast` with an operator allowlist rather than `eval`: these expressions come from
    content files that an LLM may one day emit, so they must not be arbitrary code.
    """
    if not isinstance(expr, str) or len(expr) > MAX_EXPR_LEN:
        raise ExpressionError(f"expression too long or not a string: {expr!r:.60}")

    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise ExpressionError(f"cannot parse {expr!r}: {e}") from e

    if sum(1 for _ in ast.walk(tree)) > MAX_NODES:
        raise ExpressionError(f"expression too complex: {expr!r}")

    def walk(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return walk(node.body)
        if isinstance(node, ast.Constant):
            # bool is a subclass of int, so `True` would silently evaluate to 1.0
            if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
                raise ExpressionError(f"constant not allowed: {node.value!r}")
            if not math.isfinite(node.value):
                raise ExpressionError(f"non-finite constant: {node.value!r}")
            return float(node.value)
        if isinstance(node, ast.Name):
            if node.id not in params:
                raise ExpressionError(f"unknown variable: {node.id}")
            return float(params[node.id])
        if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](walk(node.left), walk(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](walk(node.operand))
        raise ExpressionError(f"expression not allowed: {type(node).__name__}")

    try:
        out = walk(tree)
    except ExpressionError:
        raise
    except (ZeroDivisionError, OverflowError, ArithmeticError) as e:
        raise ExpressionError(f"arithmetic failure in {expr!r}: {e}") from e

    if not math.isfinite(out):
        raise ExpressionError(f"non-finite result in {expr!r}")
    return out


@dataclass
class Veredicto:
    correcta: bool
    score: float
    misconception_id: str | None = None
    esperado: Any = None
    invalida: bool = False
    detalle: dict = field(default_factory=dict)


def _params(e: Ejemplo) -> dict[str, float]:
    return {"p1": e.p1, "p2": e.p2, "m": e.m}


def _finite(v: Any) -> float | None:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


# --- numeric ----------------------------------------------------------------

def grade_numeric(q: Question, raw: Any, e: Ejemplo) -> Veredicto:
    dado = _finite(str(raw).replace(",", ".").strip() if raw is not None else None)
    if dado is None:
        return Veredicto(False, 0.0, invalida=True, detalle={"error": "not a number"})

    spec = q.respuesta or {}
    esperado = eval_expr(spec["expr"], _params(e))
    tol = float(spec.get("tolerancia", 0.01))
    if abs(dado - esperado) <= tol:
        return Veredicto(True, 1.0, esperado=esperado)

    # Does the error match a known confusion? That is what makes a deterministic grader
    # diagnostic rather than a mere marker.
    for expr, mid in (q.diagnostico_si_falla or {}).items():
        if not isinstance(expr, str) or not mid:
            continue
        try:
            alt = eval_expr(expr, _params(e))
        except ExpressionError:
            continue
        if abs(alt - esperado) <= tol:
            continue  # ambiguous with the correct answer: claiming a diagnosis would lie
        if abs(dado - alt) <= tol:
            return Veredicto(False, 0.0, misconception_id=mid, esperado=esperado,
                             detalle={"matches": expr})
    return Veredicto(False, 0.0, esperado=esperado)


# --- multiple choice --------------------------------------------------------

def grade_mcq(q: Question, indice: Any) -> Veredicto:
    ops = q.opciones or []
    if isinstance(indice, bool) or not isinstance(indice, int) or not 0 <= indice < len(ops):
        return Veredicto(False, 0.0, invalida=True, detalle={"error": "index out of range"})
    elegida = ops[indice]
    correcto = next(i for i, o in enumerate(ops) if o.correcta)
    if elegida.correcta:
        return Veredicto(True, 1.0, esperado=correcto)
    return Veredicto(False, 0.0, misconception_id=elegida.misconception, esperado=correcto)


# --- graph manipulation -----------------------------------------------------

def grade_manip(q: Question, dado: Any, e: Ejemplo) -> Veredicto:
    """The client sends the line or point the student built; the verdict is decided here.

    The diagnosis compares the submission against BOTH the original line and the target,
    because "wrong" alone does not identify a misconception. A misconception id is only
    claimed when the submission matches that misconception's *signature*:

        BL-M2  rotated when it should have shifted  -> intercepts moved AND slope changed
        BL-M3  shifted when it should have pivoted  -> slope kept AND the fixed intercept moved

    Anything else is simply incorrect, with no id. Naming a confusion the student did not
    show is worse than naming none: it feeds a false diagnosis into mastery. codex T-005.
    """
    if not isinstance(dado, dict):
        return Veredicto(False, 0.0, invalida=True, detalle={"error": "expected an object"})

    v = q.verificacion or {}
    diag = q.diagnostico_si_falla or {}
    p = _params(e)

    if v.get("tipo") == "region":
        if "x1" not in dado or "x2" not in dado:
            return Veredicto(False, 0.0, invalida=True, detalle={"error": "x1 and x2 required"})
        x1, x2 = _finite(dado["x1"]), _finite(dado["x2"])
        if x1 is None or x2 is None or x1 < 0 or x2 < 0:
            return Veredicto(False, 0.0, invalida=True,
                             detalle={"error": "quantities must be finite and >= 0"})
        gasto = e.p1 * x1 + e.p2 * x2
        margen = float(v.get("margen", 2.0))
        if gasto < e.m - margen:
            return Veredicto(True, 1.0, detalle={"spend": gasto})
        if abs(gasto - e.m) <= margen:
            return Veredicto(False, 0.0, misconception_id=diag.get("sobre_la_recta"),
                             detalle={"spend": gasto, "why": "landed on the line"})
        return Veredicto(False, 0.0, detalle={"spend": gasto, "why": "not affordable"})

    # --- line ---------------------------------------------------------------
    for k in ("p1", "p2", "m"):
        if k not in dado:
            return Veredicto(False, 0.0, invalida=True, detalle={"error": f"{k} required"})
    sp1, sp2, sm = _finite(dado["p1"]), _finite(dado["p2"]), _finite(dado["m"])
    if None in (sp1, sp2, sm) or sp1 <= 0 or sp2 <= 0 or sm <= 0:
        return Veredicto(False, 0.0, invalida=True,
                         detalle={"error": "prices and income must be finite and > 0"})

    sub_slope = -sp1 / sp2
    sub_int_x2 = sm / sp2

    try:
        tgt_slope = _num(v.get("pendiente_esperada"), p)
        tgt_int_x2 = _num(v.get("intercepto_x2_esperado"), p)
    except ExpressionError as err:
        return Veredicto(False, 0.0, invalida=True, detalle={"error": str(err)})

    tol_p = float(v.get("tolerancia_pendiente", 0.10))
    tol_i = float(v.get("tolerancia_intercepto", 3.0))

    def slope_eq(a: float, b: float) -> bool:
        return abs(a - b) <= abs(b) * tol_p
    def int_eq(a: float, b: float) -> bool:
        return abs(a - b) <= tol_i

    if slope_eq(sub_slope, tgt_slope) and int_eq(sub_int_x2, tgt_int_x2):
        return Veredicto(True, 1.0)

    orig_slope = -e.p1 / e.p2
    orig_int_x2 = e.m / e.p2
    # what the item asks for: if the target keeps the original slope it is a shift
    task_is_shift = slope_eq(tgt_slope, orig_slope)

    kept_slope = slope_eq(sub_slope, orig_slope)
    kept_int_x2 = int_eq(sub_int_x2, orig_int_x2)

    detalle = {
        "slope": [sub_slope, tgt_slope, orig_slope],
        "intercept_x2": [sub_int_x2, tgt_int_x2, orig_int_x2],
        "task": "shift" if task_is_shift else "pivot",
    }

    if task_is_shift and not kept_slope:
        # asked to shift, changed the slope: that IS the signature of BL-M2
        return Veredicto(False, 0.0, misconception_id=diag.get("pendiente_cambio"),
                         detalle=detalle | {"why": "rotated when it should have shifted"})
    if not task_is_shift and kept_slope and not kept_int_x2:
        # asked to pivot, kept the slope and moved the fixed intercept: BL-M3
        mid = diag.get("desplazamiento_paralelo") or diag.get("intercepto_x2_cambio")
        return Veredicto(False, 0.0, misconception_id=mid,
                         detalle=detalle | {"why": "shifted when it should have pivoted"})
    if not task_is_shift and slope_eq(sub_slope, tgt_slope) and not kept_int_x2:
        # got the pivot right but moved the anchor that must stay put
        return Veredicto(False, 0.0, misconception_id=diag.get("intercepto_x2_cambio"),
                         detalle=detalle | {"why": "moved the intercept that does not change"})

    return Veredicto(False, 0.0, detalle=detalle | {"why": "does not match the target line"})


def _num(v: Any, params: dict[str, float]) -> float:
    if isinstance(v, str):
        return eval_expr(v, params)
    f = _finite(v)
    if f is None:
        raise ExpressionError(f"invalid expected value: {v!r}")
    return f


# --- dispatch ---------------------------------------------------------------

def grade(q: Question, valor: Any, e: Ejemplo) -> Veredicto:
    if q.modalidad == "numeric":
        return grade_numeric(q, valor, e)
    if q.modalidad == "mcq":
        return grade_mcq(q, valor)
    if q.modalidad == "manip":
        return grade_manip(q, valor, e)
    raise ValueError(f"{q.id}: modality {q.modalidad} is not deterministic")
