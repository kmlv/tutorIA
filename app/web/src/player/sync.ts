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

  constructor(private audio: HTMLMediaElement, timeline: Timeline) {
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
    if (typeof el.requestVideoFrameCallback !== "function") return;
    const loop = (): void => {
      this.tick();
      if (!this.audio.paused) this.rvfcId = el.requestVideoFrameCallback!(loop);
    };
    this.rvfcId = el.requestVideoFrameCallback(loop);
  };

  private stopFine = (): void => {
    this.rvfcId = null;
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

  /** p50 y p95 del desfase interno. Es el criterio 5 medido sin instrumentación externa. */
  resumenDesfase(): { n: number; p50: number; p95: number; max: number } {
    const v = this.telemetria.map((f) => f.desfase_ms).sort((a, b) => a - b);
    if (!v.length) return { n: 0, p50: 0, p95: 0, max: 0 };
    const q = (p: number): number => v[Math.min(v.length - 1, Math.floor(v.length * p))];
    return { n: v.length, p50: q(0.5), p95: q(0.95), max: v[v.length - 1] };
  }
}
