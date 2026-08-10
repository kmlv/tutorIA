/**
 * Opción A del bake-off: audio + SVG en el DOM, sincronizados por el motor de cues.
 *
 * El delivery no se "reproduce y ya": cada cue del guión muta el estado del gráfico,
 * y los checkpoints PAUSAN y ceden el control al dock. La pausa en checkpoint es
 * decisión de Kristian, y su razón importa para el diseño: además de dar tiempo a
 * pensar, funciona como CHECK DE ATENCIÓN — si el estudiante no está, la sesión se
 * detiene ahí y ese silencio es señal. Por eso medimos el tiempo hasta su primera
 * acción y lo mandamos al servidor.
 */
import { CueEngine, type CueFiring } from "./player/sync";
import { BudgetGraph, estadoInicial } from "./graph/budget_graph";
import { Dock } from "./chat/dock";
import type { Ejemplo, GraphState, Lang, SessionInfo } from "./types";

const lang: Lang = (new URLSearchParams(location.search).get("lang") as Lang) || "es";

const T = {
  es: {
    empezar: "Empezar",
    preguntar: "✋ Preguntar",
    pausa: "Pausa",
    seguir: "Seguir",
    cargando: "Cargando…",
    cp1: "¿Qué le pasa a la línea si tu ingreso sube de 100 a 150?",
    cp2: "¿Por qué el intercepto del café no se mueve cuando sube el precio del almuerzo?",
    retomar: "Cuando quieras, seguimos.",
  },
  en: {
    empezar: "Start",
    preguntar: "✋ Ask",
    pausa: "Pause",
    seguir: "Resume",
    cargando: "Loading…",
    cp1: "What happens to the line if your income rises from 100 to 150?",
    cp2: "Why does the coffee intercept not move when the price of lunch rises?",
    retomar: "Whenever you're ready, we continue.",
  },
}[lang];

async function main(): Promise<void> {
  const app = document.getElementById("app")!;
  app.textContent = T.cargando;

  const r = await fetch("/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ concept_id: "budget-line", lang }),
  });
  const sesion: SessionInfo = await r.json();
  if (!sesion.media) {
    app.textContent = "El pack no tiene media compilada. Corre pipeline/cues.py.";
    return;
  }

  const packRes = await fetch(`/api/packs/budget-line?lang=${lang}`);
  const pack = await packRes.json();
  const ejemplo: Ejemplo = pack.ejemplo;

  app.textContent = "";
  app.innerHTML = `
    <div class="escenario">
      <h1 class="titulo">${sesion.titulo}</h1>
      <div class="lienzo"></div>
      <div class="controles">
        <button id="play" class="primario">${T.empezar}</button>
        <button id="ask" class="secundario">${T.preguntar}</button>
        <span id="reloj" class="reloj">0:00</span>
        <span id="desfase" class="desfase" title="desfase interno del motor de cues"></span>
      </div>
    </div>`;

  const escenario = app.querySelector(".escenario") as HTMLElement;
  const graph = new BudgetGraph(app.querySelector(".lienzo") as HTMLElement, ejemplo, lang);
  const dock = new Dock(app, lang);

  const audio = new Audio(`/media/budget-line/${sesion.media.audio}`);
  audio.preload = "metadata";

  let estado: GraphState = estadoInicial(ejemplo);
  graph.render(estado);

  const engine = new CueEngine(audio, sesion.media);
  let pausadoEn: { cp: string; ts: number } | null = null;

  engine.onCue((f: CueFiring) => {
    estado = aplicarCue(estado, f.cue.id, ejemplo);
    graph.render(estado);
    evento("cue.fired", { id: f.cue.id, desfase_ms: f.desfase_ms });

    if (f.cue.type === "checkpoint") {
      audio.pause();
      pausadoEn = { cp: f.cue.id, ts: performance.now() };
      dock.setEstado("abierto-activo");
      dock.decir(f.cue.id === "cp1" ? T.cp1 : T.cp2);
      evento("checkpoint.shown", { id: f.cue.id });
    }
    const d = engine.resumenDesfase();
    (document.getElementById("desfase") as HTMLElement).textContent =
      d.n ? `p95 ${d.p95}ms` : "";
  });

  /**
   * Reconstruye el gráfico tras un salto. Sin esto, saltar hacia adelante deja el
   * lienzo en blanco —los cues anteriores nunca dispararon— y saltar hacia atrás deja
   * el gráfico adelantado respecto a lo que se está oyendo. El estado del gráfico es
   * función pura del tiempo, así que se recalcula plegando todos los cues hasta `t`.
   */
  audio.addEventListener("seeked", () => {
    estado = estadoInicial(ejemplo);
    for (const c of engine.hasta(audio.currentTime)) {
      estado = aplicarCue(estado, c.id, ejemplo);
    }
    graph.render(estado);
    if (dock.actual === "abierto-activo") dock.setEstado("oculto");
  });

  // --- controles -----------------------------------------------------------
  const play = document.getElementById("play") as HTMLButtonElement;
  play.addEventListener("click", () => {
    if (audio.paused) { void audio.play(); } else { audio.pause(); }
  });
  audio.addEventListener("play", () => { play.textContent = T.pausa; escenario.dataset.on = "1"; });
  audio.addEventListener("pause", () => { play.textContent = T.seguir; });
  audio.addEventListener("timeupdate", () => {
    const t = Math.floor(audio.currentTime);
    (document.getElementById("reloj") as HTMLElement).textContent =
      `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  });

  // "Preguntar" pausa: el estudiante decide, el tutor nunca roba el control.
  document.getElementById("ask")!.addEventListener("click", () => {
    audio.pause();
    dock.setEstado("abierto-pasivo");
    evento("student.asked", {});
  });

  dock.onIntencion((id) => {
    // el tiempo hasta la primera acción tras un checkpoint ES la señal de atención
    if (pausadoEn) {
      evento("checkpoint.answered", {
        id: pausadoEn.cp,
        latencia_ms: Math.round(performance.now() - pausadoEn.ts),
        intencion: id,
      });
      pausadoEn = null;
    } else {
      evento("intencion", { id });
    }
    if (id === "listo") {
      dock.setEstado("oculto");
      dock.decir(T.retomar);
      void audio.play();
    }
  });

  // Gancho de instrumentación. Lo usan las pruebas de navegador y la medición del
  // criterio 5: expone el desfase interno sin necesidad de grabar la pantalla.
  (window as unknown as Record<string, unknown>).__tutoria = {
    audio, engine, dock,
    estado: () => estado,
    desfase: () => engine.resumenDesfase(),
  };

  function evento(type: string, payload: Record<string, unknown>): void {
    void fetch(`/api/session/${sesion.session_id}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, payload }),
    }).catch(() => { /* la telemetría nunca debe romper la sesión */ });
  }
}

/** El guión manda: cada cue tiene un efecto declarado sobre el gráfico. */
function aplicarCue(s: GraphState, id: string, e: Ejemplo): GraphState {
  const n: GraphState = { ...s, mostrar: { ...s.mostrar } };
  switch (id) {
    case "axes":         n.mostrar.ejes = true; break;
    case "budget_set":   n.mostrar.linea = true; break;
    case "budget_line":  n.mostrar.conjunto = true; break;
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
      n.destacar = "intercepto_x2";  // el que NO se mueve, que es lo que hay que ver
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
