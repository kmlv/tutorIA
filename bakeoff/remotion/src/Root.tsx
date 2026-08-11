/**
 * The composition list.
 *
 * `durationInFrames` and the props both come from `props/lesson.json`, which
 * `pipeline/render_b.py` writes from the pack and the compiled timeline. Nothing about
 * this lesson is typed in here: a different income, a different pair of goods, or a
 * re-recorded narration of a different length all arrive through that file.
 *
 * The frame count is derived rather than fixed because getting it wrong is silent in the
 * worst way — a short count renders a video that ends mid-sentence, and the player has
 * no way to know the tail is missing. It just stops.
 */
import React from 'react';
import {Composition} from 'remotion';
import {Lesson, type LessonProps} from './Lesson';
import props from '../props/lesson.json';

const FPS = 30;
const p = props as unknown as LessonProps & {duration_s: number};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Lesson"
    component={Lesson as never}
    durationInFrames={Math.ceil(p.duration_s * FPS)}
    fps={FPS}
    width={1120}
    height={920}
    defaultProps={p as never}
  />
);
