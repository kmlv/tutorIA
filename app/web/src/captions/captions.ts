import "./captions.css";

export interface TranscriptSegment {
  text: string;
  start_s: number;
  end_s: number;
  part_index: number;
}

export interface CaptionsCopy {
  captions: string;
  hide: string;
  show: string;
  transcript: string;
  closeTranscript: string;
}

const COPY: Record<"en" | "es", CaptionsCopy> = {
  en: {
    captions: "Captions",
    hide: "Hide captions",
    show: "Show captions",
    transcript: "Transcript",
    closeTranscript: "Close transcript",
  },
  es: {
    captions: "Subtítulos",
    hide: "Ocultar subtítulos",
    show: "Mostrar subtítulos",
    transcript: "Transcripción",
    closeTranscript: "Cerrar transcripción",
  },
};

/** Finds the latest sentence whose interval contains `time`, including overlaps. */
export function segmentAt(segments: readonly TranscriptSegment[], time: number): number {
  let low = 0;
  let high = segments.length - 1;
  let candidate = -1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    if (segments[middle].start_s <= time) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return candidate >= 0 && time <= segments[candidate].end_s ? candidate : -1;
}

/**
 * Persistent bottom-band captions plus an on-demand full transcript.
 *
 * Call `update` from `timeupdate` and `seeked`. DOM and aria-live are mutated only
 * when the sentence changes, so frequent media events never make a screen reader
 * repeat the same sentence.
 */
export class CaptionBand {
  readonly element: HTMLElement;
  private readonly current: HTMLParagraphElement;
  private readonly toggle: HTMLButtonElement;
  private readonly details: HTMLDetailsElement;
  private readonly rows: HTMLOListElement;
  private activeIndex = -2;
  private fallback = "";
  private visible = true;

  constructor(
    host: HTMLElement,
    private readonly segments: readonly TranscriptSegment[],
    lang: "en" | "es",
  ) {
    const copy = COPY[lang];
    const section = document.createElement("section");
    section.className = "caption-band";
    section.setAttribute("aria-label", copy.captions);

    const bar = document.createElement("div");
    bar.className = "caption-bar";
    this.current = document.createElement("p");
    this.current.className = "caption-current";
    this.current.setAttribute("aria-live", "polite");
    this.current.setAttribute("aria-atomic", "true");

    const actions = document.createElement("div");
    actions.className = "caption-actions";
    this.toggle = document.createElement("button");
    this.toggle.type = "button";
    this.toggle.className = "caption-toggle";
    this.toggle.textContent = copy.hide;
    this.toggle.setAttribute("aria-pressed", "true");

    this.details = document.createElement("details");
    this.details.className = "transcript";
    const summary = document.createElement("summary");
    summary.textContent = copy.transcript;
    summary.dataset.openLabel = copy.closeTranscript;
    summary.dataset.closedLabel = copy.transcript;
    this.rows = document.createElement("ol");
    this.rows.className = "transcript-list";
    this.rows.setAttribute("aria-label", copy.transcript);
    segments.forEach((segment) => {
      const row = document.createElement("li");
      row.className = "transcript-row";
      row.textContent = segment.text;
      this.rows.appendChild(row);
    });
    this.details.append(summary, this.rows);
    actions.append(this.toggle, this.details);
    bar.append(this.current, actions);
    section.appendChild(bar);
    host.appendChild(section);
    this.element = section;

    this.toggle.addEventListener("click", () => {
      this.visible = !this.visible;
      this.current.hidden = !this.visible;
      this.current.setAttribute("aria-live", this.visible ? "polite" : "off");
      this.toggle.textContent = this.visible ? copy.hide : copy.show;
      this.toggle.setAttribute("aria-pressed", String(this.visible));
    });
    this.details.addEventListener("toggle", () => {
      summary.textContent = this.details.open
        ? summary.dataset.openLabel ?? copy.closeTranscript
        : summary.dataset.closedLabel ?? copy.transcript;
      if (this.details.open) this.scrollActiveIntoView();
    });
  }

  update(time: number, fallbackText = ""): void {
    const nextIndex = segmentAt(this.segments, time);
    const nextFallback = nextIndex === -1 ? fallbackText : "";
    if (nextIndex === this.activeIndex && nextFallback === this.fallback) return;

    if (this.activeIndex >= 0) this.row(this.activeIndex)?.removeAttribute("aria-current");
    this.activeIndex = nextIndex;
    this.fallback = nextFallback;
    this.current.textContent = nextIndex >= 0 ? this.segments[nextIndex].text : nextFallback;
    if (nextIndex >= 0) {
      this.row(nextIndex)?.setAttribute("aria-current", "true");
      this.scrollActiveIntoView();
    }
  }

  private row(index: number): HTMLLIElement | undefined {
    return this.rows.children.item(index) as HTMLLIElement | null ?? undefined;
  }

  private scrollActiveIntoView(): void {
    if (!this.details.open || this.activeIndex < 0) return;
    this.row(this.activeIndex)?.scrollIntoView({ block: "nearest" });
  }
}

/** Short integration name used by the display orchestrator. */
export { CaptionBand as Captions };
