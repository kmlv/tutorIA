/**
 * Option B of the bake-off: the lesson pre-rendered to MP4.
 *
 * The props are NOT hand-written. `pipeline/render_b.py` folds the same timeline option
 * A plays through the same state machine (`app/web/src/graph/state.ts`) and emits one
 * beat per cue carrying the resulting `GraphState`. This component only draws a state it
 * is handed.
 *
 * That constraint is the whole reason the arm is worth building. A hand-typed set of
 * beats would score whatever I typed on criterion 2 ("change the income, change the
 * prices") and would say nothing about Remotion. Fed from the shared machine, the
 * question becomes the real one: given that the beats regenerate for free, what does it
 * still cost to get a new MP4 in front of a student?
 *
 * Geometry mirrors `budget_graph.ts` — same 1.6x headroom, same fixed scale. Fixed
 * matters pedagogically: if the axes rescaled when `m` changes, a parallel shift would
 * look identical to a pivot and the lesson's central contrast would vanish.
 */
import React from 'react';
import {
  AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';

export type GraphState = {
  p1: number; p2: number; m: number;
  mostrar: {
    ejes: boolean; linea: boolean; interceptos: boolean;
    conjunto: boolean; pendiente: boolean;
  };
  fantasma: {p1: number; p2: number; m: number} | null;
  destacar: 'ninguno' | 'intercepto_x1' | 'intercepto_x2' | 'pendiente';
};

export type Beat = {
  cue: string;
  t: number;
  estado: GraphState;
  caption: string;
};

export type LessonProps = {
  beats: Beat[];
  audio: string;
  /** Axis labels come from the pack, not from this file: the goods are configurable. */
  bien1: string;
  bien2: string;
  titulo: string;
  /** Fixed scale, computed once from the pack's example. See the note above. */
  maxX: number;
  maxY: number;
};

const W = 1120;
const H = 920;
const PAD = {l: 124, r: 56, t: 68, b: 128};

/**
 * Los tokens de `app/web/src/styles.css`, copiados a mano.
 *
 * Copiados y no importados porque el render corre en otro proyecto de node, y las
 * variables CSS no existen fuera del navegador. Que estén duplicados es una deuda real y
 * es también un dato del criterio 4: un tema pre-renderizado no puede seguir al de la
 * página.
 *
 * Se cambiaron del oscuro que traía el reconocimiento al claro de la app tras mirar la
 * primera captura del criterio 1: un recuadro oscuro flotando en una página clara habría
 * hecho perder a B por una decisión de paleta mía. Y la limitación de fondo queda escrita
 * y no borrada: la opción A cambia de tema con el sistema —tiene su bloque
 * `prefers-color-scheme`— y este MP4 no puede. Un alumno en modo oscuro verá exactamente
 * el problema que esta corrección acaba de quitarle a un alumno en modo claro.
 */
const COLOR = {
  fondo: '#fbfbf9',
  eje: '#75756e',
  linea: '#0b5cff',
  fantasma: '#b9b9b2',
  conjunto: '#0b5cff',
  destaque: '#c2620a',
  texto: '#22221f',
  tenue: '#75756e',
};

export const Lesson: React.FC<LessonProps> = ({
  beats, audio, bien1, bien2, maxX, maxY,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // The beat in force at this instant. Linear scan over ~10 beats: a binary search here
  // would be faster and would also be the kind of cleverness that silently picks the
  // wrong beat at an exact boundary, which is where every cue lands.
  const sorted = [...beats].sort((a, b) => a.t - b.t);
  let b = sorted[0];
  for (const cand of sorted) if (t >= cand.t) b = cand;
  const s = b.estado;
  const desde = t - b.t;

  const px = (x: number): number => PAD.l + (x / maxX) * (W - PAD.l - PAD.r);
  const py = (y: number): number => H - PAD.b - (y / maxY) * (H - PAD.t - PAD.b);

  const ix = s.m / s.p1;
  const iy = s.m / s.p2;
  // Half a second of fade on each change. Enough to read as motion, short enough that
  // the picture is settled before the narration moves on — the cue timestamps come from
  // the spoken script and do not wait for an animation to finish.
  const ap = interpolate(desde, [0, 0.5], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const r1 = s.destacar === 'intercepto_x1' ? 14 : 9;
  const r2 = s.destacar === 'intercepto_x2' ? 14 : 9;

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.fondo, fontFamily: 'Helvetica, Arial'}}>
      <Audio src={staticFile(audio)} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Sin título: la app ya lo pinta arriba, en DOM y seleccionable. Estaba
            duplicado en la primera captura. */}
        {s.mostrar.ejes && (
          <g stroke={COLOR.eje} strokeWidth={3}>
            <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} />
          </g>
        )}
        {/* El nombre del eje va en su propia línea, por debajo de donde caen los valores
            de los interceptos. Con el ingreso a 150 el intercepto se va a 50 y su etiqueta
            se montaba encima de "x₁ — café": las dos ilegibles. La opción A ya lo tenía
            resuelto porque su escenario pasó revisiones de diseño y este no; corregirlo
            antes de puntuar el criterio 1 es lo que impide que la rúbrica mida cuál de los
            dos pulí más. */}
        {s.mostrar.ejes && (
          <g fontSize={28}>
            <text x={W - PAD.r} y={H - PAD.b + 86} fill={COLOR.texto} textAnchor="end">
              x₁ — {bien1}
            </text>
            <text x={PAD.l + 12} y={PAD.t + 6} fill={COLOR.texto}>x₂ — {bien2}</text>
          </g>
        )}

        {s.mostrar.conjunto && (
          <polygon
            points={`${px(0)},${py(0)} ${px(0)},${py(iy)} ${px(ix)},${py(0)}`}
            fill={COLOR.conjunto} fillOpacity={0.26 * ap}
          />
        )}

        {/* The ghost is the "before" of a shift or a pivot. Drawn under the live line so
            the comparison reads as one picture and not as two overlapping charts. */}
        {s.fantasma && (
          <line
            x1={px(0)} y1={py(s.fantasma.m / s.fantasma.p2)}
            x2={px(s.fantasma.m / s.fantasma.p1)} y2={py(0)}
            stroke={COLOR.fantasma} strokeWidth={3} strokeDasharray="10 8"
          />
        )}

        {s.mostrar.linea && (
          <line
            x1={px(0)} y1={py(iy)} x2={px(ix)} y2={py(0)}
            stroke={COLOR.linea} strokeWidth={6} opacity={ap}
          />
        )}

        {s.mostrar.interceptos && (
          <g>
            <circle cx={px(ix)} cy={py(0)} r={r1} fill={COLOR.destaque} />
            <rect
              x={px(0) - r2} y={py(iy) - r2} width={r2 * 2} height={r2 * 2}
              fill={COLOR.destaque}
            />
            <text x={px(ix)} y={py(0) + 40} fill={COLOR.destaque} fontSize={30}
                  textAnchor="middle">
              {ix.toFixed(1)}
            </text>
            <text x={px(0) - 22} y={py(iy) + 10} fill={COLOR.destaque} fontSize={30}
                  textAnchor="end">
              {iy.toFixed(0)}
            </text>
          </g>
        )}

        {s.mostrar.pendiente && (
          <text
            x={px(ix / 2) + 40} y={py(iy / 2) - 24}
            fill={s.destacar === 'pendiente' ? COLOR.destaque : COLOR.texto} fontSize={36}
          >
            −p₁/p₂ = −{(s.p1 / s.p2).toFixed(2)}
          </text>
        )}

        {/* El subtítulo NO se quema en el vídeo: la app ya tiene su banda de subtítulos,
            que además avanza frase a frase mientras un beat dura veinte segundos. Tenerlos
            los dos ponía dos textos distintos en pantalla a la vez, contradiciéndose —
            visible en la primera captura del criterio 1. El id del cue era depuración del
            reconocimiento. */}
      </svg>
    </AbsoluteFill>
  );
};
