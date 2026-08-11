/**
 * El bucle de práctica tiene que publicar QUÉ ítem está sirviendo.
 *
 * Existe por un fallo que Kristian vio en pantalla: contestó un ítem, preguntó
 * "¿por qué?", y el tutor respondió sobre otra cosa. El bucle no publicaba el ítem, así
 * que el chat mandaba `question_id: null` durante toda la práctica y el tutor no sabía de
 * qué le hablaban.
 *
 * La consecuencia que NO se ve es peor, y es la razón de que esto sea una prueba y no una
 * nota: la tercera capa del guardarraíl —la que revisa que la respuesta del tutor no
 * contenga la solución— necesita el ítem para saber cuál ES la solución.
 * `layer3_applies(None, ...)` devuelve falso, así que sin ítem la capa queda **inerte
 * justo durante la práctica**, que es cuando el alumno está intentando resolver.
 *
 * Se prueba aquí y no en el navegador por una razón que costó tres intentos aprender: en
 * el arnés de extremo a extremo, el ítem que salía era de manipulación, y esa ruta va por
 * `askManip` en main.ts, que SÍ publicaba la pregunta. La prueba pasaba en verde con el
 * fallo delante. Aquí el tipo de ítem se elige, no se sortea.
 */
import assert from "node:assert/strict";

const { PracticeLoop } = await import("../dist-test/practice/loop.js");

function arnes(items) {
  const publicados = [];
  let i = 0;

  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/next")) {
      const it = items[i];
      i += 1;
      return { ok: true, json: async () => it ? { done: null, question: it } : { done: "fin" } };
    }
    return { ok: true, json: async () => ({ correcta: true, score: 1 }) };
  };

  const dock = {
    actual: "oculto",
    setEstado() {}, decir() {}, montarPregunta() {},
  };
  const flow = {
    marcarPintado() {},
    async ask() { return { correcta: true, score: 1 }; },
    async submitManip() { return { correcta: true, score: 1 }; },
  };
  const manip = async () => ({ correcta: true, score: 1 });

  const loop = new PracticeLoop(
    "s1", dock, flow, "es", () => {}, manip,
    (id) => publicados.push(id),
  );
  return { loop, publicados };
}

const mcq = {
  id: "q_slope_mcq", modalidad: "mcq", enunciado: "¿cuál es la pendiente?",
  opciones: ["a", "b"], manip_modo: null,
};
const numeric = {
  id: "q_int_numeric_1", modalidad: "numeric", enunciado: "¿cuánto?",
  opciones: null, manip_modo: null,
};

// --- un ítem que NO es de manipulación: la ruta donde vivía el fallo ---------------
{
  const { loop, publicados } = arnes([mcq]);
  await loop.start();
  assert.deepEqual(publicados, ["q_slope_mcq", null],
    `debía publicar el id al servir y null al contestar; publicó ${JSON.stringify(publicados)}`);
}

// --- varios seguidos: el id no se queda pegado del anterior ------------------------
{
  const { loop, publicados } = arnes([mcq, numeric]);
  await loop.start();
  assert.deepEqual(publicados, ["q_slope_mcq", null, "q_int_numeric_1", null],
    JSON.stringify(publicados));
}

// --- y el orden importa: el id tiene que estar PUESTO mientras se contesta ---------
//
// Si se publicara después de `ask`, el alumno podría preguntar mientras tiene el ítem
// delante y el tutor seguiría sin saber cuál es — que es exactamente el fallo original,
// solo que más difícil de ver.
{
  const publicados = [];
  let idDurante = "sin fijar";
  globalThis.fetch = async (url) => String(url).endsWith("/next")
    ? { ok: true, json: async () => (publicados.length ? { done: "fin" } : { done: null, question: mcq }) }
    : { ok: true, json: async () => ({ correcta: true, score: 1 }) };

  const loop = new PracticeLoop(
    "s1", { actual: "oculto", setEstado() {}, decir() {}, montarPregunta() {} },
    {
      marcarPintado() {},
      async ask() { idDurante = publicados[publicados.length - 1]; return { correcta: true, score: 1 }; },
      async submitManip() { return { correcta: true, score: 1 }; },
    },
    "es", () => {}, async () => ({ correcta: true, score: 1 }),
    (id) => publicados.push(id),
  );
  await loop.start();
  assert.equal(idDurante, "q_slope_mcq",
    `mientras el alumno contesta, el ítem publicado debe ser el suyo; era ${idDurante}`);
}

console.log("  practice contexto ok: el bucle publica su ítem al servir y lo limpia al contestar");
