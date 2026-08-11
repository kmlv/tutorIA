/**
 * MediaAdapter — the bake-off boundary (PLAN C5).
 *
 * Everything that differs between options A/B/C/D lives behind this interface;
 * everything that does not (judge, mastery, remediation, dock, data) is built once.
 * That turns the bake-off into a comparison *inside the real product* instead of four
 * orphan demos, and makes dropping an option cost one adapter rather than a rewrite.
 *
 *   A  HtmlAudioAdapter   <audio> + SVG/KaTeX animated by cues   (this file)
 *   B  Remotion           <video> MP4, cues drive pause/announce  (M4)
 *   C  Manim + audio      idem                                     (M4)
 *   D  hybrid             manim clips swapped in on cues           (M4)
 *
 * For B/C/D the cue engine does not change: the timeline is the same contract, and
 * `checkpoint` cues still pause. What changes is what paints the picture.
 */
import type { Timeline } from "../types";
import { CueEngine, type CueFiring } from "./sync";

/** `ended` is what starts the practice loop. The narration finishing is a transition,
 *  not the end of the lesson — and it was missing from this union, which is why nothing
 *  in the app could listen for it. */
export type MediaEvent =
  | "play" | "pause" | "timeupdate" | "seeked" | "loadedmetadata" | "ended";

export interface MediaAdapter {
  readonly variant: string;
  load(timeline: Timeline, srcBase: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(t: number): void;
  currentTime(): number;
  duration(): number;
  paused(): boolean;
  onCue(cb: (f: CueFiring) => void): void;
  /** Defers the remaining cues of the current tick until playback resumes. */
  holdRest(): void;
  /** Cues at or before `t`. Used to rebuild state after a seek. */
  cuesUntil(t: number): Array<{ id: string }>;
  on(event: MediaEvent, cb: () => void): void;
  off?(event: string, cb: () => void): void;
  /** Internal cue lag, in ms. Replaces external screen-recording measurement. */
  lagSummary(): { n: number; p50: number; p95: number; max: number };
  destroy(): void;
}

/** Option A: plain <audio> plus a DOM/SVG stage driven by cues. */
export class HtmlAudioAdapter implements MediaAdapter {
  readonly variant = "A";
  private audio = new Audio();
  private engine: CueEngine | null = null;

  async load(timeline: Timeline, srcBase: string): Promise<void> {
    this.audio.preload = "metadata";
    this.audio.src = `${srcBase}/${timeline.audio}`;
    this.engine = new CueEngine(this.audio, timeline);
  }

  play(): Promise<void> { return this.audio.play(); }
  pause(): void { this.audio.pause(); }
  seek(t: number): void { this.audio.currentTime = t; }
  currentTime(): number { return this.audio.currentTime; }
  duration(): number { return this.audio.duration || 0; }
  paused(): boolean { return this.audio.paused; }

  onCue(cb: (f: CueFiring) => void): void { this.engine?.onCue(cb); }
  holdRest(): void { this.engine?.holdRest(); }
  cuesUntil(t: number): Array<{ id: string }> { return this.engine?.hasta(t) ?? []; }

  on(event: MediaEvent,
     cb: () => void): void {
    this.audio.addEventListener(event, cb);
  }

  off(event: string, cb: () => void): void {
    this.audio.removeEventListener(event, cb);
  }

  lagSummary(): { n: number; p50: number; p95: number; max: number } {
    return this.engine?.resumenDesfase() ?? { n: 0, p50: 0, p95: 0, max: 0 };
  }

  destroy(): void {
    this.engine?.destroy();
    this.audio.pause();
    this.audio.src = "";
  }
}

/** Picks the adapter for a media variant. B/C/D land in M4. */
export function createAdapter(variant: string): MediaAdapter {
  switch (variant) {
    case "A":
      return new HtmlAudioAdapter();
    default:
      throw new Error(`media variant ${variant} not implemented yet (bake-off is M4)`);
  }
}
