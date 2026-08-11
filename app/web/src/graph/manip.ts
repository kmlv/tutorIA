import type { BudgetGraph } from "./budget_graph";
import type { GraphState } from "../types";

export type DragResultPoint = { x1: number; x2: number };
export type DragResultLine = { p1: number; p2: number; m: number };
export type DragResult = DragResultPoint | DragResultLine;

export function enableDrag(
  graph: BudgetGraph,
  initialState: GraphState,
  mode: "point" | "line",
  onChange: (res: DragResult) => void
): () => void {
  const svg = graph.svgElement;
  let active = true;
  let rafId: number | null = null;

  const manipLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  manipLayer.setAttribute("class", "capa-manip");
  svg.appendChild(manipLayer);

  // Focusable element for keyboard
  const focusEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  focusEl.setAttribute("width", "100%");
  focusEl.setAttribute("height", "100%");
  focusEl.setAttribute("fill", "transparent");
  focusEl.setAttribute("tabindex", "0");
  focusEl.setAttribute("role", "slider");
  focusEl.style.outline = "none";
  manipLayer.appendChild(focusEl);

  let currentTarget: "point" | "x" | "y" | null = null;

  let state = {
    m: initialState.m,
    p1: initialState.p1,
    p2: initialState.p2,
    pointX: initialState.m / initialState.p1 / 2,
    pointY: initialState.m / initialState.p2 / 2,
  };

  let pointEl: SVGCircleElement | null = null;
  let hitX: SVGCircleElement | null = null;
  let hitY: SVGCircleElement | null = null;
  /** Cada objetivo de agarre con su anillo visible, para moverlos juntos. */
  const rings: Array<[SVGCircleElement, SVGCircleElement]> = [];

  function updateAria() {
    if (mode === "point") {
      const prefix = graph.lang === "en" ? "Selected point at" : "Punto seleccionado en";
      svg.setAttribute("aria-label", `${prefix} ${state.pointX.toFixed(1)}, ${state.pointY.toFixed(1)}`);
    } else {
      svg.setAttribute("aria-label", graph.descripcion({ ...initialState, p1: state.p1, p2: state.p2, m: state.m }));
    }
  }

  function report() {
    if (mode === "point") {
      onChange({ x1: state.pointX, x2: state.pointY });
    } else {
      onChange({ p1: state.p1, p2: state.p2, m: state.m });
    }
  }

  function renderDOM() {
    if (mode === "point" && pointEl) {
      pointEl.setAttribute("cx", String(graph.x(state.pointX)));
      pointEl.setAttribute("cy", String(graph.y(state.pointY)));
    } else if (mode === "line") {
      const x0 = state.m / state.p1;
      const y0 = state.m / state.p2;
      const xPx = graph.x(x0);
      const yPx = graph.y(y0);
      const originXPx = graph.x(0);
      const originYPx = graph.y(0);

      const linea = svg.querySelector('.capa-linea .recta.linea');
      if (linea) {
        linea.setAttribute('x2', String(xPx));
        linea.setAttribute('y1', String(yPx));
      }
      const conjunto = svg.querySelector('.capa-conjunto .conjunto');
      if (conjunto) {
        conjunto.setAttribute('points', `${originXPx},${originYPx} ${originXPx},${yPx} ${xPx},${originYPx}`);
      }

      const circles = svg.querySelectorAll('.capa-interceptos circle');
      if (circles.length >= 2) {
        circles[0].setAttribute('cx', String(xPx));
        circles[1].setAttribute('cy', String(yPx));
      }
      const texts = svg.querySelectorAll('.capa-interceptos text');
      if (texts.length >= 2) {
        texts[0].setAttribute('x', String(xPx));
        texts[0].textContent = x0.toFixed(1);
        texts[1].setAttribute('y', String(yPx));
        texts[1].textContent = y0.toFixed(0);
      }

      // AMBAS coordenadas. Antes solo se fijaba una de las dos, así que `hitX` se
      // quedaba en cy=0 y `hitY` en cx=0: los tiradores vivían pegados al borde
      // superior y al izquierdo, a cientos de píxeles de los extremos que el alumno ve.
      // Como son transparentes, no se notaba mirando — solo intentando arrastrar.
      if (hitX) {
        hitX.setAttribute('cx', String(xPx));
        hitX.setAttribute('cy', String(originYPx));
      }
      if (hitY) {
        hitY.setAttribute('cx', String(originXPx));
        hitY.setAttribute('cy', String(yPx));
      }
    }
    for (const [target, ring] of rings) {
      ring.setAttribute("cx", target.getAttribute("cx") ?? "0");
      ring.setAttribute("cy", target.getAttribute("cy") ?? "0");
    }
    updateAria();
    rafId = null;
  }

  function scheduleRender() {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        renderDOM();
        report();
      });
    }
  }

  /** Área de agarre generosa (20 px de radio, muy por encima del mínimo táctil) con un
   *  anillo visible encima. Un objetivo invisible no es una afordancia: el alumno no
   *  tiene forma de saber que ese punto se puede arrastrar, ni de saber que falló por
   *  apuntar mal y no por estar equivocado. */
  function createHitTarget(cursor: string): SVGCircleElement {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("r", "9");
    ring.setAttribute("class", "tirador");
    ring.setAttribute("pointer-events", "none");
    manipLayer.appendChild(ring);

    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("r", "20");
    el.setAttribute("fill", "transparent");
    el.setAttribute("cursor", cursor);
    manipLayer.appendChild(el);
    rings.push([el, ring]);
    return el;
  }

  if (mode === "point") {
    pointEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pointEl.setAttribute("r", "7");
    pointEl.setAttribute("fill", "#007bff");
    pointEl.setAttribute("cursor", "grab");
    pointEl.setAttribute("class", "punto-manip");
    manipLayer.appendChild(pointEl);
  } else {
    hitX = createHitTarget("ew-resize");
    hitY = createHitTarget("ns-resize");
  }

  renderDOM(); // Initial render

  // Pointer Events
  function onPointerDown(e: PointerEvent) {
    if (!active) return;
    if (e.target === pointEl) {
      currentTarget = "point";
      pointEl?.setAttribute("cursor", "grabbing");
    } else if (e.target === hitX) {
      currentTarget = "x";
    } else if (e.target === hitY) {
      currentTarget = "y";
    } else {
      return;
    }
    focusEl.focus();
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (!active || !currentTarget) return;
    const pt = new DOMPoint(e.clientX, e.clientY);
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    if (currentTarget === "point") {
      state.pointX = Math.max(0, graph.invX(svgP.x));
      state.pointY = Math.max(0, graph.invY(svgP.y));
    } else if (currentTarget === "x") {
      const newX = Math.max(0.1, graph.invX(svgP.x));
      state.p1 = state.m / newX;
    } else if (currentTarget === "y") {
      const newY = Math.max(0.1, graph.invY(svgP.y));
      state.p2 = state.m / newY;
    }
    scheduleRender();
  }

  function onPointerUp(e: PointerEvent) {
    if (!active || !currentTarget) return;
    svg.releasePointerCapture(e.pointerId);
    currentTarget = null;
    if (pointEl) pointEl.setAttribute("cursor", "grab");
    report(); // Final report
  }

  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", onPointerUp);
  svg.addEventListener("pointercancel", onPointerUp);

  // Keyboard Events
  function onKeyDown(e: KeyboardEvent) {
    if (!active) return;
    
    const step = e.shiftKey ? 0.1 : 1.0;
    let changed = false;

    if (mode === "point") {
      if (e.key === "ArrowRight") { state.pointX += step; changed = true; }
      else if (e.key === "ArrowLeft") { state.pointX = Math.max(0, state.pointX - step); changed = true; }
      else if (e.key === "ArrowUp") { state.pointY += step; changed = true; }
      else if (e.key === "ArrowDown") { state.pointY = Math.max(0, state.pointY - step); changed = true; }
    } else if (mode === "line") {
      // Allow modifying both depending on which one was recently touched?
      // For accessibility, maybe ArrowRight/Left changes X intercept, ArrowUp/Down changes Y intercept
      if (e.key === "ArrowRight") {
        const x = state.m / state.p1 + step;
        state.p1 = state.m / x;
        changed = true;
      } else if (e.key === "ArrowLeft") {
        const x = Math.max(0.1, state.m / state.p1 - step);
        state.p1 = state.m / x;
        changed = true;
      } else if (e.key === "ArrowUp") {
        const y = state.m / state.p2 + step;
        state.p2 = state.m / y;
        changed = true;
      } else if (e.key === "ArrowDown") {
        const y = Math.max(0.1, state.m / state.p2 - step);
        state.p2 = state.m / y;
        changed = true;
      }
    }

    if (changed) {
      e.preventDefault();
      scheduleRender();
    }
  }

  focusEl.addEventListener("keydown", onKeyDown);

  return () => {
    active = false;
    svg.removeEventListener("pointerdown", onPointerDown);
    svg.removeEventListener("pointermove", onPointerMove);
    svg.removeEventListener("pointerup", onPointerUp);
    svg.removeEventListener("pointercancel", onPointerUp);
    if (rafId !== null) cancelAnimationFrame(rafId);
    manipLayer.remove();
  };
}
