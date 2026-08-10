/**
 * Option A of the bake-off: audio plus a DOM/SVG stage driven by the cue engine.
 *
 * The media is reached only through `MediaAdapter`, so options B/C/D (Remotion, Manim,
 * hybrid) can be dropped in during M4 without touching the judge, the dock, the notes
 * or the graph.
 *
 * Checkpoints PAUSE and hand control to the dock. That is Kristian's decision, and the
 * reason matters for the design: besides giving time to think, the pause works as an
 * ATTENTION CHECK — if the student is not there, the session stops and that silence is
 * signal. So we measure the time to their first action and send it to the server.
 */
import { createAdapter, type MediaAdapter } from "./player/adapter";
import type { CueFiring } from "./player/sync";
import { BudgetGraph, estadoInicial } from "./graph/budget_graph";
import { Dock } from "./chat/dock";
import { QuestionFlow } from "./questions/flow";
import type { QuestionSpec } from "./questions";
import { NOTES } from "./generated/formulas";
import type { Ejemplo, GraphState, Lang, SessionInfo } from "./types";

const lang: Lang = (new URLSearchParams(location.search).get("lang") as Lang) || "en";
const variant = new URLSearchParams(location.search).get("variant") || "A";

const T = {
  es: { empezar: "Empezar", preguntar: "✋ Preguntar", pausa: "Pausa", seguir: "Seguir",
        cargando: "Cargando…", notas: "Notas",
        cp1: "¿Qué le pasa a la línea si tu ingreso sube de 100 a 150?",
        cp2: "¿Por qué el intercepto del jugo no se mueve cuando sube el precio del café?",
        retomar: "Cuando quieras, seguimos." },
  en: { empezar: "Start", preguntar: "✋ Ask", pausa: "Pause", seguir: "Resume",
        cargando: "Loading…", notas: "Notes",
        cp1: "What happens to the line if your income rises from 100 to 150?",
        cp2: "Why does the juice intercept not move when the price of coffee rises?",
        retomar: "Whenever you're ready, we continue." },
}[lang];

