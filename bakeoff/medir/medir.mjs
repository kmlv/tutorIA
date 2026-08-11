/**
 * Criterion-5 measurement for the M4 bake-off: what each option costs the machine.
 *
 *   node bakeoff/medir/medir.mjs --url http://localhost:5173 --variantes A,B --cpu 1,4
 *
 * Plays the lesson end to end, at real time, and records the same four numbers for every
 * option. Real time and not `playbackRate` on purpose: speeding it up changes how much
 * decoding and painting lands per wall-clock second, which is exactly the quantity under
 * test.
 *
 * WHAT IT MEASURES, and why each one is here:
 *
 *  - `frames`: the distribution of gaps between animation frames. This is the metric that
 *    actually compares the two technologies, because it is the same measurement in both:
 *    a long gap is a stutter the student sees, whether it came from mutating SVG or from
 *    decoding a video. p95 and the count over 50 ms are the numbers to read.
 *
 *  - `desfase`: cue lag, taken from the app's own telemetry. Run with `reloj=grosero` it
 *    is comparable across options; without it, each option uses the best clock its
 *    element offers, and A's <audio> has no `requestVideoFrameCallback` at all. Both are
 *    reported and labelled, because reading the second pair as a comparison would hand B
 *    the criterion for reasons that have nothing to do with video.
 *
 *  - `bytes`: what actually crossed the network, from Resource Timing rather than from
 *    the file size on disk. They differ: range requests mean a video that is paused early
 *    never transfers in full.
 *
 *  - `tareas_largas`: total milliseconds the main thread spent blocked. A stutter shows up
 *    in `frames`; this says who caused it.
 *
 * `--cpu 4` throttles the CPU fourfold through CDP. That is the closest thing available to
 * the modest machine criterion 5 is about, and it is the only condition where the two
 * options are expected to diverge — at full speed both have plenty of headroom, so a
 * measurement taken only there would conclude "no difference" and be useless.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright-core';

function ejecutable() {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const dirs = fs.readdirSync(base).filter((d) => d.startsWith('chromium-')).sort(
    (a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
  for (const d of dirs.reverse()) {
    for (const sub of ['chrome-mac-arm64', 'chrome-mac']) {
      for (const app of ['Google Chrome for Testing.app', 'Chromium.app']) {
        const exe = path.join(base, d, sub, app, 'Contents/MacOS',
          app.replace('.app', ''));
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  throw new Error('no encontré un Chromium en el caché de playwright');
}

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};

const URL_BASE = arg('url', 'http://localhost:5173');
const VARIANTES = arg('variantes', 'A,B').split(',');
const CPUS = arg('cpu', '1,4').split(',').map(Number);
const RELOJES = arg('relojes', 'grosero,nativo').split(',');
const LIMITE_S = Number(arg('limite', '0'));   // 0 = la lección entera

/** Instala los observadores ANTES de que cargue la app, o los primeros cues no se ven. */
const SONDA = `
window.__medida = {frames: [], tareas: 0, nTareas: 0, pausas: 0};
(() => {
  let prev = performance.now();
  const tick = (now) => {
    window.__medida.frames.push(now - prev);
    prev = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__medida.tareas += e.duration;
        window.__medida.nTareas += 1;
      }
    }).observe({entryTypes: ['longtask']});
  } catch { /* longtask no está en todos los navegadores; el resto sigue valiendo */ }
})();
`;

function pct(v, p) {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
}

