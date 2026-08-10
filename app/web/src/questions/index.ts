/**
 * Los cuatro tipos de pregunta del brief.
 *
 * Tres se corrigen en el SERVIDOR, no aquí: si el navegador supiera la respuesta, el
 * estudiante podría leerla en el bundle. El cliente solo recoge la respuesta y la
 * manda; el veredicto y el diagnóstico vuelven del servidor.
 *
 * La única excepción es la manipulación del gráfico, donde el cliente envía la recta
 * que el estudiante construyó (pendiente e interceptos) y el servidor decide si cae
 * dentro de tolerancia. Tampoco ahí el cliente conoce el objetivo.
 */
import type { Lang } from "../types";

export interface QuestionSpec {
  id: string;
  modalidad: "numeric" | "mcq" | "open" | "manip";
  enunciado: Record<Lang, string>;
  opciones?: Array<Record<Lang, string> & { correcta?: boolean }>;
}

export interface Respuesta {
  question_id: string;
  modalidad: QuestionSpec["modalidad"];
  valor: string | number | { p1: number; p2: number; m: number };
  con_andamiaje: boolean;
}

const T = {
  es: { enviar: "Responder", placeholder: "Escribe tu respuesta…", numero: "Tu respuesta" },
  en: { enviar: "Answer", placeholder: "Type your answer…", numero: "Your answer" },
};

export type OnSubmit = (r: Respuesta) => void;

export function render(q: QuestionSpec, lang: Lang, onSubmit: OnSubmit,
                       conAndamiaje = false): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = `q q-${q.modalidad}`;

  const p = document.createElement("p");
  p.className = "q-enunciado";
  p.textContent = q.enunciado[lang];
  wrap.appendChild(p);

  const enviar = (valor: Respuesta["valor"]): void => {
    wrap.querySelectorAll("button, input").forEach((el) => {
      (el as HTMLButtonElement).disabled = true;
    });
    onSubmit({ question_id: q.id, modalidad: q.modalidad, valor, con_andamiaje: conAndamiaje });
  };

  switch (q.modalidad) {
    case "mcq": {
      const lista = document.createElement("div");
      lista.className = "q-opciones";
      (q.opciones ?? []).forEach((o, i) => {
        const b = document.createElement("button");
        b.className = "q-opcion";
        b.textContent = o[lang];
        // se manda el ÍNDICE, no el texto: el servidor mapea índice → misconception
        b.addEventListener("click", () => { b.classList.add("elegida"); enviar(i); });
        lista.appendChild(b);
      });
      wrap.appendChild(lista);
      break;
    }
    case "numeric": {
      const form = document.createElement("form");
      form.className = "q-form";
      form.innerHTML = `
        <label class="q-label">${T[lang].numero}
          <input type="text" inputmode="decimal" class="q-input" autocomplete="off">
        </label>
        <button type="submit" class="primario">${T[lang].enviar}</button>`;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = (form.querySelector(".q-input") as HTMLInputElement).value.trim();
        if (v) enviar(v);
      });
      wrap.appendChild(form);
      break;
    }
    case "open": {
      const form = document.createElement("form");
      form.className = "q-form";
      form.innerHTML = `
        <textarea class="q-textarea" rows="4" placeholder="${T[lang].placeholder}"></textarea>
        <button type="submit" class="primario">${T[lang].enviar}</button>`;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = (form.querySelector(".q-textarea") as HTMLTextAreaElement).value.trim();
        if (v) enviar(v);
      });
      wrap.appendChild(form);
      break;
    }
    case "manip": {
      const nota = document.createElement("p");
      nota.className = "q-nota";
      nota.textContent = lang === "es"
        ? "Arrastra los extremos de la recta en el gráfico."
        : "Drag the endpoints of the line on the graph.";
      wrap.appendChild(nota);
      // el envío lo dispara el gráfico; ver manip.ts
      break;
    }
  }

  return wrap;
}
