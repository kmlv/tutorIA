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

/** El idioma, saneado.
 *
 *  `?lang=fr` dejaba la página COMPLETAMENTE en blanco: el diccionario `T` se indexa por
 *  idioma, `T[lang]` salía `undefined`, y el primer `.cargando` reventaba antes de pintar
 *  nada. Ni título, ni mensaje, ni forma de saber qué pasó. Un enlace mal copiado —o un
 *  navegador que añade la región, `es-MX`— y el profesor ve una pantalla vacía.
 *
 *  Se cae al inglés en vez de mostrar un error porque un idioma que no tenemos no es un
 *  fallo del alumno: es contenido que no existe todavía. */
const IDIOMAS = ["es", "en"] as const;
const pedido = (new URLSearchParams(location.search).get("lang") || "").slice(0, 2).toLowerCase();
const lang: Lang = (IDIOMAS as readonly string[]).includes(pedido) ? (pedido as Lang) : "en";

/** La variante, saneada. `?variant=b` en minúscula lanzaba desde el adaptador y dejaba una
 *  página que SE VEÍA entera —fichas, botón «Empezar» habilitado— pero sin lección detrás.
 *  Peor que la pantalla en blanco: parece que funciona. */
const VARIANTES = ["A", "B"] as const;
const variantePedida = (new URLSearchParams(location.search).get("variant") || "A").toUpperCase();
const variant = (VARIANTES as readonly string[]).includes(variantePedida) ? variantePedida : "A";
/** `?t=95` jumps straight to a moment on load. A capture affordance: it is how the
 *  design review screenshots are taken, and it will be how the M4 bake-off captures the
 *  same instant across all four media options. */
const seekParam = Number(new URLSearchParams(location.search).get("t"));
/** `?reloj=grosero` forces every option onto `timeupdate`. Only the criterion-5
 *  measurement uses it; see the constructor of `CueEngine` for why it has to exist. */
const relojGrosero =
  new URLSearchParams(location.search).get("reloj") === "grosero";
/** `?debug=1` enseña la instrumentación interna. Por defecto, no. */
const depurar = new URLSearchParams(location.search).get("debug") === "1";
/** `?demo=1` añade un botón para saltar al siguiente momento de la lección.
 *
 *  Es para enseñar el sistema, no para aprender con él: un alumno que puede saltarse la
 *  explicación se salta la explicación. Por eso va detrás de un parámetro y no en la
 *  interfaz — el enlace que se le manda a un estudiante no lo lleva, y no hay forma de
 *  descubrirlo pulsando. */
const modoDemo = new URLSearchParams(location.search).get("demo") === "1";