async function correr(browser, variante, cpu, reloj) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(SONDA);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: cpu});

  // Los bytes se cuentan por CDP y no por Resource Timing. Un <video> se sirve por
  // rangos, y para esas peticiones `transferSize` sale 0: la primera medida daba 0.00 MB
  // para la opción B, que es justo la cifra que el criterio 5 más necesita y la más fácil
  // de creerse — "el vídeo no pesa nada" es exactamente lo que uno quiere oír.
  const bytes = {media: 0, total: 0};
  const urls = new Map();
  //: cuántas peticiones distintas tocaron cada archivo. La primera medida dio para A
  //: exactamente el doble del MP3, y "exactamente el doble" nunca es ruido: o se cuenta
  //: dos veces o se descarga dos veces, y son cosas muy distintas para el criterio 5.
  const peticiones = new Map();
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent', (e) => {
    urls.set(e.requestId, e.request.url);
    if (/\.(mp3|mp4)(\?|$)/.test(e.request.url)) {
      const k = e.request.url.split('/').pop();
      peticiones.set(k, (peticiones.get(k) || 0) + 1);
    }
  });
  cdp.on('Network.dataReceived', (e) => {
    const n = e.encodedDataLength || e.dataLength || 0;
    bytes.total += n;
    if (/\.(mp3|mp4)(\?|$)/.test(urls.get(e.requestId) || '')) bytes.media += n;
  });

  const q = new URLSearchParams({lang: 'es', variant: variante});
  if (reloj === 'grosero') q.set('reloj', 'grosero');
  await page.goto(`${URL_BASE}/?${q}`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction('window.__tutoria !== undefined', null, {timeout: 30000});

  // Esperar los metadatos NO es defensa preventiva: sin esto `duration()` devuelve 0,
  // `hasta` sale 0, el bucle sale en la primera vuelta y el arnés informa cuatro filas
  // con percentiles de frame perfectamente creíbles medidos sobre un segundo. Es el peor
  // modo de fallo que puede tener un instrumento — no da error, da un número.
  await page.waitForFunction('window.__tutoria.media.duration() > 0',
                             null, {timeout: 30000});
  const dur = await page.evaluate('window.__tutoria.media.duration()');
  const hasta = LIMITE_S > 0 ? Math.min(LIMITE_S, dur) : dur;

  await page.evaluate('window.__tutoria.media.play()');

  // Los checkpoints y las predicciones PAUSAN a propósito. Aquí se reanuda y se cuenta:
  // el flujo de preguntas ya se verificó a mano, y dejar que el arnés lo conteste
  // introduciría su propia latencia justo en la medida que intenta tomar.
  const t0 = Date.now();
  for (;;) {
    await page.waitForTimeout(500);
    const s = await page.evaluate(`(() => {
      const m = window.__tutoria.media;
      return {t: m.currentTime(), paused: m.paused()};
    })()`);
    if (s.t >= hasta - 0.5) break;
    if (Date.now() - t0 > (hasta + 90) * 1000) break;    // red de seguridad
    if (s.paused) {
      await page.evaluate('window.__medida.pausas++; window.__tutoria.media.play()');
    }
  }

  const r = await page.evaluate(`(() => {
    const m = window.__medida;
    return {
      frames: m.frames, tareas: m.tareas, nTareas: m.nTareas, pausas: m.pausas,
      desfase: window.__tutoria.lag(),
    };
  })()`);
  const alcanzado = await page.evaluate('window.__tutoria.media.currentTime()');
  await ctx.close();

  // Segunda red contra la misma clase de fallo: si la reproducción no llegó a donde
  // debía, esto es un error y no una fila de la matriz.
  if (alcanzado < hasta * 0.9) {
    throw new Error(
      `${variante} cpu${cpu}: solo llegó a ${alcanzado.toFixed(1)}s de ${hasta.toFixed(1)}s`);
  }

  // El primer frame tras cargar es siempre enorme y no es jank: es el arranque.
  const f = r.frames.slice(5);
  return {
    variante, cpu, reloj,
    segundos: Math.round(hasta),
    frames_n: f.length,
    frame_p50: +pct(f, 0.5).toFixed(1),
    frame_p95: +pct(f, 0.95).toFixed(1),
    frame_max: +Math.max(...f, 0).toFixed(1),
    frames_sobre_50ms: f.filter((x) => x > 50).length,
    tareas_largas_ms: Math.round(r.tareas),
    tareas_largas_n: r.nTareas,
    desfase_p50: r.desfase.p50,
    desfase_p95: r.desfase.p95,
    desfase_n: r.desfase.n,
    desfase_fuente: r.desfase.fuente,
    bytes_media: bytes.media,
    bytes_total: bytes.total,
    peticiones_media: Object.fromEntries(peticiones),
    pausas_reanudadas: r.pausas,
  };
}

const browser = await chromium.launch({
  executablePath: ejecutable(),
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const filas = [];
for (const cpu of CPUS) {
  for (const reloj of RELOJES) {
    for (const v of VARIANTES) {
      process.stderr.write(`  ${v} · cpu ${cpu}x · reloj ${reloj} …\n`);
      const fila = await correr(browser, v, cpu, reloj);
      filas.push(fila);
      process.stderr.write(
        `    frames p95 ${fila.frame_p95} ms · >50ms ${fila.frames_sobre_50ms} · ` +
        `bloqueo ${fila.tareas_largas_ms} ms · desfase p95 ${fila.desfase_p95} ms ` +
        `(${fila.desfase_fuente}) · media ${(fila.bytes_media / 1e6).toFixed(2)} MB\n`);
    }
  }
}
await browser.close();

const salida = path.join(path.dirname(new URL(import.meta.url).pathname), 'medidas.json');
fs.writeFileSync(salida, JSON.stringify(filas, null, 1));
process.stderr.write(`\n  ${filas.length} filas -> ${salida}\n`);
