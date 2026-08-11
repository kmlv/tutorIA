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
import { BudgetGraph } from "./graph/budget_graph";
import { aplicarCue, estadoInicial } from "./graph/state";
import { aplicarLedger, revisar, type GraphScript } from "./graph/script";
import { Dock } from "./chat/dock";
import { Composer } from "./chat/composer";
import { Ledger } from "./ledger/goods";
import { CaptionBand } from "./captions/captions";
import { QuestionFlow, type Verdict } from "./questions/flow";
import { PracticeLoop } from "./practice/loop";
import { enableDrag } from "./graph/manip";
import type { QuestionSpec, ManipValue } from "./questions";
import { NOTES } from "./generated/formulas";
import type { Ejemplo, GraphState, Lang, SessionInfo } from "./types";

const lang: Lang = (new URLSearchParams(location.search).get("lang") as Lang) || "en";
const variant = new URLSearchParams(location.search).get("variant") || "A";
/** `?t=95` jumps straight to a moment on load. A capture affordance: it is how the
 *  design review screenshots are taken, and it will be how the M4 bake-off captures the
 *  same instant across all four media options. */
const seekParam = Number(new URLSearchParams(location.search).get("t"));
/** `?reloj=grosero` forces every option onto `timeupdate`. Only the criterion-5
 *  measurement uses it; see the constructor of `CueEngine` for why it has to exist. */
