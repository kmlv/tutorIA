/**
 * Gráfico de la línea presupuestaria en SVG.
 *
 * SVG y no canvas por dos razones del plan: el texto queda en el DOM y por tanto es
 * legible por lectores de pantalla (decisión 22), y animar `transform`/`opacity` en
 * SVG no repinta el layout, que es lo que protege el criterio 5 en CPUs débiles.
 */
import type { Ejemplo, GraphState } from "../types";
import "./graph.css";

// La máquina de estados vive en `state.ts` porque tiene que poder correr sin DOM: la
// opción B del bake-off la ejecuta en node para generar sus fotogramas. Se reexporta
// aquí para que quien ya la importaba de este módulo no cambie.
export { estadoInicial, aplicarCue } from "./state";

const NS = "http://www.w3.org/2000/svg";
const W = 560;
const H = 460;
const PAD = { l: 62, r: 28, t: 34, b: 64 };

export class BudgetGraph {
  private svg: SVGSVGElement;
  private capas: Record<string, SVGGElement> = {};
  /** Escala fija: si los ejes se reescalaran al cambiar m, el desplazamiento paralelo
   *  se vería igual que un pivote y el concepto se perdería. */
  private maxX: number;
  private maxY: number;
  public readonly lang: "es" | "en";

  constructor(host: HTMLElement, private ejemplo: Ejemplo, lang: "es" | "en") {
    this.lang = lang;
    this.maxX = (ejemplo.m / ejemplo.p1) * 1.6;
    this.maxY = (ejemplo.m / ejemplo.p2) * 1.6;

    this.svg = document.createElementNS(NS, "svg");
    this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("class", "bgraph");
    host.appendChild(this.svg);

    // Defs para los marcadores de forma de los bienes
    const defs = document.createElementNS(NS, "defs");
    this.svg.appendChild(defs);

    const m1 = document.createElementNS(NS, "marker");
    m1.setAttribute("id", "marker-good1");
    m1.setAttribute("markerWidth", "6");
    m1.setAttribute("markerHeight", "6");
    m1.setAttribute("refX", "3");
    m1.setAttribute("refY", "3");
    const c1 = document.createElementNS(NS, "circle");
    c1.setAttribute("cx", "3"); c1.setAttribute("cy", "3"); c1.setAttribute("r", "3");
    c1.setAttribute("class", "marker good1");
    m1.appendChild(c1);
    defs.appendChild(m1);

    const m2 = document.createElementNS(NS, "marker");
    m2.setAttribute("id", "marker-good2");
    m2.setAttribute("markerWidth", "6");
    m2.setAttribute("markerHeight", "6");
    m2.setAttribute("refX", "3");
    m2.setAttribute("refY", "3");
    const r2 = document.createElementNS(NS, "rect");
    r2.setAttribute("x", "0"); r2.setAttribute("y", "0");
    r2.setAttribute("width", "6"); r2.setAttribute("height", "6");
    r2.setAttribute("class", "marker good2");
    m2.appendChild(r2);
    defs.appendChild(m2);

    for (const c of ["ejes", "conjunto", "fantasma", "linea", "interceptos", "etiquetas"]) {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", `capa-${c}`);
      this.svg.appendChild(g);
      this.capas[c] = g;
    }
  }

  public invX(svgX: number): number {
    return ((svgX - PAD.l) / (W - PAD.l - PAD.r)) * this.maxX;
  }
  public invY(svgY: number): number {
    return ((H - PAD.b - svgY) / (H - PAD.t - PAD.b)) * this.maxY;
  }
  public get svgElement(): SVGSVGElement {
    return this.svg;
  }

  public x(v: number): number {
    return PAD.l + (v / this.maxX) * (W - PAD.l - PAD.r);
  }
  public y(v: number): number {
    return H - PAD.b - (v / this.maxY) * (H - PAD.t - PAD.b);
  }

  render(s: GraphState): void {
    for (const g of Object.values(this.capas)) g.textContent = "";
    if (s.mostrar.ejes) this.dibujarEjes();
    if (s.fantasma) this.dibujarRecta(s.fantasma, "fantasma", true);
    if (s.mostrar.conjunto) this.dibujarConjunto(s);
    if (s.mostrar.linea) this.dibujarRecta(s, "linea", false);
    if (s.mostrar.interceptos) this.dibujarInterceptos(s);
    if (s.mostrar.pendiente) this.dibujarPendiente(s);
    this.dibujarMuestras(s);
    this.svg.setAttribute("aria-label", this.descripcion(s));
  }

