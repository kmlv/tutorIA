/**
 * Question flow: mount a question in the dock, submit it, show what comes back.
 *
 * The verdict is never decided here. The client posts what the student produced and the
 * server answers; if the browser knew the right answer the student could read it in the
 * bundle. When the server detects a misconception it returns the socratic probe that is
 * already written in the curated catalogue — the student never sees the raw id, which
 * is instructor-facing (decision 6).
 */
import type { Dock } from "../chat/dock";
import type { Lang } from "../types";
import { render, type ManipValue, type QuestionSpec, type Respuesta } from "./index";

export interface Verdict {
  correcta: boolean;
  score: number;
  socratica?: string;
}

const T = {
  es: { bien: "Correcto.", pensemos: "Vamos a pensarlo distinto.", error: "No pude enviar tu respuesta." },
  en: { bien: "Correct.", pensemos: "Let's think about it differently.", error: "I couldn't submit your answer." },
};

export class QuestionFlow {
  constructor(
    private sessionId: string,
    private dock: Dock,
    private lang: Lang,
  ) {}

  /** Mounts the question and resolves with the verdict once the student answers. */
  ask(q: QuestionSpec, conAndamiaje = false): Promise<Verdict> {
    return new Promise((resolve) => {
      const node = render(q, this.lang, async (r: Respuesta) => {
        const v = await this.submit(r);
        this.report(v);
        resolve(v);
      }, conAndamiaje);
      this.dock.setEstado("abierto-activo");
      this.dock.montarPregunta(node);
    });
  }

  /** For manipulation questions the graph, not a form, produces the answer. */
  async submitManip(questionId: string, valor: ManipValue,
                    conAndamiaje = false): Promise<Verdict> {
    const v = await this.submit({
      question_id: questionId, modalidad: "manip", valor, con_andamiaje: conAndamiaje,
    });
    this.report(v);
    return v;
  }

  private async submit(r: Respuesta): Promise<Verdict> {
    try {
      const res = await fetch(`/api/session/${this.sessionId}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question_id: r.question_id, valor: r.valor, con_andamiaje: r.con_andamiaje,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Verdict;
    } catch {
      this.dock.decir(T[this.lang].error);
      return { correcta: false, score: 0 };
    }
  }

  private report(v: Verdict): void {
    if (v.correcta) {
      this.dock.decir(T[this.lang].bien);
      return;
    }
    // R1 of the remediation table: a named misconception on its first appearance gets a
    // socratic probe, never a correction. The student is not told they were wrong in so
    // many words — they are asked something that makes the contradiction visible.
    this.dock.decir(v.socratica ?? T[this.lang].pensemos);
  }
}
