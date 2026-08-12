/**
 * El armazón de las láminas: una hipótesis falsable, no un rediseño.
 *
 * Construido con las tres piezas que sobrevivieron al debate de T-013 — el esquema
 * estrecho, la ventana de audio comprobada contra el archivo real, y el calendario del
 * ledger como dato — para poder atacarlas en el navegador en vez de discutirlas.
 *
 * Vive en `/laminas.html`. La aplicación de hoy no se toca: si esto sale mal, se borra un
 * directorio.
 *
 * ## Lo que este archivo afirma, y cómo se rompería
 *
 * **Una sola lámina activa.** `cuerpo.replaceChildren()` es la única forma en que entra
 * contenido de lámina. No hay `appendChild` en ninguna ruta, así que "dos preguntas vivas
 * a la vez" y "el checkpoint monta una pregunta encima" no tienen dónde ocurrir.
 *
 * **El estado es total.** `ir()` no mira de dónde viene. Saltar de la 11 a la 3 pinta lo
 * mismo que llegar a la 3 en orden — que es F-001, los dos precios del café, vuelto
 * irrepresentable.
 *
 * **El chat es ortogonal.** Este archivo nunca llama a nada del chat para cambiar la
 * lección, y el chat no conoce la baraja. Ninguno de los dos puede mover al otro.
 *
 * **Los botones se parten por destinatario.** Las órdenes a la lección viven aquí abajo;
 * los actos de habla al tutor viven en el chat. Es la respuesta que salió del debate a la
 * pregunta que Kristian dejó abierta.
 */
import type { Ejemplo } from "../types";
import { BudgetGraph } from "../graph/budget_graph";
import { Ledger } from "../ledger/goods";
import { render as renderPregunta } from "../questions";
import type { QuestionSpec, Respuesta } from "../questions";
import { ChatLateral } from "./chat";
import { VentanaAudio } from "./ventana";
import { pintar, revisarBaraja } from "./baraja";
import type { Baraja, Lamina, LedgerTotal } from "./baraja";
import "./laminas.css";

const params = new URLSearchParams(location.search);
const lang: "es" | "en" = params.get("lang") === "en" ? "en" : "es";
document.documentElement.lang = lang;

const T = {
  es: { cargando: "Cargando…", seguir: "Seguir", otra: "Otra vez", anterior: "Anterior",
        pausa: "Pausa", play: "Reproducir", fin: "Fin de la lección.",
        correcto: "Correcto.", incorrecto: "No es eso.", enviando: "Enviando…",
        anotado: "Anotado. Seguimos.",
        laminaDe: (i: number, n: number) => `Lámina ${i} de ${n}` },
  en: { cargando: "Loading…", seguir: "Continue", otra: "Again", anterior: "Back",
        pausa: "Pause", play: "Play", fin: "End of the lesson.",
        correcto: "Correct.", incorrecto: "Not quite.", enviando: "Sending…",
        anotado: "Noted. Let's keep going.",
        laminaDe: (i: number, n: number) => `Slide ${i} of ${n}` },
}[lang];

