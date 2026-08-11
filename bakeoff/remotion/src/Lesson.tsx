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

const COLOR = {
  fondo: '#0f1115',
  eje: '#8a93a6',
  linea: '#f2f4f8',
  fantasma: '#6b7280',
  conjunto: '#3b6fd4',
  destaque: '#f5a524',
  texto: '#c8cfdd',
  tenue: '#5b657a',
};

export const Lesson: React.FC<LessonProps> = ({
  beats, audio, bien1, bien2, titulo, maxX, maxY,
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
        <text x={PAD.l} y={PAD.t - 20} fill={COLOR.texto} fontSize={34}>{titulo}</text>

        {s.mostrar.ejes && (
          <g stroke={COLOR.eje} strokeWidth={3}>
            <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} />
          </g>
        )}
        {s.mostrar.ejes && (
          <g fontSize={28}>
            <text x={W - PAD.r} y={H - PAD.b + 44} fill={COLOR.texto} textAnchor="end">
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

        <text x={PAD.l} y={H - 40} fill={COLOR.texto} fontSize={32}>{b.caption}</text>
        <text x={W - PAD.r} y={H - 40} fill={COLOR.tenue} fontSize={22} textAnchor="end">
          {b.cue}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
