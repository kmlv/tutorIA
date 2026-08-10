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
  readonly telemetria: CueFiring[] = [];
  private rvfcId: number | null = null;

  constructor(private audio: HTMLMediaElement, timeline: Timeline) {
    this.cues = timeline.cues
      .filter((c): c is Cue & { t: number } => c.t !== null)
      .sort((a, b) => a.t! - b.t!);

    this.audio.addEventListener("timeupdate", this.tick);
    this.audio.addEventListener("seeking", this.onSeek);
    this.audio.addEventListener("play", this.startFine);
    this.audio.addEventListener("pause", this.stopFine);
  }

  onCue(h: Handler): void {
    this.handlers.push(h);
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

  /** Un salto hacia atrás reabre los cues posteriores para que puedan volver a disparar. */
  private onSeek = (): void => {
    const t = this.audio.currentTime;
    if (t < this.prev) {
      for (const c of this.cues) if (c.t! > t) this.disparados.delete(c.id);
    }
    this.prev = t;
  };

  private tick = (): void => {
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
    }
  };

  /** p50 y p95 del desfase interno. Es el criterio 5 medido sin instrumentación externa. */
  resumenDesfase(): { n: number; p50: number; p95: number; max: number } {
    const v = this.telemetria.map((f) => f.desfase_ms).sort((a, b) => a - b);
    if (!v.length) return { n: 0, p50: 0, p95: 0, max: 0 };
    const q = (p: number): number => v[Math.min(v.length - 1, Math.floor(v.length * p))];
    return { n: v.length, p50: q(0.5), p95: q(0.95), max: v[v.length - 1] };
  }
}