  public project(term: string | null): void {
    // Limpiar clase de proyección previa
    const els = this.svg.querySelectorAll(".projecting");
    els.forEach(el => el.classList.remove("projecting"));
    if (!term) return;

    if (term === "m" || term === "p1") {
      this.svg.querySelector(".intercept.good1")?.classList.add("projecting");
    }
    if (term === "m" || term === "p2") {
      this.svg.querySelector(".intercept.good2")?.classList.add("projecting");
    }
    if (term === "p1_p2" || term === "slope") {
      this.svg.querySelector(".triangulo")?.classList.add("projecting");
    }
  }

  /** Alternativa textual del gráfico (decisión 22). Sin esto la manipulación es
   *  inaccesible para quien no usa mouse. */
  descripcion(s: GraphState): string {
    const b1 = this.ejemplo.bien_1[this.lang];
    const b2 = this.ejemplo.bien_2[this.lang];
    const ix1 = (s.m / s.p1).toFixed(1);
    const ix2 = (s.m / s.p2).toFixed(0);
    const pend = (-s.p1 / s.p2).toFixed(2);
    if (this.lang === "en") {
      return `Budget line for ${b1} and ${b2}. Income ${s.m}, prices ${s.p1} and ${s.p2}. ` +
        `Horizontal intercept ${ix1} ${b1}, vertical intercept ${ix2} ${b2}, slope ${pend}.`;
    }
    return `Línea presupuestaria de ${b1} y ${b2}. Ingreso ${s.m}, precios ${s.p1} y ${s.p2}. ` +
      `Intercepto horizontal ${ix1} de ${b1}, intercepto vertical ${ix2} de ${b2}, pendiente ${pend}.`;
  }

  private dibujarEjes(): void {
    const g = this.capas["ejes"];
    const ejeX = document.createElementNS(NS, "line");
    ejeX.setAttribute("x1", `${PAD.l}`); ejeX.setAttribute("y1", `${H - PAD.b}`);
    ejeX.setAttribute("x2", `${W - PAD.r}`); ejeX.setAttribute("y2", `${H - PAD.b}`);
    ejeX.setAttribute("class", "eje");
    ejeX.setAttribute("marker-end", "url(#marker-good1)");
    g.appendChild(ejeX);

    const ejeY = document.createElementNS(NS, "line");
    ejeY.setAttribute("x1", `${PAD.l}`); ejeY.setAttribute("y1", `${H - PAD.b}`);
    ejeY.setAttribute("x2", `${PAD.l}`); ejeY.setAttribute("y2", `${PAD.t}`);
    ejeY.setAttribute("class", "eje");
    ejeY.setAttribute("marker-end", "url(#marker-good2)");
    g.appendChild(ejeY);

    this.texto(g, W - PAD.r - 10, H - PAD.b + 42, `x₁ — ${this.ejemplo.bien_1[this.lang]}`, "eje-label good1", "end");
    this.texto(g, PAD.l + 14, PAD.t - 6, `x₂ — ${this.ejemplo.bien_2[this.lang]}`, "eje-label good2", "start");
  }

  private dibujarRecta(s: { p1: number; p2: number; m: number }, cls: string, punteada: boolean): void {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", `${this.x(0)}`);
    l.setAttribute("y1", `${this.y(s.m / s.p2)}`);
    l.setAttribute("x2", `${this.x(s.m / s.p1)}`);
    l.setAttribute("y2", `${this.y(0)}`);
    let classNames = punteada ? `recta ${cls} punteada` : `recta ${cls}`;
    if (!punteada && (s as any).enfasis === "frontera") classNames += " enfasis-frontera";
    l.setAttribute("class", classNames);
    this.capas[punteada ? "fantasma" : "linea"].appendChild(l);
  }

  private dibujarConjunto(s: GraphState): void {
    const p = document.createElementNS(NS, "polygon");
    p.setAttribute("points",
      `${this.x(0)},${this.y(0)} ${this.x(0)},${this.y(s.m / s.p2)} ${this.x(s.m / s.p1)},${this.y(0)}`);
    p.setAttribute("class", s.enfasis === "frontera" ? "conjunto enfasis-frontera" : "conjunto");
    this.capas["conjunto"].appendChild(p);
    
    // Si hay énfasis en la frontera, actualizamos la clase de la recta si ya fue dibujada o lo será
    const linea = this.capas["linea"].querySelector(".recta.linea");
    if (linea && s.enfasis === "frontera") {
      linea.classList.add("enfasis-frontera");
    }
  }

