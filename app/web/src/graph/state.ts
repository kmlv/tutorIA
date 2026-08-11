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
import { aplicarOps, type GraphScript } from "./script.js";   // con extensión: el test corre el JS compilado bajo node ESM, que la exige

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

/**
 * Aplica un cue leyendo el guion del gráfico (decisión D-3).
 *
 * Antes esto era un `switch` con una rama por cue: añadir un concepto exigía escribir
 * TypeScript, que es exactamente lo que hace caro el concepto número veinte. Ahora el
 * documento es datos —`content/packs/<id>/graph.yaml`— y lo emite un modelo contra el
 * esquema de `script.ts`.
 *
 * Un cue sin entrada no cambia nada, que es lo correcto para los que solo narran. Que no
 * sea un error es deliberado: el error ruidoso lo levanta `pipeline/check_cues.py` cuando
 * un cue de la timeline no tiene efecto EN NINGÚN sitio, que es el caso peligroso.
 */
export function aplicarCue(s: GraphState, id: string, e: Ejemplo,
                           script: GraphScript): GraphState {
  const ops = script.cues[id];
  return ops ? aplicarOps(s, ops, e) : s;
}
