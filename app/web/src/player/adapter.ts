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

  /**
   * Whether this adapter paints the picture itself.
   *
   * This flag exists because the app used to assume, everywhere and silently, that the
   * DOM stage was the only thing on screen: `graph.render()` and `paintLedger()` ran on
   * every cue with no notion that someone else might own the frame. Under a video that
   * is not a cosmetic clash — it is the same content drawn twice, once baked into the
   * MP4 and once painted over it, sliding apart by whatever the cue lag happens to be.
   *
   * It is deliberately NOT "does this adapter use video". Ownership can change within a
   * session: practice is interactive, and no pre-rendered frame can be dragged, so the
   * DOM takes the stage back when the narration ends. See `releaseStage`.
   */
  readonly ownsStage: boolean;

  /** Where the adapter may attach its own element. Audio has nothing to attach. */
  mount?(stage: HTMLElement): void;

  /** Hands the picture back to the DOM: the interactive phase begins. Idempotent. */
  releaseStage?(): void;

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
  /** Internal cue lag, in ms. Replaces external screen-recording measurement.
   *  `fuente` says which clock produced it — the numbers are not comparable across
   *  clocks, and the bake-off report has to be able to say so. */
  lagSummary(): {
    n: number; p50: number; p95: number; max: number;
    fuente: "timeupdate" | "rvfc";
  };
  destroy(): void;
}

/** Option A: plain <audio> plus a DOM/SVG stage driven by cues. */
export class HtmlAudioAdapter implements MediaAdapter {
  readonly variant = "A";
  /** Audio paints nothing. The DOM stage is the whole picture, always. */
  readonly ownsStage = false;
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

  lagSummary(): {
    n: number; p50: number; p95: number; max: number;
    fuente: "timeupdate" | "rvfc";
  } {
    return this.engine?.resumenDesfase()
      ?? { n: 0, p50: 0, p95: 0, max: 0, fuente: "timeupdate" as const };
  }

  destroy(): void {
    this.engine?.destroy();
    this.audio.pause();
    this.audio.src = "";
  }
}

/**
 * Option B: a pre-rendered MP4 (Remotion) that carries both narration and picture.
 *
 * The cue engine is unchanged and that is the point — it was the bet this whole seam
 * was built on, and until now nothing had tested it. The timeline is the same contract:
 * the same cue ids at the same seconds, checkpoints still pause, `?t=` still rebuilds.
 * What changes is only who draws.
 *
 * The DOM stage is hidden rather than removed. Practice needs it back: a manipulation
 * item asks the student to drag a line, and no frame of an MP4 can be dragged. So the
 * video owns the stage for the narration and gives it back for the interactive phase,
 * which is why `ownsStage` is a getter and not a constant.
 */
export class VideoAdapter implements MediaAdapter {
  readonly variant = "B";
  private video = document.createElement("video");
  private engine: CueEngine | null = null;
  private lienzo: HTMLElement | null = null;
  private soltado = false;

  /** Forces the coarse clock so criterion 5 compares like with like. See `CueEngine`. */
  constructor(private relojGrosero = false) {}

  get ownsStage(): boolean { return !this.soltado; }

  mount(stage: HTMLElement): void {
    this.lienzo = stage.querySelector(".lienzo");
    this.video.className = "video-escenario";
    this.video.playsInline = true;
    this.video.preload = "metadata";
    // No `controls`: the app owns play/pause, the checkpoints pause on their own, and a
    // native scrubber would let the student skate past a checkpoint without answering —
    // which is the one interaction the lesson design does not allow.
    stage.prepend(this.video);
    if (this.lienzo) this.lienzo.style.display = "none";
  }

  releaseStage(): void {
    if (this.soltado) return;
    this.soltado = true;
    this.video.style.display = "none";
    if (this.lienzo) this.lienzo.style.display = "";
  }

  async load(timeline: Timeline, srcBase: string): Promise<void> {
    if (!timeline.video) {
      // Explicit, because the silent version of this is a black rectangle and a clock
      // that runs: `<video src="">` fails without throwing, and the cue engine would
      // keep reporting healthy lag against a video that never existed.
      throw new Error(
        `timeline ${timeline.lang}/${timeline.variant} has no video field — ` +
        "render it with `npm run render` in bakeoff/remotion",
      );
    }
    this.video.src = `${srcBase}/${timeline.video}`;
    this.engine = new CueEngine(this.video, timeline, this.relojGrosero);
  }

  play(): Promise<void> { return this.video.play(); }
  pause(): void { this.video.pause(); }
  seek(t: number): void { this.video.currentTime = t; }
  currentTime(): number { return this.video.currentTime; }
  duration(): number { return this.video.duration || 0; }
  paused(): boolean { return this.video.paused; }

  onCue(cb: (f: CueFiring) => void): void { this.engine?.onCue(cb); }
  holdRest(): void { this.engine?.holdRest(); }
  cuesUntil(t: number): Array<{ id: string }> { return this.engine?.hasta(t) ?? []; }

  on(event: MediaEvent, cb: () => void): void {
    this.video.addEventListener(event, cb);
  }

  off(event: string, cb: () => void): void {
    this.video.removeEventListener(event, cb);
  }

  lagSummary(): {
    n: number; p50: number; p95: number; max: number;
    fuente: "timeupdate" | "rvfc";
  } {
    return this.engine?.resumenDesfase()
      ?? { n: 0, p50: 0, p95: 0, max: 0, fuente: "timeupdate" as const };
  }

  destroy(): void {
    this.engine?.destroy();
    this.video.pause();
    this.video.src = "";
    this.video.remove();
  }
}

/** Picks the adapter for a media variant. C/D were dropped from M4 on evidence — see
 *  `bakeoff/00-barrido-provisional.md`. */
export function createAdapter(variant: string, relojGrosero = false): MediaAdapter {
  switch (variant) {
    case "A":
      return new HtmlAudioAdapter();
    case "B":
      return new VideoAdapter(relojGrosero);
    default:
      throw new Error(`media variant ${variant} not implemented (M4 built A and B)`);
  }
}
