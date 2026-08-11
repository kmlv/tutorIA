/**
 * Free text into the tutor chat.
 *
 * The dock already had five intention buttons — "I don't get it", "another example" —
 * which cover the common cases with one tap and no typing. What was missing is the
 * brief's actual promise: the student can ask *anything*, at any moment. A menu of five
 * intentions is not that.
 *
 * The two coexist on purpose rather than the text box replacing the buttons. A tap is
 * cheaper than a sentence, and a student who is stuck and slightly embarrassed will tap
 * before they will type. The buttons are the low floor; this is the high ceiling.
 *
 * The question budget is shown as a count, not hidden until it runs out. A limit the
 * student discovers by hitting it feels like a punishment; a limit they can see is a
 * budget they can spend.
 */
import type { Dock } from "./dock";
import type { Lang } from "../types";

export interface ChatReply {
  respuesta: string;
  limite_alcanzado: boolean;
  restantes: number;
}

const T = {
  es: {
    placeholder: "Pregunta lo que quieras…",
    enviar: "Preguntar",
    pensando: "…",
    error: "No pude responderte ahora. Inténtalo otra vez.",
    restantes: (n: number) => `${n} pregunta${n === 1 ? "" : "s"}`,
  },
  en: {
    placeholder: "Ask anything…",
    enviar: "Ask",
    pensando: "…",
    error: "I couldn't answer just now. Try again.",
    restantes: (n: number) => `${n} question${n === 1 ? "" : "s"} left`,
  },
};

export class Composer {
  private root: HTMLElement;
  private input: HTMLTextAreaElement;
  private boton: HTMLButtonElement;
  private contador: HTMLElement;
  private busy = false;

  constructor(
    host: HTMLElement,
    private sessionId: string,
    private dock: Dock,
    private lang: Lang,
    /** What the student is working on, so the tutor can help with *this* one. The
     *  server is the only side that knows its answer — see core/chat/tutor.py. */
    private pendingQuestionId: () => string | null,
    private cueId: () => string | null,
    private onEvent: (type: string, payload: Record<string, unknown>) => void,
  ) {
    this.root = document.createElement("form");
    this.root.className = "composer";
    this.root.innerHTML = `
      <textarea class="composer-input" rows="1"
                placeholder="${T[lang].placeholder}"></textarea>
      <div class="composer-row">
        <span class="composer-restantes"></span>
        <button type="submit" class="primario composer-enviar">${T[lang].enviar}</button>
      </div>`;
    host.appendChild(this.root);

    this.input = this.root.querySelector(".composer-input") as HTMLTextAreaElement;
    this.boton = this.root.querySelector(".composer-enviar") as HTMLButtonElement;
    this.contador = this.root.querySelector(".composer-restantes") as HTMLElement;

    this.root.addEventListener("submit", (e) => {
      e.preventDefault();
      void this.send();
    });
    // Enter sends, Shift+Enter breaks the line. A one-line box that swallows Enter into
    // a newline reads as broken.
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void this.send();
      }
    });
    // `input` covers typing; `keyup` covers the paths that set the value without firing
    // it, which includes automated input and some IME commits. Cheap insurance against a
    // box whose text is taller than the box.
    for (const ev of ["input", "keyup"] as const) {
      this.input.addEventListener(ev, () => this.autoGrow());
    }
  }

  private autoGrow(): void {
    this.input.style.height = "auto";
    this.input.style.height = `${Math.min(this.input.scrollHeight, 120)}px`;
  }

  focus(): void {
    this.input.focus();
  }

  private setBusy(b: boolean): void {
    this.busy = b;
    this.boton.disabled = b;
    this.input.disabled = b;
    this.boton.textContent = b ? T[this.lang].pensando : T[this.lang].enviar;
  }

  /** Manda un texto como si el alumno lo hubiera escrito.
   *
   *  Existe porque los cuatro chips de ayuda del panel —«No entiendo», «Otro ejemplo»,
   *  «Más despacio», «¿Por qué?»— no hacían NADA: pintaban la burbuja del alumno, mandaban
   *  telemetría, y nunca llamaban al tutor. Cinco de los sesenta y ocho fallos del barrido
   *  eran ese mismo silencio visto desde cinco sitios distintos. Escribir las mismas
   *  palabras a mano sí contestaba, lo que lo hacía especialmente desconcertante. */
  async preguntar(texto: string): Promise<void> {
    // Si ya hay una pregunta en vuelo, NO se pisa el borrador del alumno ni se finge que
    // se mandó algo. Antes esto sobrescribía lo que estuviera escrito y, con dos clics
    // seguidos, el segundo se descartaba en silencio dejando el texto huérfano en la caja.
    if (this.busy) return;
    const borrador = this.input.value;
    this.input.value = texto;
    await this.send();
    if (this.input.value === texto) this.input.value = borrador;   // no salió: se devuelve
  }

  private async send(): Promise<void> {
    const q = this.input.value.trim();
    if (!q || this.busy) return;

    this.dock.decir(q, "estudiante");
    this.input.value = "";
    this.autoGrow();
    this.setBusy(true);

    const t0 = performance.now();
    try {
      const r = await fetch(`/api/session/${this.sessionId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pregunta: q,
          question_id: this.pendingQuestionId(),
          cue_id: this.cueId(),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const reply = (await r.json()) as ChatReply;
      this.dock.decir(reply.respuesta);
      this.contador.textContent = T[this.lang].restantes(reply.restantes);
      this.root.dataset.agotado = reply.limite_alcanzado ? "1" : "";
      this.onEvent("chat.asked", {
        chars: q.length,
        restantes: reply.restantes,
        latency_ms: Math.round(performance.now() - t0),
      });
    } catch {
      this.dock.decir(T[this.lang].error);
    } finally {
      this.setBusy(false);
      this.autoGrow();
      this.input.focus();
    }
  }
}
