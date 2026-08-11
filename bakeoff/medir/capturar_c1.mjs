/**
 * Capturas para la rúbrica del criterio 1. La rúbrica está en `bakeoff/RUBRICA-C1.md` y
 * se escribió antes que esto, a propósito.
 *
 *   node bakeoff/medir/capturar_c1.mjs --url http://localhost:5173
 *
 * Toma el MISMO instante en las dos variantes usando `?t=`, que es la única forma de
 * comparar sin depender de reproducir en tiempo real y acertar el segundo. Bajo la
 * opción A eso repinta el escenario DOM replicando los cues; bajo B mueve el vídeo.
 * Las dos rutas terminan en el mismo momento de la lección — eso costó un arreglo,
 * porque la primera versión no movía el vídeo y habría comparado un fotograma
 * renderizado contra uno negro.
 *
 * Los archivos salen anonimizados: `c1-<t>-<x|y>.png`, con la correspondencia en
 * `clave.json`, que NO hay que abrir hasta después de puntuar. La asignación x/y depende
 * del instante, así que memorizar "x es siempre el vídeo" tampoco funciona.
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
        const exe = path.join(base, d, sub, app, 'Contents/MacOS', app.replace('.app', ''));
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
const VARIANTES = ['A', 'B'];
//: Los cinco instantes de la rúbrica, elegidos por lo que el guion hace en ellos.
const INSTANTES = [70, 90, 110, 158, 180];
const SALIDA = path.join(path.dirname(new URL(import.meta.url).pathname), 'c1');

fs.mkdirSync(SALIDA, {recursive: true});

const browser = await chromium.launch({executablePath: ejecutable()});
const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
const page = await ctx.newPage();
const clave = {};

for (const [i, t] of INSTANTES.entries()) {
  // El sorteo alterna por POSICIÓN en la lista.
  //
  // Antes dependía de `t % 2`, y los cinco instantes elegidos por la rúbrica resultaron
  // ser todos pares: `x` salió siendo A las diez veces. Un sorteo que en la práctica no
  // sortea es peor que no tenerlo, porque se cree. Se descubrió al abrir `clave.json`.
  //
  // Aun así: las dos opciones se distinguen a simple vista —una es un vídeo dentro de un
  // recuadro y la otra es SVG en la página— así que esto nunca fue una ceguera de verdad.
  // Lo único que protege de verdad es que Kristian pueda repuntuar, y por eso las
  // capturas y esta clave se guardan.
  const orden = i % 2 === 0 ? VARIANTES : [...VARIANTES].reverse();
  for (let j = 0; j < orden.length; j++) {
    const v = orden[j];
    const etiqueta = ['x', 'y'][j];
    await page.goto(`${URL_BASE}/?lang=es&variant=${v}&t=${t}`,
                    {waitUntil: 'domcontentloaded'});
    await page.waitForFunction('window.__tutoria !== undefined', null, {timeout: 30000});
    // Bajo B hay que esperar a que el fotograma del `seek` esté decodificado y pintado,
    // o la captura sale del cuadro anterior — que suele ser negro.
    await page.waitForFunction(`(() => {
      const v = document.querySelector('video');
      if (!v) return true;                       // opción A: no hay vídeo que esperar
      return v.readyState >= 2 && Math.abs(v.currentTime - ${t}) < 1.5;
    })()`, null, {timeout: 30000});
    await page.waitForTimeout(700);

    const nombre = `c1-${t}-${etiqueta}.png`;
    await page.locator('.escenario').screenshot({path: path.join(SALIDA, nombre)});
    clave[nombre] = v;
    process.stderr.write(`  ${nombre}\n`);
  }
}

await browser.close();
fs.writeFileSync(path.join(SALIDA, 'clave.json'), JSON.stringify(clave, null, 1));
process.stderr.write(`\n  ${Object.keys(clave).length} capturas -> ${SALIDA}\n`);
process.stderr.write('  NO abras clave.json hasta después de puntuar.\n');
