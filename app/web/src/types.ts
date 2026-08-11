/** Tipos del contrato servidor→cliente. Espejo de app/server/core/content/schema.py. */

export type Lang = "es" | "en";
export type CueType = "graph" | "checkpoint";

export interface Cue {
  id: string;
  type: CueType;
  t: number | null;
}

export interface Timeline {
  pack: string;
  lang: Lang;
  audio: string;
  duration_s: number;
  sync_granularity: string;
  cues: Cue[];
  /** Sentence-level transcript, added by pipeline/cues.py. Drives the caption band. */
  transcript?: Array<{ text: string; start_s: number; end_s: number; part_index: number }>;
}

export interface Checkpoint {
  id: string;
  despues_de_cue: string;
  pregunta_ref: string;
}

export interface SessionInfo {
  session_id: string;
  concept_id: string;
  titulo: string;
  media: Timeline | null;
  checkpoints: Checkpoint[];
}

/** Parámetros del ejemplo: los mismos que el guión narra. */
export interface Ejemplo {
  p1: number;
  p2: number;
  m: number;
  bien_1: Record<Lang, string>;
  bien_2: Record<Lang, string>;
}

/** Estado del gráfico en un instante. El cue engine lo muta; el SVG lo refleja. */
export interface GraphState {
  p1: number;
  p2: number;
  m: number;
  mostrar: {
    ejes: boolean;
    linea: boolean;
    interceptos: boolean;
    conjunto: boolean;
    pendiente: boolean;
  };
  /** Previous line, to draw the "before" when comparing a shift against a pivot. */
  fantasma: { p1: number; p2: number; m: number } | null;
  destacar: "ninguno" | "intercepto_x1" | "intercepto_x2" | "pendiente";
  /** Sample bundles scattered on the plane. They appear when the narration says
   *  "every bundle is a point", and become the EVIDENCE for the budget set: once the
   *  region is shaded, some of them are visibly inside and some outside. That is
   *  BL-M4 ("the line IS the set") attacked visually instead of stated. */
  muestras: Array<{ x1: number; x2: number }>;
  /** Emphasis on the boundary, for the moment the narration says the line is only the
   *  edge of the region. Without it that sentence has no visual counterpart. */
  enfasis: "ninguno" | "frontera";
}