  private dibujarInterceptos(s: GraphState): void {
    const g = this.capas["interceptos"];
    
    // Intercepto X (Bien 1 - Círculo)
    const cx = this.x(s.m / s.p1);
    const cy = this.y(0);
    const c1 = document.createElementNS(NS, "circle");
    c1.setAttribute("cx", `${cx}`); c1.setAttribute("cy", `${cy}`);
    c1.setAttribute("r", s.destacar === "intercepto_x1" ? "7" : "5");
    c1.setAttribute("class", s.destacar === "intercepto_x1" ? "intercept good1 destacado" : "intercept good1");
    g.appendChild(c1);
    this.texto(g, cx, cy + 22, `${(s.m / s.p1).toFixed(1)}`, s.destacar === "intercepto_x1" ? "valor destacado good1" : "valor good1", "middle");

    // Intercepto Y (Bien 2 - Rectángulo en vez de círculo para que haga match)
    const yx = this.x(0);
    const yy = this.y(s.m / s.p2);
    const s2 = s.destacar === "intercepto_x2" ? 14 : 10;
    const r2 = document.createElementNS(NS, "rect");
    r2.setAttribute("x", `${yx - s2/2}`); r2.setAttribute("y", `${yy - s2/2}`);
    r2.setAttribute("width", `${s2}`); r2.setAttribute("height", `${s2}`);
    r2.setAttribute("class", s.destacar === "intercepto_x2" ? "intercept good2 destacado" : "intercept good2");
    g.appendChild(r2);
    this.texto(g, yx - 12, yy - 10, `${(s.m / s.p2).toFixed(0)}`, s.destacar === "intercepto_x2" ? "valor destacado good2" : "valor good2", "end");
  }

  private dibujarPendiente(s: GraphState): void {
    // triángulo de pendiente: una unidad de x1 a cambio de p1/p2 unidades de x2
    const x0 = (s.m / s.p1) * 0.42;
    const y0 = (s.m - s.p1 * x0) / s.p2;
    const dy = s.p1 / s.p2;
    const g = this.capas["etiquetas"];
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d",
      `M ${this.x(x0)} ${this.y(y0)} L ${this.x(x0 + 1)} ${this.y(y0)} L ${this.x(x0 + 1)} ${this.y(y0 - dy)}`);
    path.setAttribute("class", "triangulo");
    g.appendChild(path);
    this.texto(g, this.x(x0 + 1) + 10, this.y(y0 - dy / 2), `−${dy.toFixed(0)}`, "valor destacado", "start");
  }

  private dibujarMuestras(s: GraphState): void {
    if (!s.muestras || s.muestras.length === 0) return;
    const g = this.capas["conjunto"]; // Las dibujamos encima del conjunto
    
    for (const m of s.muestras) {
      const px = this.x(m.x1);
      const py = this.y(m.x2);
      const ox = this.x(0);
      const oy = this.y(0);
      
      // Tethers (Drop-lines)
      const tx = document.createElementNS(NS, "line");
      tx.setAttribute("x1", `${px}`); tx.setAttribute("y1", `${py}`);
      tx.setAttribute("x2", `${px}`); tx.setAttribute("y2", `${oy}`);
      tx.setAttribute("class", "tether good1");
      g.appendChild(tx);
      
      const ty = document.createElementNS(NS, "line");
      ty.setAttribute("x1", `${px}`); ty.setAttribute("y1", `${py}`);
      ty.setAttribute("x2", `${ox}`); ty.setAttribute("y2", `${py}`);
      ty.setAttribute("class", "tether good2");
      g.appendChild(ty);
      
      // Point
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", `${px}`);
      dot.setAttribute("cy", `${py}`);
      dot.setAttribute("r", "5");
      let cls = "muestra-punto";
      if (s.mostrar.conjunto) {
        const cost = m.x1 * s.p1 + m.x2 * s.p2;
        cls += cost <= s.m + 0.001 ? " adentro" : " afuera";
      }
      dot.setAttribute("class", cls);
      g.appendChild(dot);
    }
  }

  private texto(g: SVGGElement, x: number, y: number, s: string, cls: string, anchor: string): void {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", `${x}`); t.setAttribute("y", `${y}`);
    t.setAttribute("class", cls); t.setAttribute("text-anchor", anchor);
    t.textContent = s;
    g.appendChild(t);
  }
}
