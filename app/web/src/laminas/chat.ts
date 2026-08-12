/**
 * El chat del tutor: lateral, fijo, y ortogonal a la lección.
 *
 * "Ortogonal" aquí es una afirmación comprobable, no un adjetivo. Significa dos cosas, y
 * las dos se pueden intentar romper:
 *
 *   1. Nada de lo que pase en la lámina cambia la visibilidad de este panel. No tiene
 *      estados. El fallo que Kristian vio en persona —contestó mal, el panel se fue, y
 *      nunca supo la respuesta correcta— no se arregla aquí: deja de tener dónde ocurrir,
 *      porque no existe el código que lo escondía.
 *   2. Nada de lo que se escriba aquí avanza la lección. Este módulo no conoce la baraja.
 *      Recibe funciones para PREGUNTAR por el contexto y no puede tocarlo.
 *
 * Los botones que viven aquí son los actos de habla —"no entiendo", "otro ejemplo",
 * "¿por qué?"—, dirigidos al tutor. Las órdenes a la lección viven en la lámina. Esa
 * división por destinatario es la respuesta que salió del debate a la pregunta de
 * Kristian sobre dónde van los botones, y tiene una consecuencia concreta: "Listo,
 * sigamos" desaparece de aquí, porque avanzar no es hablarle a nadie.
 */
type Lang = "es" | "en";

const T = {
  es: {
    titulo: "Tutor",
    placeholder: "Pregunta lo que quieras…",
    enviar: "Preguntar",
    pensando: "…",
    error: "No pude responderte ahora. Inténtalo otra vez.",
    vacio: "Puedes preguntar en cualquier momento, incluso a mitad de una explicación.",
    intenciones: [
      { id: "no_entiendo", label: "No entiendo", dice: "No entiendo esta parte. ¿Me la explicas de otra forma?" },
      { id: "otro_ejemplo", label: "Otro ejemplo", dice: "¿Me das otro ejemplo de esto?" },
      { id: "mas_despacio", label: "Más despacio", dice: "Vas muy rápido. ¿Puedes ir por partes?" },
      { id: "por_que", label: "¿Por qué?", dice: "¿Por qué es así? Quiero entender la razón." },
    ],
  },
  en: {
    titulo: "Tutor",
    placeholder: "Ask anything…",
    enviar: "Ask",
    pensando: "…",
    error: "I couldn't answer just now. Try again.",
    vacio: "You can ask at any point, even in the middle of an explanation.",
    intenciones: [
      { id: "no_entiendo", label: "I don't get it", dice: "I don't understand this part. Can you explain it another way?" },
      { id: "otro_ejemplo", label: "Another example", dice: "Can you give me another example of this?" },
      { id: "mas_despacio", label: "Slower", dice: "That's too fast. Can you break it down?" },
      { id: "por_que", label: "Why?", dice: "Why is it like that? I want to understand the reason." },
    ],
  },
};

export interface ContextoChat {
  /** El ítem que el alumno tiene delante, o null. El servidor es el único lado que sabe
   *  su respuesta; esto solo dice CUÁL es. */
  itemActivo: () => string | null;
  /** La lámina que manda. Sin esto el tutor responde sobre otra cosa — es literalmente
   *  el fallo que Kristian reportó: preguntó por la renta y le contestaron sobre x₁. */
  laminaActiva: () => string | null;
}

export class ChatLateral {
  private root: HTMLElement;
  private historial: HTMLElement;
  private input: HTMLTextAreaElement;
  private boton: HTMLButtonElement;
  private ocupado = false;

  constructor(host: HTMLElement, private sessionId: string, private lang: Lang,
              private ctx: ContextoChat,
              private onEvento: (t: string, p: Record<string, unknown>) => void) {
    const t = T[lang];
    this.root = document.createElement("aside");
    this.root.className = "chat-lateral";
    this.root.innerHTML = `
      <header class="chat-h"><span>${t.titulo}</span></header>
      <div class="chat-hist" aria-live="polite" role="log">
        <p class="chat-vacio">${t.vacio}</p>
      </div>
      <div class="chat-intenciones">
        ${t.intenciones.map((i) =>
          `<button type="button" class="chip" data-i="${i.id}">${i.label}</button>`).join("")}
      </div>
      <form class="chat-form">
        <textarea class="chat-input" rows="2" placeholder="${t.placeholder}"></textarea>
        <button type="submit" class="primario">${t.enviar}</button>
      </form>`;
    host.appendChild(this.root);

    this.historial = this.root.querySelector(".chat-hist")!;
    this.input = this.root.querySelector(".chat-input")!;
    this.boton = this.root.querySelector(".chat-form button")!;

    this.root.querySelector(".chat-form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = this.input.value.trim();
      if (texto) void this.preguntar(texto, "escrito");
    });
    for (const b of this.root.querySelectorAll<HTMLButtonElement>(".chip")) {
      b.addEventListener("click", () => {
        const i = t.intenciones.find((x) => x.id === b.dataset.i);
        // Un chip manda una PREGUNTA de verdad. Cuando solo pintaban una plantilla, cinco
        // de los sesenta y ocho hallazgos del barrido eran este único silencio.
        if (i && !this.ocupado) void this.preguntar(i.dice, i.id);
      });
    }
  }

  decir(texto: string, quien: "tutor" | "estudiante"): HTMLElement {
    this.root.querySelector(".chat-vacio")?.remove();
    const p = document.createElement("p");
    p.className = `msg ${quien}`;
    p.textContent = texto;
    this.historial.appendChild(p);
    // Deja a la vista el PRINCIPIO de lo que llega, no su final: bajar del todo hace que
    // una respuesta larga aparezca ya empezada, y se siente como que el chat no siguió.
    requestAnimationFrame(() => {
      const caja = this.historial.clientHeight;
      this.historial.scrollTop = p.getBoundingClientRect().height > caja
        ? p.offsetTop
        : this.historial.scrollHeight;
    });
    return p;
  }

  private async preguntar(texto: string, origen: string): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.boton.disabled = true;
    this.input.value = "";
    this.decir(texto, "estudiante");
    const esperando = this.decir(T[this.lang].pensando, "tutor");
    this.onEvento("chat.asked", { origen, lamina: this.ctx.laminaActiva() });
    try {
      const r = await fetch(`/api/session/${this.sessionId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pregunta: texto,
          question_id: this.ctx.itemActivo(),
          cue_id: this.ctx.laminaActiva(),
        }),
      });
      const d = await r.json();
      esperando.textContent = d.respuesta ?? T[this.lang].error;
    } catch {
      esperando.textContent = T[this.lang].error;
    } finally {
      this.ocupado = false;
      this.boton.disabled = false;
      this.input.focus();
    }
  }
}
