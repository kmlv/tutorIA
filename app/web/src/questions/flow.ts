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

/**
 * Two different replies come back from `/answer`, and conflating them was a real bug
 * waiting to happen.
 *
 * A deterministic item returns `{correcta, score}`. An OPEN item, while the LLM judge is
 * in shadow mode, returns `{registrada, mensaje}` and no verdict at all — because the
 * judge is not trusted yet to tell a student they were wrong. Casting that second shape
 * into the first gives `correcta === undefined`, which is falsy, and the student would
 * have been told "let's think about it differently" every single time they answered an
 * open question correctly.
 */
export interface Verdict {
  correcta?: boolean;
  score?: number;
  socratica?: string;
  /** Present iff the judge ran in shadow: the answer was recorded, not graded. */
  registrada?: boolean;
  mensaje?: string;
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
  ask(q: QuestionSpec, opts: { conAndamiaje?: boolean; silent?: boolean } = {}): Promise<Verdict> {
    return new Promise((resolve) => {
      const node = render(q, this.lang, async (r: Respuesta) => {
        const v = await this.submit(r);
        // `silent` is for predictions: the reveal that follows is what teaches, and
        // saying "wrong" first would spend the surprise the prediction just bought.
        if (!opts.silent) this.report(v);
        resolve(v);
      }, opts.conAndamiaje ?? false);
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

  /** Cuándo se pintó el ítem que el alumno tiene delante. Lo pone `ask`/`submitManip`.
   *
   *  Es una COVARIABLE que se guarda, nunca una entrada de ninguna regla: ningún veredicto
   *  ni marca se condiciona a ella. Un suelo de latencia como criterio anularía verdaderos
   *  positivos —ejecutar una receta de memoria es rápido y confundirse de verdad es lento—
   *  y conservaría los confusores. Y NO es `latency_ms`, que es la latencia del juez. */
  private pintadoEn: number | null = null;

  marcarPintado(): void {
    this.pintadoEn = performance.now();
  }

  private async submit(r: Respuesta): Promise<Verdict> {
    const think = this.pintadoEn === null
      ? null : Math.round(performance.now() - this.pintadoEn);
    this.pintadoEn = null;
    try {
      const res = await fetch(`/api/session/${this.sessionId}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question_id: r.question_id, valor: r.valor, con_andamiaje: r.con_andamiaje,
          think_ms: think,
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
    if (v.registrada) {
      // Shadow mode: the judge produced a verdict and it is NOT shown. Saying anything
      // evaluative here would leak an unvalidated judgement to the student, which is
      // the exact harm shadow mode exists to prevent.
      this.dock.decir(v.mensaje ?? "");
      return;
    }
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
