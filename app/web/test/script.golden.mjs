/**
 * D-3: el intérprete del guion tiene que producir EXACTAMENTE los mismos estados que el
 * `switch` en TypeScript al que sustituye.
 *
 * `golden-estados.json` se capturó ejecutando el `switch` viejo antes de borrarlo, cue a
 * cue, sobre la timeline real. Sin este archivo, "lo pasé a datos" sería una afirmación:
 * la lección podría haber cambiado en un detalle —qué intercepto se destaca en el pivote,
 * si el fantasma sobrevive al recap— y nada lo habría dicho, porque el gráfico seguiría
 * dibujándose bonito.
 *
 * También comprueba lo contrario, que es lo que de verdad importa cuando el documento lo
 * escribe un modelo: que un guion mal escrito falle RUIDOSAMENTE.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../../..");

const { estadoInicial, aplicarCue } = await import("../dist-test/graph/state.js");
const { revisar, evaluar, ScriptError } = await import("../dist-test/graph/script.js");

const yamlCrudo = readFileSync(path.join(raiz, "content/packs/budget-line/graph.yaml"), "utf8");
const guion = JSON.parse(readFileSync(path.join(aqui, "guion.json"), "utf8"));
const golden = JSON.parse(readFileSync(path.join(aqui, "golden-estados.json"), "utf8"));
const e = { p1: 3, p2: 1, m: 100 };

// --- 1. equivalencia con la máquina que sustituye -------------------------------
let s = estadoInicial(e);
const obtenido = [];
for (const g of golden) {
  s = aplicarCue(s, g.cue, e, guion);
  obtenido.push({ cue: g.cue, estado: s });
}
assert.equal(obtenido.length, golden.length);
for (let i = 0; i < golden.length; i++) {
  assert.deepEqual(obtenido[i], golden[i],
    `el cue ${golden[i].cue} da un estado distinto al del switch original`);
}
console.log(`  script golden ok: ${golden.length} cues idénticos al switch original`);

// --- 2. la gramática de expresiones ---------------------------------------------
assert.equal(evaluar("m * 1.5", e), 150);
assert.equal(evaluar("p1 + 1", e), 4);
assert.equal(evaluar("m", e), 100);
assert.equal(evaluar(7, e), 7);
for (const malo of ["m()", "import x", "p1 + p2 + m", "(m)", "m ** 2", "window", "m / 0"]) {
  assert.throws(() => evaluar(malo, e), ScriptError, `"${malo}" debería rechazarse`);
}
// Y la razón de fondo: nada de esto puede ejecutar código.
assert.throws(() => evaluar("globalThis.x = 1", e), ScriptError);
console.log("  script grammar ok: fuera de la gramática siempre lanza");

// --- 3. un guion mal escrito falla ruidosamente ----------------------------------
const casos = [
  [{ version: 1, cues: { espacio: [{ mostrar: "ejess" }] } }, "capa desconocida"],
  [{ version: 1, cues: { espacio: [{ destacar: "el_intercepto" }] } }, "destacar"],
  [{ version: 1, cues: { espacio: [{ fantasma: "anterior" }] } }, "fantasma"],
  [{ version: 1, cues: { espacio: [{ set: { x1: "1" } }] } }, "solo p1, p2, m"],
  [{ version: 1, cues: { espacio: [{ set: { m: "m + n" } }] } }, "variable desconocida"],
  [{ version: 1, cues: { espacio: [{ animar: "linea" }] } }, "operación desconocida"],
  [{ version: 1, cues: { espacio: [{ mostrar: "ejes", destacar: "ninguno" }] } }, "una clave"],
  [{ version: 2, cues: {} }, "version"],
];
for (const [doc, esperado] of casos) {
  const errs = revisar(doc, e);
  assert.ok(errs.length > 0, `${JSON.stringify(doc)} debería dar error`);
  assert.ok(errs.some((x) => x.includes(esperado)),
    `se esperaba "${esperado}", se obtuvo ${JSON.stringify(errs)}`);
}
// Devuelve TODOS los errores y no el primero: quien lo lee es un bucle que se los
// devuelve a un modelo, y darle uno por vuelta convierte una corrección en diez llamadas.
const varios = revisar(
  { version: 1, cues: { a: [{ mostrar: "zzz" }, { destacar: "qqq" }, { set: { m: "m ^ 2" } }] } }, e);
assert.equal(varios.length, 3, `se esperaban 3 errores, salieron ${varios.length}`);

// Un cue que no existe en la timeline: el guion habla de algo que nadie dispara.
const conCues = revisar({ version: 1, cues: { fantasmita: [{ mostrar: "ejes" }] } }, e,
                        new Set(["espacio"]));
assert.ok(conCues.some((x) => x.includes("no existe ningún cue")), conCues.join(" | "));

// Y el guion real del pack pasa limpio, o las 8 comprobaciones de arriba no dicen nada.
assert.deepEqual(revisar(guion, e), [], "el guion del pack debe estar limpio");
assert.ok(yamlCrudo.includes("version: 1"));
console.log(`  script validation ok: ${casos.length} formas de romperlo, todas detectadas`);

// --- 4. el ledger, mismo trato ----------------------------------------------------
//
// `golden-ledger.json` se capturó ejecutando el `switch` de `paintLedger` tal cual estaba
// en main.ts, extrayéndolo por emparejamiento de llaves y corriéndolo contra un espía.
// Extraído y no transcrito: una transcripción a mano tiene exactamente el mismo problema
// que el código que sustituye — nadie comprueba que sea fiel.
{
  const { aplicarLedger } = await import("../dist-test/graph/script.js");
  const goldenLedger = JSON.parse(
    readFileSync(path.join(aqui, "golden-ledger.json"), "utf8"));

  const llamadas = [];
  const espia = {
    reveal: (...a) => llamadas.push(["reveal", ...a]),
    highlight: (...a) => llamadas.push(["highlight", ...a]),
    compress: (...a) => llamadas.push(["compress", ...a]),
    morphPrice: (...a) => llamadas.push(["morphPrice", ...a]),
  };

  for (const [cue, esperado] of Object.entries(goldenLedger)) {
    llamadas.length = 0;
    aplicarLedger(guion.ledger[cue] ?? [], espia, e);
    assert.deepEqual(llamadas, esperado,
      `el ledger del cue ${cue} hace llamadas distintas a las del switch original`);
  }
  const n = Object.keys(goldenLedger).length;
  assert.ok(n >= 10, `se esperaban al menos 10 cues en el golden, hay ${n}`);
  console.log(`  ledger golden ok: ${n} cues idénticos al switch original`);

  // Y las formas de romperlo.
  const malos = [
    [{ revelar: { bien: "g3", estaciones: ["glyph"] } }, "bien"],
    [{ revelar: { bien: "g1", estaciones: ["glifo"] } }, "estación"],
    [{ revelar: { bien: "g1", estaciones: [] } }, "sin estaciones"],
    [{ destacar: ["p3"] }, "término"],
    [{ destacar: "p1" }, "lista"],
    [{ comprimir: "si" }, "true o false"],
    [{ precio: { bien: "g1", valor: "p1 * p2 * m" } }, "gramática"],
    [{ resaltar: [] }, "desconocida"],
  ];
  for (const [op, esperado] of malos) {
    const errs = revisar({ version: 1, cues: {}, ledger: { x: [op] } }, e);
    assert.ok(errs.some((x) => x.includes(esperado)),
      `${JSON.stringify(op)}: se esperaba "${esperado}", salió ${JSON.stringify(errs)}`);
  }
  console.log(`  ledger validation ok: ${malos.length} formas de romperlo, todas detectadas`);
}
