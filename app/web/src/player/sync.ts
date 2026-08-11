/**
 * Motor de cues.
 *
 * Dispara `previousTime < cue.t <= currentTime`, que es idempotente: si `timeupdate`
 * llega tarde o el navegador salta un tick, el cue igual dispara una sola vez. La
 * tolerancia plana de ±250 ms que proponía el plan original NO servía, porque
 * `timeupdate` dispara cada ~250 ms en varios navegadores y una ventana de ese mismo
 * orden puede saltarse un cue entero.
 *
 * Además registra el desfase real entre el `t` programado y el `audio.currentTime` del
 * momento del disparo. Es la instrumentación en página que sustituye al método del
 * flash con celular (decisión de Kristian, 2026-08-10): no mide el desfase percibido,
 * pero sí el único sobre el que podemos actuar en código.
 */
import type { Cue, Timeline } from "../types";

export interface CueFiring {
  cue: Cue;
  programado: number;
  real: number;
  /** real − programado, en milisegundos. Positivo = disparó tarde. */
  desfase_ms: number;
}

type Handler = (f: CueFiring) => void;

export class CueEngine {
  private cues: Cue[];
  private handlers: Handler[] = [];
  private prev = -1;
  private disparados = new Set<string>();
  private ticking = false;
  /** Set when a prediction fires; cleared only by `play`. While it is set the engine
   *  fires nothing, so the reveal cannot slip through on the `timeupdate` that
   *  `pause()` itself emits. */
  private blocked = false;
  readonly telemetria: CueFiring[] = [];
  private rvfcId: number | null = null;
  private rafId: number | null = null;
  /** Qué reloj disparó de verdad. Lo lee el informe del bake-off; ver `resumenDesfase`. */
  private fuente: "timeupdate" | "rvfc" | "raf" = "timeupdate";

  /**
   * @param groseroForzado Obliga a usar solo `timeupdate` aunque el elemento ofrezca
   *   `requestVideoFrameCallback`.
   *
   *   Existe por una trampa de medición del bake-off, no por una necesidad del producto.
   *   La opción A monta `<audio>`, que NO tiene rVFC en ningún navegador, así que sondea
   *   con `timeupdate` cada ~250 ms. La opción B monta `<video>`, que sí la tiene y
   *   sondea por frame decodificado, ~16 ms. Comparar los desfases tal cual haría ganar
   *   a B el criterio 5 por diez veces — y el número no diría nada sobre vídeo contra
   *   SVG, solo sobre qué API de sondeo admite cada etiqueta HTML.
   *
   *   Con esto el informe puede dar las dos cifras y decir cuál es cuál: el desfase con
   *   el mejor reloj que cada opción tiene (lo que vive el estudiante) y el desfase sobre
   *   el reloj común (lo que compara las tecnologías). Las dos son legítimas; confundirlas
   *   es lo que convierte un bake-off en una profecía.
   */
  constructor(private audio: HTMLMediaElement, timeline: Timeline,
              private groseroForzado = false) {
    this.cues = timeline.cues
      .filter((c): c is Cue & { t: number } => c.t !== null)
      .sort((a, b) => a.t! - b.t!);

    this.audio.addEventListener("timeupdate", this.tick);
    this.audio.addEventListener("seeking", this.onSeek);
    this.audio.addEventListener("play", this.startFine);
    this.audio.addEventListener("play", this.unblock);
    this.audio.addEventListener("pause", this.stopFine);
  }

  onCue(h: Handler): void {
    this.handlers.push(h);
  }

  /**
   * Stops the rest of THIS tick and re-arms the cues that had not fired yet.
   *
   * A prediction mark shares its timestamp with the cue whose narration reveals the
   * answer — that is how it lands before the reveal. Without this, both fire in the
   * same tick and the graph would show the answer while the student is being asked to
   * predict it, which destroys the only thing a prediction is for. The handler calls
   * this; the deferred cues fire when playback resumes.
   */
  holdRest(): void {
    this.blocked = true;
  }

  /** Cues ya disparados hasta `t`. Lo usa el seek para reconstruir el estado. */
  hasta(t: number): Cue[] {
    return this.cues.filter((c) => c.t! <= t);
  }

  destroy(): void {
    const el = this.audio as HTMLVideoElement & {
      cancelVideoFrameCallback?: (id: number) => void;
    };
    if (this.rvfcId !== null && typeof el.cancelVideoFrameCallback === "function") {
      el.cancelVideoFrameCallback(this.rvfcId);
    }
    this.stopFine();
    this.audio.removeEventListener("timeupdate", this.tick);
    this.audio.removeEventListener("seeking", this.onSeek);
    this.audio.removeEventListener("play", this.startFine);
    this.audio.removeEventListener("play", this.unblock);
    this.audio.removeEventListener("pause", this.stopFine);
  }