async function main(): Promise<void> {
  const app = document.getElementById("app")!;
  app.textContent = T.cargando;

  const ses = await (await fetch("/api/session", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ concept_id: "budget-line", lang, media_variant: "A" }),
  })).json();

  const pack = await (await fetch(`/api/packs/budget-line?lang=${lang}`)).json();
  const ejemplo: Ejemplo = pack.ejemplo;
  const preguntas: Record<string, QuestionSpec> = {};
  for (const q of pack.questions as QuestionSpec[]) preguntas[q.id] = q;

  const baraja: Baraja = await (await fetch(
    `/media/budget-line/laminas.${lang}.json`)).json();

  // Una baraja rota se dice en pantalla, no en la consola. Es un archivo compilado que
  // algún día emitirá un modelo, y una lección que se reproduce en silencio sobre una
  // pantalla mal montada es indistinguible de una lección aburrida.
  const problemas = revisarBaraja(baraja);
  if (problemas.length) {
    app.textContent = `La baraja tiene ${problemas.length} problema(s): `
      + problemas.slice(0, 3).join(" · ");
    return;
  }

  app.innerHTML = `
    <div class="marco">
      <main class="tablero">
        <header class="tab-h">
          <h1>${baraja.titulo}</h1>
          <nav class="pasos" aria-label="${T.laminaDe(1, baraja.laminas.length)}"></nav>
        </header>
        <div class="escenario">
          <div class="bands"></div>
          <div class="lienzo"></div>
        </div>
        <section class="cuerpo" aria-live="polite"></section>
        <footer class="mandos"></footer>
      </main>
    </div>`;

  const marco = app.querySelector(".marco") as HTMLElement;
  const escenario = app.querySelector(".escenario") as HTMLElement;
  const cuerpo = app.querySelector(".cuerpo") as HTMLElement;
  const pasos = app.querySelector(".pasos") as HTMLElement;
  const mandos = app.querySelector(".mandos") as HTMLElement;

  // `setFoco` cambia quién manda en la pantalla — el objeto, el álgebra o el gráfico. Lo
  // pone el armazón y no el ledger porque el nodo del escenario es del armazón.
  const ledger = new Ledger(escenario.querySelector(".bands")!, ejemplo, lang) as
    Ledger & LedgerTotal;
  ledger.setFoco = (f: string) => { escenario.dataset.foco = f; };

  const graph = new BudgetGraph(escenario.querySelector(".lienzo")!, ejemplo, lang);
  const audio = new VentanaAudio(`/media/budget-line/${baraja.audio.split("/").pop()}`);

  let actual = 0;
  let itemActivo: string | null = null;

  const evento = (type: string, payload: Record<string, unknown>): void => {
    void fetch(`/api/session/${ses.session_id}/events`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, payload }),
    }).catch(() => {});
  };

  new ChatLateral(marco, ses.session_id, lang, {
    itemActivo: () => itemActivo,
    laminaActiva: () => baraja.laminas[actual]?.id ?? null,
  }, evento);

  // --- los pasos: saltar a cualquier lámina, que es el ataque a F-001 -----------------
  baraja.laminas.forEach((l, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "paso";
    b.dataset.tipo = l.tipo;
    b.title = `${i + 1}. ${l.id}`;
    b.setAttribute("aria-label", `${i + 1}. ${l.id}`);
    b.addEventListener("click", () => ir(i, false));
    pasos.appendChild(b);
  });

  function subtitulo(l: Lamina): HTMLElement {
    const d = document.createElement("div");
    d.className = "dice";
    for (const s of l.dice) {
      const p = document.createElement("p");
      p.textContent = s;
      d.appendChild(p);
    }
    return d;
  }

  function montarPregunta(l: Lamina): void {
    const spec = l.item ? preguntas[l.item] : undefined;
    if (!spec) {
      cuerpo.replaceChildren(subtitulo(l));
      return;
    }
    itemActivo = spec.id;
    const caja = document.createElement("div");
    caja.className = `pregunta clase-${l.clase}`;
    const marcado = document.createElement("p");
    marcado.className = "q-clase";
    marcado.textContent = l.clase === "prediction"
      ? (lang === "es" ? "Antes de verlo, predice" : "Before you see it, predict")
      : (lang === "es" ? "Comprobemos" : "Let's check");
    caja.appendChild(marcado);

    const pintado = performance.now();
    const montar = (): void => {
      caja.querySelector(".q")?.remove();
      caja.appendChild(renderPregunta(spec, lang, (r: Respuesta) => {
        void responder(l, r, Math.round(performance.now() - pintado), caja, montar);
      }));
    };
    montar();
    cuerpo.replaceChildren(caja);
    evento("lamina.item_shown", { lamina: l.id, question_id: spec.id });
  }

  async function responder(l: Lamina, r: Respuesta, thinkMs: number,
                           caja: HTMLElement, rehacer: () => void): Promise<void> {
    caja.querySelectorAll(".veredicto, .explica, .reintentar").forEach((e) => e.remove());
    const aviso = document.createElement("p");
    aviso.className = "veredicto";
    aviso.textContent = T.enviando;
    caja.appendChild(aviso);
    let d: { correcta?: boolean; socratica?: string; revelacion?: string;
             registrada?: boolean; mensaje?: string } = {};
    try {
      d = await (await fetch(`/api/session/${ses.session_id}/answer`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...r, think_ms: thinkMs }),
      })).json();
    } catch { /* la lección no se cae porque falle la red */ }

    // Las preguntas de redactar las corrige un juez que está EN SOMBRA: guarda su
    // veredicto y al alumno no se le enseña nada, porque esa compuerta no se ha aprobado
    // contra criterios de Kristian. Su respuesta no trae `correcta` — trae `registrada`.
    // Tratar la ausencia como un fallo, que es lo que hacía esta lámina, le decía "no es
    // eso" a una respuesta bien razonada Y la dejaba en un reintento sin salida: el peor
    // desenlace posible justo en el ítem que pide pensar.
    if (d.registrada) {
      aviso.textContent = d.mensaje ?? T.anotado;
      aviso.dataset.ok = "neutro";
      itemActivo = null;
      pintarMandos(true);
      return;
    }

    // El veredicto se queda EN la lámina, a la vista, junto a la pregunta que lo produjo.
    // El fallo que Kristian vio en persona —contestó mal y la respuesta se fue con el
    // panel— necesitaba que hubiera un sitio del que desaparecer. Aquí no lo hay.
    aviso.textContent = d.correcta ? T.correcto : T.incorrecto;
    aviso.dataset.ok = String(!!d.correcta);

    // `socratica` y `revelacion` son los DOS campos que manda el servidor, y no son lo
    // mismo: la sonda le devuelve la pregunta al alumno para que la piense otra vez; la
    // revelación le dice cuál era. Esta lámina pintaba un campo llamado `explicacion` que
    // el servidor NO devuelve, así que se tragaba la sonda entera: Kristian falló, leyó
    // "No es eso." y nada más. El texto siempre estuvo ahí.
    for (const [texto, clase] of [[d.socratica, "explica sonda"],
                                  [d.revelacion, "explica revelacion"]] as const) {
      if (!texto) continue;
      const p = document.createElement("p");
      p.className = clase;
      p.textContent = texto;
      caja.appendChild(p);
    }

    // Y sin un segundo intento la revelación era inalcanzable: el módulo de preguntas
    // deshabilita todos sus controles al enviar, así que un fallo dejaba el ítem muerto y
    // la regla de "a la segunda se dice cuál era" no llegaba a dispararse NUNCA.
    const puedeReintentar = !d.correcta && !d.revelacion;
    if (puedeReintentar) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mando reintentar";
      b.textContent = lang === "es" ? "Inténtalo otra vez" : "Try again";
      b.addEventListener("click", () => {
        caja.querySelectorAll(".veredicto, .explica, .reintentar").forEach((e) => e.remove());
        rehacer();
      });
      caja.appendChild(b);
      // La lámina sigue esperando: ni suena la voz ni aparece "seguir". En una predicción
      // la narración CONTIENE la respuesta, así que reproducirla mientras queda un intento
      // pendiente sería regalarla — el mismo error que se evita al entrar en la lámina.
      pintarMandos();
      return;
    }
    itemActivo = null;

    if (l.momento === "despues") {
      // La voz explica AHORA, después de que el alumno se haya mojado.
      caja.appendChild(subtitulo(l));
      void audio.reproducir();
      pintarMandos();
    } else {
      // El enunciado ya sonó; aquí la lámina termina y se sigue a mano.
      pintarMandos(true);
    }
  }

  function pintarMandos(seguirVisible = false): void {
    const l = baraja.laminas[actual];
    const esperando = l.tipo === "pregunta" && itemActivo !== null;
    mandos.replaceChildren();

    const boton = (txt: string, cls: string, f: () => void): HTMLButtonElement => {
      const b = document.createElement("button");
      b.type = "button"; b.className = cls; b.textContent = txt;
      b.addEventListener("click", f);
      mandos.appendChild(b);
      return b;
    };

    boton(`◀ ${T.anterior}`, "mando", () => ir(Math.max(0, actual - 1), false))
      .disabled = actual === 0;
    boton(T.otra, "mando", () => { audio.reiniciarVentana(); void audio.reproducir(); });

    // Durante una pregunta no hay play: la lección espera al alumno, y un botón de
    // reproducir ahí invitaría a saltársela. Es una orden a la LECCIÓN, no al tutor, y
    // por eso vive aquí abajo y no en el chat.
    if (!esperando) {
      boton(audio.sonando ? `⏸ ${T.pausa}` : `▶ ${T.play}`, "mando", () => {
        if (audio.sonando) audio.pausar(); else void audio.reproducir();
        pintarMandos(seguirVisible);
      });
    }
    if (seguirVisible || (!esperando && actual < baraja.laminas.length - 1)) {
      boton(`${T.seguir} ▸`, "mando primario",
            () => ir(Math.min(baraja.laminas.length - 1, actual + 1), true));
    }
    const pos = document.createElement("span");
    pos.className = "pos";
    pos.textContent = T.laminaDe(actual + 1, baraja.laminas.length);
    mandos.appendChild(pos);
  }

  /**
   * Va a una lámina. NO recibe de dónde viene, y esa ausencia es la arquitectura: no hay
   * forma de escribir aquí un estado que dependa del camino.
   */
  function ir(i: number, reproducir: boolean): void {
    actual = i;
    itemActivo = null;
    const l = baraja.laminas[i];

    pintar(l, graph, ledger, ejemplo);
    audio.situar(i, l.audio.desde, l.audio.hasta);

    for (const [j, b] of [...pasos.children].entries()) {
      (b as HTMLElement).dataset.estado = j < i ? "visto" : j === i ? "aqui" : "porVenir";
    }

    if (l.tipo === "pregunta" && l.momento === "despues") {
      // Se pregunta ANTES de que la voz revele. Reproducir aquí regalaría la respuesta:
      // la ventana de `price_effect` dice "la línea no se desplaza: gira".
      audio.pausar();
      montarPregunta(l);
    } else {
      cuerpo.replaceChildren(subtitulo(l));
      if (reproducir) void audio.reproducir();
    }
    pintarMandos();
    evento("lamina.shown", { lamina: l.id, tipo: l.tipo });
  }

  audio.onTerminar((i) => {
    const l = baraja.laminas[i];
    if (l.tipo === "pregunta" && l.momento === "antes") {
      // El enunciado acaba de sonar. Ahora se pregunta, y la lección espera.
      montarPregunta(l);
      pintarMandos();
      return;
    }
    if (i + 1 < baraja.laminas.length) {
      ir(i + 1, true);
    } else {
      cuerpo.appendChild(Object.assign(document.createElement("p"),
                                       { className: "fin", textContent: T.fin }));
      pintarMandos();
    }
  });

  ir(0, false);
}

void main();
