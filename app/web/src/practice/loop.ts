/**
 * The practice loop: what happens after the narration ends.
 *
 * Until now the lesson simply stopped when the audio did. Everything the server learned
 * about the student — the mastery state, the item selector, the remediation ladder —
 * existed and was never reached by any screen. This is the screen.
 *
 * The client asks `/next` and renders whatever comes back. It does NOT decide what to
 * ask, does not know the mastery criterion, and does not know which sub-skill is weak.
 * That is not tidiness for its own sake: a selector living in the browser would ship the
 * mastery rules in the bundle, and the rules reference the answer key.
 *
 * The loop also never tells the student they are "done because they mastered it" versus
 * "done because we ran out of questions". `done` carries which, and only the instructor
 * view distinguishes them — a student told the bank ran dry learns something about our
 * content, not about budget lines.
 */
import type { Dock } from "../chat/dock";
import type { QuestionFlow, Verdict } from "../questions/flow";
import type { QuestionSpec } from "../questions";
import type { Lang } from "../types";

/** Mounts the graph interaction for a manipulation item and resolves once the student
 *  confirms. Supplied by `main.ts`, which owns the graph — the loop must not, or it
 *  would need the graph to exist before practice can be tested at all. */
export type ManipHandler = (
  q: QuestionSpec, modo: "point" | "line",
) => Promise<Verdict>;

/** What `/api/session/{id}/next` returns. Deliberately narrower than `/mastery`: no
 *  misconception ids, no blockers, no sub-skill names. */
export interface NextPayload {
  done: string | null;
  question?: {
    id: string;
    modalidad: QuestionSpec["modalidad"];
    /** Already in the session's language — the server localises, the client does not. */
    enunciado: string;
    opciones: string[] | null;
    /** For `manip` only: which gesture to mount. Never where the answer is. */
    manip_modo?: "point" | "line" | null;
  };
  socratica?: string;
}

const T = {
  es: {
    empezamos: "Vamos a practicar un poco.",
    listo: "Eso es todo por ahora. Buen trabajo.",
    error: "No pude traer la siguiente pregunta.",
    sinGrafico: "Esta pregunta necesita el gráfico y aquí no está disponible.",
    seguir: "Practicar",
  },
  en: {
    empezamos: "Let's practise a little.",
    listo: "That's it for now. Nice work.",
    error: "I couldn't fetch the next question.",
    sinGrafico: "This question needs the graph, which isn't available here.",
    seguir: "Practise",
  },
};

/** A hard stop on iterations. Not a policy — a bug net. If a server change ever made
 *  `/next` return the same item forever, the student would see an infinite quiz and the
 *  browser would hammer the endpoint. The server's own selector already refuses to
 *  repeat the previous item. */
const MAX_ITEMS = 40;

export class PracticeLoop {
  private running = false;
  private served = 0;

  constructor(
    private sessionId: string,
    private dock: Dock,
    private flow: QuestionFlow,
    private lang: Lang,
    private onEvent: (type: string, payload: Record<string, unknown>) => void,
    private onManip: ManipHandler | null = null,
  ) {}

  get active(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.served = 0;
    this.dock.setEstado("abierto-activo");
    this.dock.decir(T[this.lang].empezamos);
    this.onEvent("practice.started", {});
    try {
      await this.step();
    } finally {
      this.running = false;
    }
  }

  private async step(): Promise<void> {
    while (this.served < MAX_ITEMS) {
      const next = await this.fetchNext();
      if (!next) {
        this.dock.decir(T[this.lang].error);
        return;
      }
      if (!next.question) {
        // `done` is `concept_mastered` or `bank_exhausted`. The student hears the same
        // sentence either way; the distinction is the instructor's.
        this.dock.decir(T[this.lang].listo);
        this.onEvent("practice.finished", { done: next.done, served: this.served });
        return;
      }

      // The socratic probe arrives BEFORE the question it accompanies, because it is
      // what reframes the thing the student just got wrong. Showing it after would make
      // it read as an explanation of a mistake instead of a way into the next attempt.
      if (next.socratica) this.dock.decir(next.socratica);

      const spec = toSpec(next.question);
      const modo = next.question.manip_modo ?? null;

      if (spec.modalidad === "manip") {
        if (!this.onManip || !modo) {
          // Better to stop than to render an instruction with no way to answer. A
          // manipulation item with no graph handler is an item the student cannot
          // possibly submit, and the loop would sit on it forever.
          this.dock.decir(T[this.lang].sinGrafico);
          this.onEvent("practice.blocked", { question_id: spec.id, why: "no manip handler" });
          return;
        }
      }

      const t0 = performance.now();
      const v = spec.modalidad === "manip" && this.onManip && modo
        ? await this.onManip(spec, modo)
        : await this.flow.ask(spec, {});
      this.served += 1;
      this.onEvent("practice.answered", {
        question_id: spec.id,
        correcta: v.correcta ?? null,
        shadow: v.registrada === true,
        latency_ms: Math.round(performance.now() - t0),
      });
    }
    this.onEvent("practice.capped", { served: this.served });
  }

  private async fetchNext(): Promise<NextPayload | null> {
    try {
      const r = await fetch(`/api/session/${this.sessionId}/next`);
      if (!r.ok) throw new Error(String(r.status));
      return (await r.json()) as NextPayload;
    } catch {
      return null;
    }
  }
}

/**
 * `/next` sends ONE localised string; `QuestionSpec` carries both languages, because the
 * delivery path reads questions straight out of the bilingual pack.
 *
 * The string is mirrored into both slots rather than placed under the active language
 * and left empty in the other. Only one is ever read — the renderer indexes with the
 * language it was constructed with — but an empty slot is a blank question stem waiting
 * for the day someone renders with the other language, and mirroring costs nothing.
 */
function toSpec(q: NonNullable<NextPayload["question"]>): QuestionSpec {
  const both = (s: string): Record<Lang, string> => ({ es: s, en: s });
  return {
    id: q.id,
    modalidad: q.modalidad,
    enunciado: both(q.enunciado),
    opciones: (q.opciones ?? undefined)?.map((o) => both(o)),
  };
}

export { T as PRACTICE_TEXT };
