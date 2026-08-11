/**
 * Dock del tutor: tres estados según la fase (PLAN §5).
 *
 *   oculto         durante el delivery. Solo el botón "Preguntar", que pausa el media
 *                  (la pausa la decide el estudiante, decisión 11).
 *   abierto-pasivo ejemplos y práctica. Historial + botones de intención.
 *   abierto-activo checkpoint, pregunta o remediación. Escenario atenuado.
 *
 * No es burbuja flotante: los cuatro agentes del plan coincidieron en que ocluye el
 * gráfico justo durante las preguntas de manipulación, que es cuando más se necesita.
 */
export type DockEstado = "oculto" | "abierto-pasivo" | "abierto-activo";

export interface Intencion {
  id: string;
  label: string;
}

type IntencionHandler = (id: string) => void;

const INTENCIONES: Record<"es" | "en", Intencion[]> = {
  es: [
    { id: "no_entiendo", label: "No entiendo" },
    { id: "otro_ejemplo", label: "Otro ejemplo" },
    { id: "mas_despacio", label: "Más despacio" },
    { id: "por_que", label: "¿Por qué?" },
    { id: "listo", label: "Listo, sigamos" },
  ],
  en: [
    { id: "no_entiendo", label: "I don't get it" },
    { id: "otro_ejemplo", label: "Another example" },
    { id: "mas_despacio", label: "Slower" },
    { id: "por_que", label: "Why?" },
    { id: "listo", label: "Ready, go on" },
  ],
};

export class Dock {
  private root: HTMLElement;
  private historial: HTMLElement;
  private acciones: HTMLElement;
  private estado: DockEstado = "oculto";
  private handlers: IntencionHandler[] = [];

  constructor(host: HTMLElement, private lang: "es" | "en") {
    this.root = document.createElement("aside");
    this.root.className = "dock";
    this.root.setAttribute("aria-live", "polite");
    this.root.innerHTML = `
      <header class="dock-h"><span class="dock-t">${lang === "es" ? "Tutor" : "Tutor"}</span></header>
      <div class="dock-body"></div>
      <div class="dock-acciones"></div>`;
    host.appendChild(this.root);
    this.historial = this.root.querySelector(".dock-body")!;
    this.acciones = this.root.querySelector(".dock-acciones")!;
    this.setEstado("oculto");
  }

  /** Where the free-text composer mounts. Exposed instead of building the composer here
   *  so the dock keeps knowing nothing about the network. */
  get pie(): HTMLElement {
    return this.root;
  }

  onIntencion(h: IntencionHandler): void {
    this.handlers.push(h);
  }

  setEstado(e: DockEstado): void {
    this.estado = e;
    this.root.dataset.estado = e;
    document.body.dataset.dock = e;
    this.renderAcciones();
  }

  get actual(): DockEstado {
    return this.estado;
  }

  decir(texto: string, quien: "tutor" | "estudiante" = "tutor"): void {
    const p = document.createElement("p");
    p.className = `msg ${quien}`;
    p.textContent = texto;
    this.historial.appendChild(p);
    this.historial.scrollTop = this.historial.scrollHeight;
  }

  /** Monta una pregunta dentro del dock. Las de manipulación resaltan el gráfico del
   *  escenario y aquí solo va la instrucción. */
  montarPregunta(nodo: HTMLElement): void {
    const wrap = document.createElement("div");
    wrap.className = "pregunta";
    wrap.appendChild(nodo);
    this.historial.appendChild(wrap);
    this.historial.scrollTop = this.historial.scrollHeight;
  }

  private renderAcciones(): void {
    this.acciones.textContent = "";
    if (this.estado === "oculto") return;
    for (const i of INTENCIONES[this.lang]) {
      const b = document.createElement("button");
      b.className = "intencion";
      b.textContent = i.label;
      b.addEventListener("click", () => {
        this.decir(i.label, "estudiante");
        for (const h of this.handlers) h(i.id);
      });
      this.acciones.appendChild(b);
    }
  }
}
