/**
 * Gráfico de la línea presupuestaria en SVG.
 *
 * SVG y no canvas por dos razones del plan: el texto queda en el DOM y por tanto es
 * legible por lectores de pantalla (decisión 22), y animar `transform`/`opacity` en
 * SVG no repinta el layout, que es lo que protege el criterio 5 en CPUs débiles.
 */
import type { Ejemplo, GraphState } from "../types";

const NS = "http://www.w3.org/2000/svg";
const W = 560;
const H = 460;
const PAD = { l: 62, r: 28, t: 34, b: 64 };

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

export class BudgetGraph {
  private svg: SVGSVGElement;
  private capas: Record<string, SVGGElement> = {};
  /** Escala fija: si los ejes se reescalaran al cambiar m, el desplazamiento paralelo
   *  se vería igual que un pivote y el concepto se perdería. */
  private maxX: number;
  private maxY: number;

  constructor(host: HTMLElement, private ejemplo: Ejemplo, private lang: "es" | "en") {
    this.maxX = (ejemplo.m / ejemplo.p1) * 1.6;
    this.maxY = (ejemplo.m / ejemplo.p2) * 1.6;

    this.svg = document.createElementNS(NS, "svg");
    this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("class", "bgraph");
    host.appendChild(this.svg);

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
    this.svg.setAttribute("aria-label", this.descripcion(s));
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
    const eje = (x1: number, y1: number, x2: number, y2: number): void => {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", `${x1}`); l.setAttribute("y1", `${y1}`);
      l.setAttribute("x2", `${x2}`); l.setAttribute("y2", `${y2}`);
      l.setAttribute("class", "eje");
      g.appendChild(l);
    };
    eje(PAD.l, H - PAD.b, W - PAD.r, H - PAD.b);
    eje(PAD.l, H - PAD.b, PAD.l, PAD.t);
    this.texto(g, W - PAD.r, H - PAD.b + 42, this.ejemplo.bien_1[this.lang], "eje-label", "end");
    this.texto(g, PAD.l + 6, PAD.t - 6, this.ejemplo.bien_2[this.lang], "eje-label", "start");
  }

  private dibujarRecta(s: { p1: number; p2: number; m: number }, cls: string, punteada: boolean): void {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", `${this.x(0)}`);
    l.setAttribute("y1", `${this.y(s.m / s.p2)}`);
    l.setAttribute("x2", `${this.x(s.m / s.p1)}`);
    l.setAttribute("y2", `${this.y(0)}`);
    l.setAttribute("class", punteada ? `recta ${cls} punteada` : `recta ${cls}`);
    this.capas[punteada ? "fantasma" : "linea"].appendChild(l);
  }

  private dibujarConjunto(s: GraphState): void {
    const p = document.createElementNS(NS, "polygon");
    p.setAttribute("points",
      `${this.x(0)},${this.y(0)} ${this.x(0)},${this.y(s.m / s.p2)} ${this.x(s.m / s.p1)},${this.y(0)}`);
    p.setAttribute("class", "conjunto");
    this.capas["conjunto"].appendChild(p);
  }

  private dibujarInterceptos(s: GraphState): void {
    const g = this.capas["interceptos"];
    const pts: Array<[number, number, string, string]> = [
      [s.m / s.p1, 0, `${(s.m / s.p1).toFixed(1)}`, "intercepto_x1"],
      [0, s.m / s.p2, `${(s.m / s.p2).toFixed(0)}`, "intercepto_x2"],
    ];
    for (const [vx, vy, label, key] of pts) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", `${this.x(vx)}`);
      c.setAttribute("cy", `${this.y(vy)}`);
      c.setAttribute("r", s.destacar === key ? "7" : "5");
      c.setAttribute("class", s.destacar === key ? "punto destacado" : "punto");
      g.appendChild(c);
      this.texto(g, this.x(vx) + (vy === 0 ? 0 : -12), this.y(vy) + (vy === 0 ? 22 : -10),
        label, s.destacar === key ? "valor destacado" : "valor", vy === 0 ? "middle" : "end");
    }
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

  private texto(g: SVGGElement, x: number, y: number, s: string, cls: string, anchor: string): void {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", `${x}`); t.setAttribute("y", `${y}`);
    t.setAttribute("class", cls); t.setAttribute("text-anchor", anchor);
    t.textContent = s;
    g.appendChild(t);
  }
}