/** El mismo momento y la misma variante, en el otro idioma. */
function otroIdiomaHref(): string {
  const q = new URLSearchParams(location.search);
  // Se compara contra el idioma YA NORMALIZADO y no contra el crudo de la URL. Con
  // `?lang=ES` o `?lang=es-ES` la página salía en español y el enlace decía «English»
  // apuntando a `?lang=es`: un bucle sobre sí mismo. Lo encontró codex.
  q.set("lang", lang === "es" ? "en" : "es");
  return `?${q}`;
}

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
        ${modoDemo ? `<button id="siguiente" class="secundario"
           title="Salta al siguiente momento. Solo en modo demostración."
           >${lang === "es" ? "Siguiente ▸" : "Next ▸"}</button>` : ""}
        <!-- El idioma era solo un parámetro de URL, que vale para desarrollar y no para
             enseñárselo a nadie. Es un enlace y no un botón con JS: recargar es lo
             correcto aquí, porque el idioma decide qué audio y qué timeline se sirven, y
             cambiarlos en caliente sería reconstruir la sesión entera para ahorrar una
             recarga. -->
        <a class="idioma" href="${otroIdiomaHref()}" hreflang="${lang === "es" ? "en" : "es"}"
           >${lang === "es" ? "English" : "Español"}</a>
      </div>
      <div class="captions-band"></div>
    </div>`;

  // El <html lang> estaba fijo en "es", así que la lección en inglés se declaraba como
  // española: un lector de pantalla la lee con fonética equivocada, palabra por palabra.
  document.documentElement.lang = lang;

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
        // Sin arrastrar, se manda la posición TAL COMO ESTÁ, que es exactamente lo que el
        // alumno está afirmando: "la recta no se mueve". Antes se resolvía aquí mismo un
        // veredicto falso sin llamar al servidor, y eso era el peor callejón del barrido:
        // el servidor nunca se enteraba, volvía a servir el MISMO ítem, y el alumno podía
        // pulsar «Listo» cuarenta veces recibiendo cero palabras. De paso quemaba el
        // presupuesto de práctica entero y dejaba treinta y nueve fallos en el expediente
        // de un alumno que no había contestado ni una vez.
        //
        // Un arrastre equivocado y un no-arrastre son los dos incorrectos; que uno avance
        // con su sonda socrática y el otro encierre al alumno era la incoherencia.
        // El punto que se manda es EL QUE SE VE, no el origen.
        //
        // Mandaba {x1:0, x2:0}, y el corrector acepta el origen como estrictamente
        // asequible: gasto cero. O sea que pulsar «Listo» sin tocar nada daba CORRECTO y
        // sumaba dominio por un punto que el alumno nunca eligió. Convertí un callejón sin
        // salida en crédito fabricado, que es peor — lo demostró codex ejecutando el
        // corrector. El punto visible de partida es (m/2p1, m/2p2), que está sobre la
        // recta y por tanto se califica como lo que es.
        const enviado: ManipValue = valor ?? (
          modo === "point"
            ? { x1: estado.m / (2 * estado.p1), x2: estado.m / (2 * estado.p2) } as ManipValue
            : { p1: estado.p1, p2: estado.p2, m: estado.m } as ManipValue);
        void flow.submitManip(q.id, enviado).then(resolve);
      });
    });
    teardown();
    preguntaActiva = null;
    return v;
  }

  const practice = new PracticeLoop(
    session.session_id, dock, flow, lang, evento, askManip,
    (id) => { preguntaActiva = id; });

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
   *  just replays every cue up to `t` instead of trying to undo anything.
   *
   *  FALLO CONOCIDO F-001 (`docs/FALLOS-CONOCIDOS.md`): esto vale para el gráfico y NO
   *  para el ledger. El estado del gráfico se reinicia con `estadoInicial`; al ledger
   *  solo se le reaplican los cues, y sus operaciones son acumulativas —`revelar`
   *  enciende y no apaga— así que un salto hacia atrás deja el precio del pivote, la
   *  compresión puesta y todas las estaciones encendidas. Se ve como dos precios
   *  distintos para el café en la misma pantalla. */
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
    aplicarLedger(guion.ledger?.[cueId] ?? [], {
      reveal: (g, ...est) => ledger.reveal(g as never, ...est as never[]),
      highlight: (...t) => ledger.highlight(...t),
      compress: (on) => ledger.compress(on),
      morphPrice: (g, v) => ledger.morphPrice(g as never, v),
      // El foco es un atributo y no una clase: el CSS reacciona a `[data-foco=...]` y la
      // transición la hace el navegador. Nada de JS midiendo ni animando.
      setFoco: (f) => { escenario.dataset.foco = f; },
    }, ejemplo);
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
    // El desfase de cues es instrumentación del bake-off, no información para un alumno.
    // Salía en la barra del reproductor como «p95 12ms», que a un profesor le parece —con
    // razón— que se le coló algo de dentro. Se queda accesible en `__tutoria.lag()` y en
    // la telemetría, que es donde hace falta, y solo se pinta con `?debug=1`.
    const d = media.lagSummary();
    (document.getElementById("desfase") as HTMLElement).textContent =
      (depurar && d.n) ? `p95 ${d.p95}ms` : "";
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

  if (modoDemo) {
    /** Salta al siguiente cue: el próximo momento en que la lección HACE algo.
     *
     *  Salta a cue y no un número fijo de segundos porque lo que se enseña en una demo son
     *  los momentos, no el tiempo: quien mira quiere ver aparecer la región, el pivote, el
     *  checkpoint. Los huecos entre cues duran veinte segundos y no contienen nada nuevo.
     *
     *  Menos 0,15 s para caer JUSTO ANTES: el motor dispara con `prev < t <= actual`, así
     *  que aterrizar encima del segundo exacto se saltaría el cue en vez de verlo. */
    document.getElementById("siguiente")?.addEventListener("click", () => {
      const t = media.currentTime();
      const cues = (session.media?.cues ?? [])
        .filter((c) => c.t !== null && c.t > t + 0.2)
        .sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
      const destino = cues.length ? (cues[0].t as number) - 0.15 : media.duration() - 0.5;
      media.seek(Math.max(0, destino));
      evento("demo.salto", { desde: Math.round(t), hasta: Math.round(destino) });
      if (media.paused()) void media.play();
    });
  }

  // "Ask" pauses: the student decides, the tutor never steals control (decision 11).
  document.getElementById("ask")!.addEventListener("click", () => {
    media.pause();
    dock.setEstado("abierto-pasivo");
    composer.focus();      // the box is the point of the button; land the cursor in it
    evento("student.asked", {});
  });

  /** Qué le dice al tutor cada chip de ayuda.
   *
   *  Los cuatro chips no hacían NADA: pintaban la burbuja del alumno, mandaban telemetría,
   *  y no llamaban al tutor jamás. Cinco de los fallos del barrido eran ese silencio visto
   *  desde cinco superficies distintas, y lo peor es que escribir esas mismas palabras a
   *  mano SÍ contestaba — así que el alumno concluye que el botón está roto, no que el
   *  tutor no sabe.
   *
   *  Son frases y no ids porque lo que viaja al tutor es lenguaje: el servidor le da el
   *  enunciado del ítem en curso, y "explícamelo de otra forma" con ese contexto delante
   *  es una petición que se puede atender. Un id no lo sería. */
  const DICE: Record<string, Record<Lang, string>> = {
    no_entiendo: { es: "No entiendo esto. ¿Puedes explicármelo de otra forma?",
                   en: "I don't get this. Can you explain it another way?" },
    otro_ejemplo: { es: "¿Me das otro ejemplo?", en: "Can you give me another example?" },
    mas_despacio: { es: "Vamos más despacio, por favor. Explícamelo paso a paso.",
                    en: "Let's go slower, please. Walk me through it step by step." },
    por_que: { es: "¿Por qué? Explícame el motivo.", en: "Why? Explain the reason." },
  };

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
      // NO reanudar si la práctica ya empezó. `media.play()` sobre una narración
      // terminada la rearranca desde 0:00, esconde la pregunta que el alumno tenía
      // delante y lo deja mirando una lección que ya vio — dos fallos del barrido, uno
      // en práctica y otro en idioma, con esta misma línea detrás.
      if (!practice.active) void media.play();
      return;
    }
    const texto = DICE[id]?.[lang];
    if (texto) void composer.preguntar(texto);
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
    // Mover TAMBIÉN el audio, no solo el dibujo.
    //
    // `?t=` nació como affordance de captura: pintaba el estado de ese instante sin tocar
    // el medio, para poder fotografiarlo en Chrome headless donde el audio no carga. Para
    // un alumno o para quien enseña esto, es una contradicción: la pantalla muestra el
    // minuto 1:30 y el reloj marca 0:00, y al pulsar «Empezar» la narración arranca desde
    // el principio contra un gráfico que ya va por la mitad. Cinco de los sesenta y ocho
    // fallos eran esta misma línea vista desde cinco superficies.
    //
    // Se hace con tolerancia a que el medio aún no tenga duración: en headless nunca la
    // tendrá, y ahí el comportamiento viejo —pintar sin mover— sigue siendo el correcto.
    const irAlMedio = (): void => {
      if (media.duration() > 0) media.seek(Math.min(seekParam, media.duration() - 0.1));
    };
    irAlMedio();
    media.on("loadedmetadata", irAlMedio);
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
  // La sesión cruda, para que un arnés pueda leer la timeline en vez de clavar segundos.
  // El arnés de extremo a extremo saltaba a 85 s, que va justo antes de la predicción
  // española y justo después de la inglesa: el inglés fallaba y el fallo era del arnés.
  (window as unknown as Record<string, unknown>).__tutoriaSesion = session;
  (window as unknown as Record<string, unknown>).__tutoria = {
    media, dock, composer, practice,
    estado: () => estado, lag: () => media.lagSummary(),
  };
}

void main();