async function main(): Promise<void> {
  const app = document.getElementById("app")!;
  app.textContent = T.cargando;

  const r = await fetch("/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ concept_id: "budget-line", lang, media_variant: variant }),
  });
  const session: SessionInfo = await r.json();
  if (!session.media) {
    app.textContent = "This pack has no compiled media. Run pipeline/cues.py.";
    return;
  }

  const pack = await (await fetch(`/api/packs/budget-line?lang=${lang}`)).json();
  const ejemplo: Ejemplo = pack.ejemplo;

  app.innerHTML = `
    <div class="escenario">
      <h1 class="titulo">${session.titulo}</h1>
      <div class="cols">
        <div class="lienzo"></div>
        <section class="notas" aria-label="${T.notas}">
          <h2 class="notas-h">${T.notas}</h2>
          <ol class="notas-lista"></ol>
        </section>
      </div>
      <div class="controles">
        <button id="play" class="primario">${T.empezar}</button>
        <button id="ask" class="secundario">${T.preguntar}</button>
        <span id="reloj" class="reloj">0:00</span>
        <span id="desfase" class="desfase" title="internal cue lag"></span>
      </div>
    </div>`;

  const escenario = app.querySelector(".escenario") as HTMLElement;
  const graph = new BudgetGraph(app.querySelector(".lienzo") as HTMLElement, ejemplo, lang);
  const notasLista = app.querySelector(".notas-lista") as HTMLElement;
  const dock = new Dock(app, lang);
  const flow = new QuestionFlow(session.session_id, dock, lang);

  const media: MediaAdapter = createAdapter(variant);
  await media.load(session.media, "/media/budget-line");

  let estado: GraphState = estadoInicial(ejemplo);
  graph.render(estado);

  let pausedAt: { cp: string; ts: number } | null = null;

  /** Rebuilds notes and graph from scratch. Both are pure functions of time, so a seek
   *  just replays every cue up to `t` instead of trying to undo anything. */
  function rebuild(t: number): void {
    estado = estadoInicial(ejemplo);
    notasLista.textContent = "";
    for (const c of media.cuesUntil(t)) {
      estado = aplicarCue(estado, c.id, ejemplo);
      addNote(c.id);
    }
    graph.render(estado);
  }

  function addNote(cueId: string): void {
    const n = NOTES[cueId];
    if (!n || (!n[lang] && !n.formulaHtml)) return;
    const li = document.createElement("li");
    li.className = "nota";
    if (n[lang]) {
      const p = document.createElement("p");
      p.className = "nota-txt";
      // el guion usa *cursiva* para la palabra clave de cada nota
      p.innerHTML = n[lang].replace(/\*(.+?)\*/g, "<em>$1</em>");
      li.appendChild(p);
    }
    if (n.formulaHtml) {
      const d = document.createElement("div");
      d.className = "nota-f";
      d.innerHTML = n.formulaHtml;   // pre-rendered at build time, never user input
      li.appendChild(d);
    }
    notasLista.appendChild(li);
    li.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  media.onCue((f: CueFiring) => {
    estado = aplicarCue(estado, f.cue.id, ejemplo);
    graph.render(estado);
    addNote(f.cue.id);
    evento("cue.fired", { id: f.cue.id, lag_ms: f.desfase_ms });

    if (f.cue.type === "checkpoint") {
      media.pause();
      pausedAt = { cp: f.cue.id, ts: performance.now() };
      evento("checkpoint.shown", { id: f.cue.id });
      void askCheckpoint(f.cue.id);
    }
    const d = media.lagSummary();
    (document.getElementById("desfase") as HTMLElement).textContent = d.n ? `p95 ${d.p95}ms` : "";
  });

  /** Each checkpoint declares its question in pack.yaml; there is no hardcoded text. */
  async function askCheckpoint(cpId: string): Promise<void> {
    const cp = session.checkpoints.find((c) => c.id === cpId);
    const q: QuestionSpec | undefined = cp
      ? pack.questions.find((x: QuestionSpec) => x.id === cp.pregunta_ref)
      : undefined;
    if (!q) {                       // no question wired: fall back to the spoken prompt
      dock.setEstado("abierto-activo");
      dock.decir(cpId === "cp1" ? T.cp1 : T.cp2);
      return;
    }
    if (q.modalidad === "open") {   // the LLM judge lands in M3
      dock.setEstado("abierto-activo");
      dock.decir(q.enunciado[lang]);
      return;
    }
    const v = await flow.ask(q);
    evento("checkpoint.answered", {
      id: cpId, question_id: q.id, correcta: v.correcta,
      latency_ms: pausedAt ? Math.round(performance.now() - pausedAt.ts) : null,
    });
    pausedAt = null;
  }

  media.on("seeked", () => {
    rebuild(media.currentTime());
    if (dock.actual === "abierto-activo") dock.setEstado("oculto");
  });

  const play = document.getElementById("play") as HTMLButtonElement;
  play.addEventListener("click", () => {
    if (media.paused()) void media.play(); else media.pause();
  });
  media.on("play", () => { play.textContent = T.pausa; escenario.dataset.on = "1"; });
  media.on("pause", () => { play.textContent = T.seguir; });
  media.on("timeupdate", () => {
    const t = Math.floor(media.currentTime());
    (document.getElementById("reloj") as HTMLElement).textContent =
      `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  });

  // "Ask" pauses: the student decides, the tutor never steals control (decision 11).
  document.getElementById("ask")!.addEventListener("click", () => {
    media.pause();
    dock.setEstado("abierto-pasivo");
    evento("student.asked", {});
  });

  dock.onIntencion((id) => {
    // time to first action after a checkpoint IS the attention signal
    if (pausedAt) {
      evento("checkpoint.answered", {
        id: pausedAt.cp,
        latency_ms: Math.round(performance.now() - pausedAt.ts),
        intent: id,
      });
      pausedAt = null;
    } else {
      evento("intent", { id });
    }
    if (id === "listo") {
      dock.setEstado("oculto");
      dock.decir(T.retomar);
      void media.play();
    }
  });

  function evento(type: string, payload: Record<string, unknown>): void {
    void fetch(`/api/session/${session.session_id}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, payload }),
    }).catch(() => { /* telemetry must never break the session */ });
  }

  // Instrumentation hook for browser tests and the criterion-5 measurement.
  (window as unknown as Record<string, unknown>).__tutoria = {
    media, dock, estado: () => estado, lag: () => media.lagSummary(),
  };
}

/** The script is in charge: every cue has a declared effect on the graph. */
function aplicarCue(s: GraphState, id: string, e: Ejemplo): GraphState {
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

void main();