const relojGrosero =
  new URLSearchParams(location.search).get("reloj") === "grosero";

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

  // El guion del gráfico (D-3). Sin él la lección se reproduce y no se dibuja nada, así
  // que el fallo tiene que ser explícito: un pack sin guion es un pack a medio compilar,
  // no un pack sin gráfico.
  const recibido = session.graph_script;
  if (!recibido) {
    app.textContent = "Este pack no trae graph.yaml. Ver docs/D3-GUION-GRAFICO.md.";
    return;
  }
  // Reasignar tras la comprobación: `rebuild` y los manejadores son declaraciones de
  // función, que se izan, y TypeScript no les propaga el estrechamiento de arriba.
  const guion: GraphScript = recibido;
  const problemas = revisar(guion, ejemplo);
  if (problemas.length) {
    // En pantalla y no solo en consola: este documento lo emite un modelo, y un guion
    // inválido que solo se queja en la consola es indistinguible de una lección aburrida.
    app.textContent = `El guion del gráfico tiene ${problemas.length} problema(s): `
      + problemas.slice(0, 3).join(" · ");
    return;
  }

  app.innerHTML = `
    <div class="escenario">
      <h1 class="titulo">${session.titulo}</h1>
      <div class="bands"></div>
      <div class="stage"><div class="lienzo"></div></div>
      <div class="controles">
        <button id="play" class="primario">${T.empezar}</button>
        <button id="ask" class="secundario">${T.preguntar}</button>
        <span id="reloj" class="reloj">0:00</span>
        <span id="desfase" class="desfase" title="internal cue lag"></span>
      </div>
      <div class="captions-band"></div>
    </div>`;

  const escenario = app.querySelector(".escenario") as HTMLElement;
  const ledger = new Ledger(app.querySelector(".bands") as HTMLElement, ejemplo, lang);
  const graph = new BudgetGraph(app.querySelector(".lienzo") as HTMLElement, ejemplo, lang);
  const captions = new CaptionBand(
    app.querySelector(".captions-band") as HTMLElement,
    session.media.transcript ?? [], lang);
  const dock = new Dock(app, lang);
  const flow = new QuestionFlow(session.session_id, dock, lang);

  /** What the student is being asked right now. The composer passes it to the tutor so
   *  help is about THIS item; the server still withholds its answer. */
  let preguntaActiva: string | null = null;
  let cueActual: string | null = null;

  const composer = new Composer(
    dock.pie, session.session_id, dock, lang,
    () => preguntaActiva, () => cueActual, evento,
  );
  /**
   * Manipulation items during practice. The graph lives out here, so the loop asks for
   * this instead of reaching for it — which is also what lets the loop be exercised
   * without a graph at all.
   *
   * The drag reports continuously; nothing is submitted until the student confirms.
   * Auto-submitting on pointer-up would grade the moment they let go of the handle,
   * which is not the moment they decided.
   */
  async function askManip(q: QuestionSpec, modo: "point" | "line"): Promise<Verdict> {
    preguntaActiva = q.id;

    // Practice can start without the narration ever playing, and then the stage is
    // blank: no axes, no line, nothing to drag. Found by looking at it. The graph is a
    // pure function of state, so showing it is a state change, not a special case.
    estado = {
      ...estado,
      mostrar: { ...estado.mostrar, ejes: true, linea: true, interceptos: true },
      fantasma: { p1: ejemplo.p1, p2: ejemplo.p2, m: ejemplo.m },
      destacar: "ninguno",
    };
    tomarEscenario();
    graph.render(estado);

    let valor: ManipValue | null = null;
    const teardown = enableDrag(graph, estado, modo, (res) => { valor = res as ManipValue; });

    const confirmar = document.createElement("button");
    confirmar.className = "primario";
    confirmar.textContent = lang === "es" ? "Listo" : "Done";

    const node = document.createElement("div");
    node.className = "q q-manip";
    const p = document.createElement("p");
    p.className = "q-enunciado";
    p.textContent = q.enunciado[lang];
    const nota = document.createElement("p");
    nota.className = "q-nota";
    nota.textContent = modo === "point"
      ? (lang === "es" ? "Arrastra el punto en el gráfico." : "Drag the point on the graph.")
      : (lang === "es" ? "Arrastra los extremos de la recta." : "Drag the endpoints of the line.");
    node.append(p, nota, confirmar);

    dock.setEstado("abierto-activo");
    dock.montarPregunta(node);

    const v = await new Promise<Verdict>((resolve) => {
      confirmar.addEventListener("click", () => {
        confirmar.disabled = true;
        if (!valor) { resolve({ correcta: false, score: 0 }); return; }
        void flow.submitManip(q.id, valor).then(resolve);
      });
    });
    teardown();
    preguntaActiva = null;
    return v;
  }

  const practice = new PracticeLoop(
    session.session_id, dock, flow, lang, evento, askManip);

  const media: MediaAdapter = createAdapter(variant, relojGrosero);
  media.mount?.(app.querySelector(".stage") as HTMLElement);
  // The layout knows about the ledger; the adapter must not. It says whether it owns the
  // picture and this attribute is what the stylesheet reacts to.
  escenario.dataset.escenario = media.ownsStage ? "media" : "dom";
  await media.load(session.media, "/media/budget-line");

  let estado: GraphState = estadoInicial(ejemplo);

  /**
   * The one place that decides whether the DOM stage may paint.
   *
   * Before this, five call sites painted unconditionally. That was correct while option
   * A was the only adapter — and it is exactly the assumption M4 has to break, because
   * a pre-rendered video already contains the graph and the equation. Painting them
   * again on top does not look like a bug on the first frame: it looks like a slightly
   * blurry duplicate that drifts apart as the cue lag accumulates, which is the kind of
   * thing that gets scored as "video quality" in a bake-off when it is really our own
   * double-draw.
   *
   * Ownership is a property of the MOMENT, not of the technology. The picture goes back
   * to the DOM as soon as the student has to touch it.
   */
  function pintar(cueId?: string): void {
    // El ledger SIEMPRE se pinta. `ownsStage` significa dueño del ESCENARIO —el gráfico—
    // y no de la pantalla: la banda de la ecuación y las fichas de los bienes viven fuera
    // del `.stage`, el vídeo no las dibuja, y ocultarlas le quitaba a la opción B la mitad
    // del contenido de cada instante por una decisión mía y no por una limitación suya.
    // Visto en la primera captura del criterio 1: bajo B desaparecían la ecuación
    // `m/p1 = 100/3 ≈ 33.3` y los precios, que es justo lo que se está explicando.
    if (cueId) paintLedger(cueId);
    if (media.ownsStage) return;
    graph.render(estado);
  }

  /** Takes the stage back for the interactive phase. Nothing pre-rendered can be dragged. */
  function tomarEscenario(): void {
    media.releaseStage?.();
    escenario.dataset.escenario = "dom";
  }

  pintar();

  let pausedAt: { cp: string; ts: number } | null = null;

  /** Rebuilds notes and graph from scratch. Both are pure functions of time, so a seek
   *  just replays every cue up to `t` instead of trying to undo anything. */
  function rebuild(t: number): void {
    estado = estadoInicial(ejemplo);
    for (const c of media.cuesUntil(t)) {
      estado = aplicarCue(estado, c.id, ejemplo, guion);
      paintLedger(c.id);
    }
    pintar();
  }

  /**
   * El ledger es lo que cada cue pinta en la banda de la ecuación, según
   * `docs/DISPLAY-DESIGN.md` §5: la ecuación es una espina estructural entre las dos
   * fichas, no una columna de comentarios al lado del gráfico.
   *
   * Las operaciones vienen de `graph.yaml` (D-3) y ya no de un `switch`. Era el último
   * trozo de la lección que vivía en código: mientras estuviera aquí, un pack generado
   * por un modelo podía dibujar su gráfico y no su ecuación, y la promesa de que el
   * concepto número veinte sale barato estaba a medias.
   *
   * La ecuación EN SÍ sigue viniendo de `NOTES`, que `pipeline/render_math.mjs` genera
   * renderizando KaTeX en tiempo de compilación. Eso no es configuración: es el resultado
   * de compilar la fórmula del pack, y ponerlo en un documento que escribe un modelo
   * sería pedirle que emita HTML de KaTeX.
   */
  function paintLedger(cueId: string): void {
    const n = NOTES[cueId];
    if (n && (n.formulaHtml || n.formulaDimHtml)) {
      ledger.setEquation(n.formulaHtml, n.formulaDimHtml);
    }
    aplicarLedger(guion.ledger?.[cueId] ?? [], ledger, ejemplo);
  }

  media.onCue((f: CueFiring) => {
    // The state advances even when the video owns the picture: `estado` is what the
    // practice loop, the tutor context and `?t=` review all read. Only the PAINTING is
    // conditional. Skipping the state update instead would have been the tempting
    // shortcut and would have left the stage blank the moment practice began.
    estado = aplicarCue(estado, f.cue.id, ejemplo, guion);
    pintar(f.cue.id);
    cueActual = f.cue.id;
    evento("cue.fired", { id: f.cue.id, lag_ms: f.desfase_ms });

    if (f.cue.type === "checkpoint") {
      media.pause();
      pausedAt = { cp: f.cue.id, ts: performance.now() };
      evento("checkpoint.shown", { id: f.cue.id });
      void askCheckpoint(f.cue.id);
    }
    if (f.cue.type === "prediction") {
      media.pause();
      media.holdRest();   // the reveal shares this timestamp; it must wait for the answer
      void askPrediction(f.cue.id);
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
    // Open questions used to stop here with the stem printed and no way to answer,
    // because the judge did not exist. It does now, in shadow: the student's answer is
    // recorded and judged, and the verdict is deliberately not shown back to them.
    preguntaActiva = q.id;
    const v = await flow.ask(q, {});
    preguntaActiva = null;
    evento("checkpoint.answered", {
      id: cpId, question_id: q.id,
      correcta: v.correcta ?? null,
      shadow: v.registrada === true,
      latency_ms: pausedAt ? Math.round(performance.now() - pausedAt.ts) : null,
    });
    pausedAt = null;
  }

  /**
   * A prediction pauses BEFORE the narration reveals the answer, asks the student to
   * commit, and then resumes into the reveal. It replaces an "I understood" button:
   * same single tap, but it produces evidence instead of a self-report, and predicting
   * improves learning even when the prediction is wrong.
   *
   * The verdict is deliberately NOT shown here. Telling the student they were wrong
   * before the narration explains why would spend the surprise the prediction just
   * bought. It is recorded, and the reveal does the teaching.
   */
  async function askPrediction(predId: string): Promise<void> {
    const qid = pack.predictions?.[predId];
    const q: QuestionSpec | undefined = qid
      ? pack.questions.find((x: QuestionSpec) => x.id === qid)
      : undefined;
    if (!q) { void media.play(); return; }

    const t0 = performance.now();
    dock.setEstado("abierto-activo");
    preguntaActiva = q.id;
    const v = await flow.ask(q, { silent: true });
    preguntaActiva = null;
    evento("prediction.answered", {
      id: predId, question_id: q.id, correcta: v.correcta,
      latency_ms: Math.round(performance.now() - t0),
    });
    dock.setEstado("oculto");
    void media.play();
  }

  // The narration ending is not the lesson ending. Until now it was: the audio stopped
  // and nothing happened, while the whole mastery engine sat on the server unreached.
  media.on("ended", () => {
    escenario.dataset.on = "";
    // The narration is over, so whatever painted it hands the stage back. Under option A
    // this is a no-op; under a video option it is what makes practice possible at all.
    tomarEscenario();
    pintar();
    void practice.start();
  });

  media.on("seeked", () => {
    captions.update(media.currentTime());
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
    captions.update(media.currentTime());
    const t = Math.floor(media.currentTime());
    (document.getElementById("reloj") as HTMLElement).textContent =
      `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  });

  // "Ask" pauses: the student decides, the tutor never steals control (decision 11).
  document.getElementById("ask")!.addEventListener("click", () => {
    media.pause();
    dock.setEstado("abierto-pasivo");
    composer.focus();      // the box is the point of the button; land the cursor in it
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

  // `?t=` paints the state at that instant WITHOUT touching the media. The first
  // version seeked the audio element, which meant it silently did nothing in headless
  // Chrome — where no audio loads — and produced blank review screenshots. The cue
  // times come from the timeline, not from the audio, so the state is reachable
  // without playing anything. That is also what the M4 bake-off needs: capture the same
  // instant across four media technologies, three of which are pre-rendered video.
  if (Number.isFinite(seekParam) && seekParam > 0) {
    // When something else owns the picture, showing an instant means MOVING it there.
    // Replaying cues into a hidden DOM stage would leave the video sitting at zero while
    // the app reported the right state — and `?t=` is precisely how the bake-off captures
    // the same moment in both options, so a silent no-op here would have compared a
    // rendered frame against a black one.
    if (media.ownsStage) {
      const ir = (): void => media.seek(seekParam);
      if (media.duration() > 0) ir(); else media.on("loadedmetadata", ir);
    }
    for (const c of (session.media.cues ?? [])) {
      if (c.t !== null && c.t <= seekParam) {
        estado = aplicarCue(estado, c.id, ejemplo, guion);
        paintLedger(c.id);
      }
    }
    pintar();
    captions.update(seekParam);
  }

  // Instrumentation hook for browser tests and the criterion-5 measurement.
  (window as unknown as Record<string, unknown>).__tutoria = {
    media, dock, composer, practice,
    estado: () => estado, lag: () => media.lagSummary(),
  };
}

void main();