  /**
   * `requestVideoFrameCallback` da resolución de frame, pero solo existe en <video> y
   * en navegadores recientes. En su ausencia — que incluye justo los navegadores
   * viejos del criterio 5 — el fallback es `timeupdate`, y por eso el disparo tiene
   * que ser por intervalo y no por proximidad.
   */
  private startFine = (): void => {
    const el = this.audio as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (this.groseroForzado) return;
    if (typeof el.requestVideoFrameCallback === "function") {
      this.fuente = "rvfc";
      const loop = (): void => {
        this.tick();
        if (!this.audio.paused) this.rvfcId = el.requestVideoFrameCallback!(loop);
      };
      this.rvfcId = el.requestVideoFrameCallback(loop);
      return;
    }
    // Sondeo con requestAnimationFrame para los elementos que no tienen rVFC — es decir,
    // todo `<audio>`, en todos los navegadores.
    //
    // Existe por una medición del bake-off. Con solo `timeupdate`, el desfase p95 de la
    // opción A salió 483-541 ms contra los 86-120 ms de la opción B, y era tentador
    // anotarlo como una ventaja del vídeo. No lo es: `<video>` expone rVFC y `<audio>` no,
    // pero `audio.currentTime` se puede leer en cada fotograma igual de bien. Los 500 ms
    // eran una omisión de diez líneas en NUESTRO código, no un límite del camino DOM, y
    // dejarlos habría hecho que el criterio 5 midiera nuestro descuido.
    //
    // El bucle solo corre mientras hay reproducción: `stopFine` lo corta en `pause`.
    // El `typeof` no es paranoia: este motor se ejecuta también fuera del navegador —la
    // prueba de invariantes lo corre en node— y allí `requestAnimationFrame` no existe.
    // Sin la guarda, el motor lanzaba en el primer `play`.
    if (typeof requestAnimationFrame !== "function") return;
    this.fuente = "raf";
    const rafLoop = (): void => {
      if (this.audio.paused) { this.rafId = null; return; }
      this.tick();
      this.rafId = requestAnimationFrame(rafLoop);
    };
    this.rafId = requestAnimationFrame(rafLoop);
  };

  private stopFine = (): void => {
    this.rvfcId = null;
    if (this.rafId !== null) {
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  private unblock = (): void => {
    this.blocked = false;
  };

  /** Un salto hacia atrás reabre los cues posteriores para que puedan volver a disparar. */
  private onSeek = (): void => {
    const t = this.audio.currentTime;
    if (t < this.prev) {
      for (const c of this.cues) if (c.t! > t) this.disparados.delete(c.id);
    }
    this.prev = t;
  };

  private tick = (): void => {
    // Reentrancy guard. `pause()` — which a prediction handler calls from inside this
    // very loop — can fire a synchronous `timeupdate`, re-entering tick. The inner call
    // used to reset `held` and fire the cue the prediction had just held back, so the
    // graph revealed the answer while the question was on screen. Found by running it,
    // not by reading it.
    if (this.ticking || this.blocked) return;
    this.ticking = true;
    try {
      this.tickInner();
    } finally {
      this.ticking = false;
    }
  };

  private tickInner(): void {
    const t = this.audio.currentTime;
    const desde = this.prev;
    this.prev = t;
    if (t < desde) return; // el seek ya se ocupó

    for (const c of this.cues) {
      if (c.t! <= desde || c.t! > t) continue;
      if (this.disparados.has(c.id)) continue;
      this.disparados.add(c.id);
      const f: CueFiring = {
        cue: c,
        programado: c.t!,
        real: t,
        desfase_ms: Math.round((t - c.t!) * 1000),
      };
      this.telemetria.push(f);
      for (const h of this.handlers) h(f);

      // Any cue that HANDS CONTROL AWAY blocks the rest of the tick, and the engine
      // enforces it rather than trusting the handler to call holdRest(). A prediction
      // shares its timestamp with the cue whose narration reveals the answer — that is
      // how it lands first — so if the loop continued, the graph would show the answer
      // while the question is on screen, which destroys the only thing a prediction is
      // for.
      //
      // The cooperative version (handler calls holdRest) did not work and cost two
      // rounds of wrong guesses. Ownership belongs here: the engine knows the cue type,
      // so it should not need anyone's cooperation to honour it.
      //
      // Widened from `prediction` to every non-graph cue after an audit of the M4 seam.
      // Checkpoints pause and hand control to the dock exactly as predictions do, but
      // only predictions blocked. No checkpoint shares a timestamp today, so nothing was
      // leaking — but the invariant held by accident, and the compiler assigns a shared
      // timestamp to any mark that has no narration after it. An author writing a
      // checkpoint immediately before its reveal cue would have shipped the answer next
      // to the question with nothing to catch it.
      if (c.type !== "graph") {
        this.blocked = true;
        // minus epsilon, NOT c.t: the next tick uses `c.t > desde`, so parking exactly
        // on the timestamp makes the deferred cue fail that test forever and the reveal
        // never lands. The prediction itself cannot re-fire — it is already in
        // `disparados`.
        this.prev = c.t! - 0.001;
        return;
      }
    }
  }

  /** p50 y p95 del desfase interno. Es el criterio 5 medido sin instrumentación externa.
   *
   *  `fuente` viaja con los números a propósito: un p95 de 8 ms y uno de 240 ms no se
   *  pueden poner en la misma columna si vienen de relojes distintos, y sin este campo
   *  nada en el informe recordaría preguntarlo. */
  resumenDesfase(): {
    n: number; p50: number; p95: number; max: number;
    fuente: "timeupdate" | "rvfc" | "raf";
  } {
    const v = this.telemetria.map((f) => f.desfase_ms).sort((a, b) => a - b);
    const fuente = this.fuente;
    if (!v.length) return { n: 0, p50: 0, p95: 0, max: 0, fuente };
    const q = (p: number): number => v[Math.min(v.length - 1, Math.floor(v.length * p))];
    return { n: v.length, p50: q(0.5), p95: q(0.95), max: v[v.length - 1], fuente };
  }
}
