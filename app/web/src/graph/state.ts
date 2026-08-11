/**
 * The lesson's state machine: what the script says the picture shows at each cue.
 *
 * It lives apart from `budget_graph.ts` and touches no DOM on purpose. Option B of the
 * bake-off pre-renders the same lesson to MP4, and its frames have to come from THIS
 * function, not from a transcription of it.
 *
 * That is not tidiness. If option B re-implemented the beats by hand, the bake-off would
 * measure my transcription instead of the technology: criterion 2 asks what happens when
 * you change `m` or a price, and a hand-typed copy answers "nothing, until someone edits
 * the copy" — which says nothing about Remotion. Sharing the module also keeps criterion
 * 4 honest in the other direction: whatever B costs to maintain, it is not paying for a
 * second copy of the script.
 *
 * Pure and DOM-free means it runs in node, which is how `pipeline/render_b.py` folds the
 * timeline into per-cue props without a browser.
 */
import type { Ejemplo, GraphState } from "../types";

export function estadoInicial(e: Ejemplo): GraphState {
  return {
    p1: e.p1,
    p2: e.p2,
    m: e.m,
    mostrar: { ejes: false, linea: false, interceptos: false, conjunto: false, pendiente: false },
    fantasma: null,
    destacar: "ninguno",
    // Placeholders: the fields exist so the type is stable, but nothing draws them yet.
    // The display design consult (T-010) decides what they become; until then they are
    // inert rather than half-implemented.
    muestras: [],
    enfasis: "ninguno",
  };
}

/** The script is in charge: every cue has a declared effect on the graph. */
export function aplicarCue(s: GraphState, id: string, e: Ejemplo): GraphState {
  const n: GraphState = { ...s, mostrar: { ...s.mostrar } };
  switch (id) {
    case "espacio":      n.mostrar.ejes = true; break;
    case "budget_set":   n.mostrar.linea = true; n.mostrar.conjunto = true; break;
    case "budget_line":  n.mostrar.linea = true; break;
    case "intercepts":   n.mostrar.interceptos = true; break;
    case "slope":        n.mostrar.pendiente = true; n.destacar = "pendiente"; break;
    case "income_shift":
      n.fantasma = { p1: e.p1, p2: e.p2, m: e.m };
      n.m = e.m * 1.5;
      n.destacar = "ninguno";
      break;
    case "price_pivot":
      n.m = e.m;
      n.fantasma = { p1: e.p1, p2: e.p2, m: e.m };
      n.p1 = e.p1 + 1;
      n.destacar = "intercepto_x2";  // the one that does NOT move: that is the point
      break;
    case "recap":
      n.fantasma = null;
      n.p1 = e.p1;
      n.m = e.m;
      n.destacar = "ninguno";
      break;
  }
  return n;
}
