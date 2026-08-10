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
  /** Recta previa, para dibujar el "antes" al comparar desplazamiento vs pivote. */
  fantasma: { p1: number; p2: number; m: number } | null;
  destacar: "ninguno" | "intercepto_x1" | "intercepto_x2" | "pendiente";
}
