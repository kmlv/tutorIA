BUDGET_LINE = {
    "keywords": ["presupuest", "budget line", "budget set", "restriccion presupuestaria"],
    "subskills": [
        {"code": "BL.EQ",    "title": "Plantear la ecuación p₁x₁ + p₂x₂ = m e interpretar cada término", "order": 1},
        {"code": "BL.INT",   "title": "Calcular los interceptos m/p₁ y m/p₂",                            "order": 2},
        {"code": "BL.SLOPE", "title": "Interpretar la pendiente −p₁/p₂ como precio relativo",            "order": 3},
        {"code": "BL.FEAS",  "title": "Distinguir puntos factibles, frontera e infactibles",             "order": 4},
        {"code": "BL.CS.M",  "title": "Predecir el efecto de un cambio en el ingreso m",                 "order": 5},
        {"code": "BL.CS.P",  "title": "Predecir el efecto de un cambio en un precio p₁ o p₂",           "order": 6},
    ],
    "misconceptions": [
        {
            "code": "BL-M1",
            "name": "Pendiente invertida",
            "signal": "El alumno escribe p₂/p₁ en vez de −p₁/p₂ como pendiente",
            "socratic_probe": "Si p₁ sube y p₂ no cambia, ¿cuántas unidades del bien 2 obtienes por cada unidad del bien 1 que sacrificas?",
            "alt_representation": "Usa números: p₁=10, p₂=5, m=100. Intercepto eje x: 100/10=10. Intercepto eje y: 100/5=20. Pendiente = −(20−0)/(10−0) = −2 = −p₁/p₂, no p₂/p₁",
        },
        {
            "code": "BL-M2",
            "name": "Δm cambia la pendiente",
            "signal": "El alumno dice que si sube el ingreso la recta se hace más empinada o cambia de inclinación",
            "socratic_probe": "Si duplicas tu presupuesto pero los precios no cambian, ¿se hace más caro el bien 1 relativo al bien 2?",
            "alt_representation": "Grafica dos rectas con m=100 y m=200, mismos precios. Son paralelas — la pendiente −p₁/p₂ no depende de m para nada",
        },
        {
            "code": "BL-M3",
            "name": "Δp₁ mueve el intercepto equivocado",
            "signal": "El alumno dice que si sube p₁ también cambia el intercepto en el eje del bien 2",
            "socratic_probe": "Si el precio del bien 1 sube pero tienes el mismo ingreso, ¿cuánto puedes comprar del bien 2 si gastas todo en él?",
            "alt_representation": "El intercepto del eje y es m/p₂. No tiene p₁ en ningún lado. Solo cambia si cambia m o p₂",
        },
        {
            "code": "BL-M4",
            "name": "Confunde línea con conjunto factible",
            "signal": "El alumno dice que solo puede elegir puntos sobre la línea, no debajo de ella",
            "socratic_probe": "Con m=100, p₁=10, p₂=5: ¿puedes comprar x₁=3, x₂=4? Calcula cuánto gastas.",
            "alt_representation": "El conjunto factible es la región triangular bajo la recta. Gastar menos de m también es posible — la línea es solo la frontera",
        },
        {
            "code": "BL-M5",
            "name": "Pendiente positiva",
            "signal": "El alumno dibuja o describe una recta presupuestaria con pendiente positiva",
            "socratic_probe": "Si compras más del bien 1, ¿qué le pasa al dinero disponible para comprar el bien 2?",
            "alt_representation": "Despeja: x₂ = m/p₂ − (p₁/p₂)x₁. El coeficiente de x₁ es −(p₁/p₂), siempre negativo porque p₁>0 y p₂>0",
        },
        {
            "code": "BL-M6",
            "name": "Interceptos intercambiados",
            "signal": "El alumno pone m/p₂ en el eje x y m/p₁ en el eje y",
            "socratic_probe": "Si gastas todo tu ingreso en el bien 1 y compras cero del bien 2, ¿en qué eje vive ese punto?",
            "alt_representation": "El eje x mide el bien 1. Si x₂=0: p₁x₁=m, así x₁=m/p₁. Ese es el intercepto del eje x. El eje y mide bien 2, su intercepto es m/p₂",
        },
        {
            "code": "BL-M7",
            "name": "Factible equivale a óptimo",
            "signal": "El alumno confunde cualquier punto en la restricción presupuestaria con el mejor punto posible",
            "socratic_probe": "Tienes dos canastas factibles: A=(5,10) y B=(8,6). ¿Te da exactamente igual cuál elegir?",
            "alt_representation": "La restricción presupuestaria solo dice qué puedes pagar. Qué prefieres depende de tus gustos — eso lo modela la curva de indiferencia, no la recta presupuestaria",
        },
    ],
}

PACKS = [BUDGET_LINE]


def match_pack(topic_title: str) -> dict | None:
    title_lower = topic_title.lower()
    for pack in PACKS:
        if any(kw in title_lower for kw in pack["keywords"]):
            return pack
    return None
