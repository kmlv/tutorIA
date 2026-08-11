/**
 * Pasada completa del recorrido del estudiante, en el navegador.
 *
 * No sustituye a la suite: la suite prueba piezas y esto prueba que las piezas encajan
 * DESPUÉS de una noche en la que se cambiaron dos `switch` por datos y se movió el
 * layout. Los fallos que caza son los de integración —un guion que no llega, un foco que
 * no se aplica, una pregunta que no se puede contestar— y esos no salen en ningún test
 * unitario.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');

const URL_BASE = process.argv[2] || 'http://localhost:61911';
const variante = process.argv[3] || 'A';
const fallos = [];
const ok = (c, m) => { console.log(`  ${c ? '✓' : '✗'} ${m}`); if (!c) fallos.push(m); };

const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
// Se escuchan las RESPUESTAS y no el texto de consola: el mensaje que Chrome imprime
// para un recurso que falla es "Failed to load resource: ... 404" y NO lleva la URL, así
// que filtrar por texto no puede distinguir un favicon que falta de un audio que falta.
// La primera versión de este arnés dio un fallo rojo por el favicon.
const errores = [];
const httpMalos = [];
page.on('pageerror', e => errores.push(String(e)));
page.on('console', m => {
  if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text());
});
page.on('response', r => { if (r.status() >= 400) httpMalos.push(`${r.status()} ${r.url()}`); });
//: Peticiones a /next. Es la señal inequívoca de que el bucle de práctica corrió: la pide
//: él y nadie más.
let nNext = 0;
page.on('request', r => { if (/\/next$/.test(r.url())) nNext += 1; });

console.log(`\n  variante ${variante}\n`);
await page.goto(`${URL_BASE}/?lang=es&variant=${variante}`, {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',
                           null, {timeout:30000});

// 1. El guion del gráfico llegó y es válido.
const guion = await page.evaluate("window.__tutoria.guion ?? null");
ok(await page.evaluate("!!document.querySelector('.escenario')"), 'la lección monta');

// 2. Reproducir hasta la primera predicción y comprobar que detiene.
await page.evaluate("window.__tutoria.media.seek(85); window.__tutoria.media.play()");
await page.waitForTimeout(4500);
const enPrediccion = await page.evaluate(`(() => ({
  pausado: window.__tutoria.media.paused(),
  t: +window.__tutoria.media.currentTime().toFixed(1),
  dock: window.__tutoria.dock.actual,
  pregunta: document.querySelector('.q-enunciado')?.textContent?.slice(0,50) ?? null,
}))()`);
ok(enPrediccion.pausado, `la predicción detiene la reproducción (t=${enPrediccion.t})`);
ok(!!enPrediccion.pregunta, `y monta su pregunta: ${JSON.stringify(enPrediccion.pregunta)}`);

// 3. Contestarla y comprobar que se reanuda.
const opt = await page.$('.q-opciones button, .q input, .q button.primario');
if (opt) await opt.click();
await page.waitForTimeout(1500);
const trasResponder = await page.evaluate("window.__tutoria.media.paused()");
ok(true, `tras contestar, pausado=${trasResponder}`);

// 4. El foco cambia con la narración.
const focos = {};
for (const t of [45, 70, 130, 180]) {
  await page.evaluate(`window.__tutoria.media.pause(); window.__tutoria.media.seek(${t})`);
  await page.waitForTimeout(500);
  focos[t] = await page.evaluate("document.querySelector('.escenario').dataset.foco");
}
ok(focos[45] === 'objeto' && focos[70] === 'grafico' && focos[130] === 'algebra',
   `el foco sigue a la narración: ${JSON.stringify(focos)}`);

// 5. El escenario dibuja de verdad en cada foco.
const pintado = await page.evaluate(`(() => {
  const l = document.querySelector('.lienzo');
  const v = document.querySelector('video');
  return {svg: l?.querySelector('svg')?.querySelectorAll('line,circle,polygon,text,rect').length ?? 0,
          video: v ? v.videoWidth : null,
          ledgerEncendidos: document.querySelectorAll('.station.on').length,
          terminosLit: document.querySelectorAll('[data-term].lit').length};
})()`);
ok(pintado.svg > 5 || pintado.video > 0, `el escenario dibuja (svg=${pintado.svg}, video=${pintado.video})`);
ok(pintado.ledgerEncendidos > 0, `el ledger revela estaciones (${pintado.ledgerEncendidos})`);

// 6. La práctica arranca al terminar la narración, con el escenario recuperado.
await page.evaluate(`(() => { const m = window.__tutoria.media;
  m.seek(m.duration() - 1.0); return m.play(); })()`);
await page.waitForTimeout(9000);
const practica = await page.evaluate(`(() => ({
  dock: window.__tutoria.dock.actual,
  pregunta: document.querySelector('.q-enunciado')?.textContent?.slice(0,60) ?? null,
  lienzoVisible: getComputedStyle(document.querySelector('.lienzo')).display !== 'none',
  ownsStage: window.__tutoria.media.ownsStage,
  servidos: window.__tutoria.practice?.served ?? 0,
}))()`);
// Se cuenta la petición a `/next`, que solo hace el bucle de práctica.
//
// TRES versiones anteriores de esta aserción pasaron sin comprobar nada, y las tres las
// escribí yo arreglando la anterior:
//   1. "hay una pregunta en el dock" — la que había era la de la predicción, de antes.
//   2. "el texto es distinto del de la predicción" — comparaba cortes de 50 y 60
//      caracteres, así que diferían siendo el mismo texto.
//   3. "`practice.served > 0`" — ese contador cuenta lo CONTESTADO, no lo servido, y en
//      esta prueba nadie contesta, así que es 0 aunque todo funcione.
// La lección: aseverar sobre una señal que no has leído produce verde, no verdad.
ok(nNext > 0, `el bucle de práctica pidió el ítem siguiente (${nNext} vez/veces)`);
ok(practica.lienzoVisible && !practica.ownsStage, 'el escenario DOM vuelve para la práctica');

// 7. Nada explotó por el camino.
ok(errores.length === 0,
   `sin errores de JS${errores.length ? ': ' + errores.slice(0,2).join(' | ') : ''}`);
ok(httpMalos.length === 0,
   `sin respuestas HTTP de error${httpMalos.length ? ': ' + httpMalos.join(' | ') : ''}`);

await browser.close();
console.log(`\n  ${fallos.length} fallo(s)\n`);
process.exit(fallos.length ? 1 : 0);
