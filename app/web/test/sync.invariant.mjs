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
// El motor sondea con requestAnimationFrame cuando el elemento no tiene rVFC — que es
// todo <audio>. Aquí se sustituye por una cola controlable: sin esto la prueba solo
// ejercitaba el camino de `timeupdate`, y el camino que usa la opción A en producción se
// quedaba sin cubrir.
const colaRaf = [];
globalThis.requestAnimationFrame = (cb) => { colaRaf.push(cb); return colaRaf.length; };
globalThis.cancelAnimationFrame = () => {};
globalThis.__resetRaf = () => { colaRaf.length = 0; };
globalThis.__pendientesRaf = () => colaRaf.length;
globalThis.__drenarRaf = (n = 1) => {
  for (let i = 0; i < n; i++) {
    const cb = colaRaf.shift();
    if (cb) cb();
  }
};

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

// El sondeo con requestAnimationFrame: el camino que usa la opción A en producción.
//
// Existe porque el bake-off midió el desfase p95 de A en 483-541 ms contra 86-120 ms de
// B, y era tentador anotarlo como ventaja del vídeo. No lo es: `<video>` expone rVFC y
// `<audio>` no, pero `audio.currentTime` se lee igual de bien en cada fotograma. Sin esta
// prueba, el bucle nuevo se ejercitaba solo en un navegador.
{
  // Las pruebas anteriores dejaron callbacks encolados que nadie drenó: sin este reset,
  // `__drenarRaf(1)` sacaba uno de ellos, atado a otro motor, y aquí no disparaba nada.
  globalThis.__resetRaf();
  const m = fakeMedia();
  const e = new CueEngine(m, { cues: [{ id: "uno", type: "graph", t: 1 }] });
  const vistos = [];
  e.onCue((f) => vistos.push(f.cue.id));

  m.paused = false;
  m.fire("play");                     // arranca el bucle de rAF
  m.currentTime = 2;                  // avanza el reloj SIN emitir `timeupdate`
  globalThis.__drenarRaf(1);

  assert.deepEqual(vistos, ["uno"],
    "el cue debe disparar por rAF aunque `timeupdate` no llegue nunca");
  assert.equal(e.resumenDesfase().fuente, "raf",
    `la fuente del reloj debe quedar registrada como raf, es ${e.resumenDesfase().fuente}`);

  // Y al pausar, el bucle se corta: si siguiera, sondearía para siempre en segundo plano.
  m.paused = true;
  m.fire("pause");
  globalThis.__drenarRaf(3);
  assert.equal(vistos.length, 1, "en pausa no debe dispararse nada más");
  assert.equal(globalThis.__pendientesRaf(), 0,
    "el bucle no debe reencolarse tras la pausa: sondearía para siempre en segundo plano");
}

console.log("  sync raf ok: dispara sin timeupdate y se detiene en pause");
