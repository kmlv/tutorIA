# -*- coding: utf-8 -*-
"""Seed budget line slides for topic ID 3."""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, ".")

from core.database import SessionLocal
from core.models import Slide

TOPIC_ID = 3

SLIDES = [
    {
        "type": "text",
        "order": 1,
        "content": (
            "# La restriccion presupuestaria\n\n"
            "Cuando un consumidor decide que comprar, no puede gastar mas de lo que tiene. "
            "La **restriccion presupuestaria** es la frontera entre lo que puede pagar y lo que no.\n\n"
            "Imagina que tienes un ingreso de $m = 100$ y quieres comprar dos bienes: "
            "pizza (bien 1) y refresco (bien 2). "
            "Si la pizza cuesta $p_1 = 10$ y el refresco $p_2 = 5$, "
            "cuantas unidades de cada uno puedes comprar como maximo?"
        ),
    },
    {
        "type": "text",
        "order": 2,
        "content": (
            "# La ecuacion\n\n"
            "Todo lo que gastes en ambos bienes no puede superar tu ingreso:\n\n"
            "$$p_1 x_1 + p_2 x_2 = m$$\n\n"
            "Donde $p_1$ y $p_2$ son los precios de cada bien, "
            "$x_1$ y $x_2$ son las cantidades que compras, "
            "y $m$ es tu ingreso total.\n\n"
            "Con el ejemplo: $10 x_1 + 5 x_2 = 100$\n\n"
            "Esta ecuacion describe todos los puntos donde gastas exactamente tu ingreso. "
            "Los puntos debajo de esta linea tambien son alcanzables."
        ),
    },
    {
        "type": "graph",
        "order": 3,
        "content": '{"type":"budget_line","m":100,"p1":10,"p2":5,"interactive":true}',
    },
    {
        "type": "text",
        "order": 4,
        "content": (
            "# Los interceptos: los casos extremos\n\n"
            "Si gastas TODO en el bien 1 (cuando $x_2 = 0$):\n\n"
            "$$x_1 = \\frac{m}{p_1} = \\frac{100}{10} = 10$$\n\n"
            "Si gastas TODO en el bien 2 (cuando $x_1 = 0$):\n\n"
            "$$x_2 = \\frac{m}{p_2} = \\frac{100}{5} = 20$$\n\n"
            "Estos son los puntos donde la recta toca cada eje. "
            "El intercepto del eje x es siempre $\\frac{m}{p_1}$, "
            "y el del eje y es siempre $\\frac{m}{p_2}$."
        ),
    },
    {
        "type": "text",
        "order": 5,
        "content": (
            "# La pendiente: el precio relativo\n\n"
            "La pendiente de la recta presupuestaria es $-\\frac{p_1}{p_2}$.\n\n"
            "Con el ejemplo: $-\\frac{10}{5} = -2$\n\n"
            "Por cada pizza adicional que compras, debes sacrificar **2 refrescos**. "
            "La pendiente mide el **costo de oportunidad** del bien 1 en terminos del bien 2.\n\n"
            "Importante: la pendiente depende solo de los precios, no del ingreso. "
            "Si el ingreso cambia, la recta se desplaza pero **NO rota**."
        ),
    },
    {
        "type": "graph",
        "order": 6,
        "content": '{"type":"budget_line_shift","m1":100,"m2":150,"p1":10,"p2":5}',
    },
    {
        "type": "graph",
        "order": 7,
        "content": '{"type":"budget_line_pivot","m":100,"p1_old":10,"p1_new":5,"p2":5}',
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Slide).filter(Slide.topic_id == TOPIC_ID).count()
        if existing > 0:
            print(f"Eliminando {existing} slides existentes...")
            db.query(Slide).filter(Slide.topic_id == TOPIC_ID).delete()
            db.commit()
        for s in SLIDES:
            db.add(Slide(topic_id=TOPIC_ID, type=s["type"], content=s["content"], order=s["order"]))
        db.commit()
        print(f"OK: {len(SLIDES)} slides sembrados para topic_id={TOPIC_ID}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
