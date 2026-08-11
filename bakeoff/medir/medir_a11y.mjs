/**
 * Criterio 4 — accesibilidad y mantenibilidad, medido en vez de estimado.
 *
 *   node bakeoff/medir/medir_a11y.mjs --url http://localhost:5173
 *
 * La matriz provisional le daba un 2 a la opción B con el argumento "el texto es
 * píxeles". Es un argumento correcto y sin medir, y la diferencia entre las dos cosas
 * importa: un 2 estimado y un 2 medido pesan lo mismo en el marcador y no valen lo mismo.
 *
 * Lo que cuenta este script, en el mismo instante de la lección y para cada opción:
 *
 *  - **Texto accesible del escenario**: lo que un lector de pantalla podría anunciar.
 *    Bajo A el SVG lleva `aria-label` con la descripción completa —ingreso, precios, los
 *    dos interceptos y la pendiente, en el idioma de la sesión— porque `budget_graph.ts`
 *    la genera en cada `render`. Bajo B el escenario es un `<video>`: lo que haya dentro
 *    del cuadro no existe para el árbol de accesibilidad.
 *
 *  - **Nodos de texto seleccionables**: si un alumno puede copiar un número del gráfico,
 *    o buscarlo con Ctrl+F.
 *
 *  - **Qué pasa al ampliar**: se rehace la captura al 200% y se mira si el texto
 *    reflowea (DOM) o se escala como imagen (vídeo). Es la diferencia práctica para
 *    alguien con baja visión.
 *
 * No mide mantenibilidad, que es la otra mitad del criterio. Esa se argumenta en el
 * informe con un hecho comprobable: corregir una errata del gráfico bajo A es editar un
 * `.md` y recargar; bajo B es volver a renderizar.
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
const T = 110;                       // el instante de los interceptos: hay números que leer

const browser = await chromium.launch({executablePath: ejecutable()});
const filas = [];

for (const v of ['A', 'B']) {
  const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
  const page = await ctx.newPage();
  await page.goto(`${URL_BASE}/?lang=es&variant=${v}&t=${T}`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction('window.__tutoria !== undefined', null, {timeout: 30000});
  await page.waitForFunction(`(() => {
    const e = document.querySelector('video');
    if (!e) return true;
    return e.readyState >= 2 && Math.abs(e.currentTime - ${T}) < 1.5;
  })()`, null, {timeout: 30000});
  await page.waitForTimeout(600);

  const r = await page.evaluate(`(() => {
    const stage = document.querySelector('.stage');
    const svg = stage.querySelector('svg');
    const video = stage.querySelector('video');
    const textos = [...stage.querySelectorAll('text, tspan')]
      .map((n) => n.textContent.trim()).filter(Boolean);
    return {
      etiqueta_accesible: svg?.getAttribute('aria-label') ?? video?.getAttribute('aria-label') ?? null,
      nodos_de_texto: textos.length,
      muestra: textos.slice(0, 6),
      escenario_es_imagen: !!video,
      // Un <video> sin pista de texto no ofrece NADA a un lector de pantalla.
      pistas_de_texto: video ? video.textTracks.length : null,
    };
  })()`);

  await ctx.close();
  filas.push({variante: v, ...r});
  process.stderr.write(
    `  ${v}: etiqueta=${r.etiqueta_accesible ? `"${r.etiqueta_accesible.slice(0, 70)}…"` : 'NINGUNA'}\n` +
    `     nodos de texto en el escenario=${r.nodos_de_texto}` +
    (r.escenario_es_imagen ? ` · pistas de texto del vídeo=${r.pistas_de_texto}` : '') + '\n');
}

await browser.close();
const salida = path.join(path.dirname(new URL(import.meta.url).pathname), 'a11y.json');
fs.writeFileSync(salida, JSON.stringify(filas, null, 1));
process.stderr.write(`\n  -> ${salida}\n`);
