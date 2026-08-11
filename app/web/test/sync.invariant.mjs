/**
 * El invariante que sostiene las predicciones y los checkpoints:
 * un cue que CEDE EL CONTROL detiene el resto del tick.
 *
 * Existe porque hasta el 2026-08-11 solo bloqueaba `prediction`. Ningún checkpoint
 * compartía timestamp, así que no se filtraba nada — pero el invariante se sostenía por
 * accidente, y el compilador le da timestamp compartido a cualquier marca que no tenga
 * narración detrás. Un autor que escribiera un checkpoint justo antes de su cue de
 * revelación habría publicado la respuesta al lado de la pregunta sin nada que lo cazara.
 *
 * Se corre con `node`, sin navegador: el motor solo necesita un objeto con
 * addEventListener y currentTime.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { CueEngine } = await import("../dist-test/player/sync.js");

function fakeMedia() {
  const l = {};
  return {
    currentTime: 0, paused: true,
    addEventListener: (e, cb) => ((l[e] ??= []).push(cb)),
    removeEventListener: () => {},
    fire: (e) => (l[e] || []).forEach((cb) => cb()),
    tick(t) { this.currentTime = t; this.fire("timeupdate"); },
  };
}

function run(cues, stops) {
  const m = fakeMedia();
  const e = new CueEngine(m, { cues });
  const seen = [];
  e.onCue((f) => {
    seen.push(f.cue.id);
    if (stops.has(f.cue.type)) { m.paused = true; }   // el handler pausa, como la app
  });
  m.fire("play");
  for (let t = 0; t <= 20; t += 0.25) m.tick(t);
  return seen;
}

// Un checkpoint que comparte timestamp con el cue que revela la respuesta.
const cues = [
  { id: "antes", type: "graph", t: 1 },
  { id: "cp1", type: "checkpoint", t: 5 },
  { id: "revela", type: "graph", t: 5 },
  { id: "despues", type: "graph", t: 9 },
];

const seen = run(cues, new Set(["checkpoint", "prediction"]));
assert.deepEqual(seen, ["antes", "cp1"],
  `el checkpoint debe detener el tick antes de 'revela'; se vio ${JSON.stringify(seen)}`);

// Y lo mismo para una predicción, que es el caso que ya funcionaba.
const pred = [
  { id: "antes", type: "graph", t: 1 },
  { id: "p1", type: "prediction", t: 5 },
  { id: "revela", type: "graph", t: 5 },
];
assert.deepEqual(run(pred, new Set(["prediction"])), ["antes", "p1"]);

// Un cue de gráfico NO bloquea: dos seguidos en el mismo tick deben disparar los dos.
const dos = [
  { id: "a", type: "graph", t: 5 },
  { id: "b", type: "graph", t: 5 },
];
assert.deepEqual(run(dos, new Set()), ["a", "b"]);

console.log("  sync invariant ok: checkpoint y prediction detienen el tick; graph no");
