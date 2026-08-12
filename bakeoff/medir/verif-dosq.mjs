import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,200)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// Volcado de cues para localizar cp1 y cp2
const cues = await page.evaluate(() => (window.__tutoriaSesion?.media?.cues||[])
  .map(c => ({t:c.t ?? c.tiempo ?? c.time, tipo:c.tipo ?? c.type, id:c.id, ref:c.ref})));
console.log('--- cues cerca de 140-200 ---');
for (const c of cues) if (c.t>135 && c.t<205) console.log(JSON.stringify(c));

const snap = async (tag) => {
  const s = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const qs = [...document.querySelectorAll('.q')].map(q => ({
      id: q.getAttribute('data-id') || q.id || null,
      cls: q.className,
      enunciado: (q.querySelector('.q-enunciado')?.textContent||'').trim().slice(0,120),
      opciones: [...q.querySelectorAll('.q-opciones button')].map(b=>({txt:b.textContent.trim().slice(0,50), disabled:b.disabled, cls:b.className})),
      manip: !!q.querySelector('.q-manip'),
    }));
    return {
      t: +window.__tutoria.media.currentTime().toFixed(2),
      paused: window.__tutoria.media.paused(),
      dockEstado: window.__tutoria.dock?.actual,
      dockText: (dock?.innerText||'').replace(/\n+/g,' | ').slice(0,900),
      nQ: qs.length, qs,
      estado: window.__tutoria.estado ? window.__tutoria.estado() : null,
      playBtn: document.querySelector('#play')?.textContent,
    };
  });
  console.log('\n=== ' + tag + ' ===');
  console.log('t=' + s.t + ' paused=' + s.paused + ' play="' + s.playBtn + '" dock.actual=' + JSON.stringify(s.dockEstado));
  console.log('tarjetas .q = ' + s.nQ);
  for (const q of s.qs) {
    console.log('   [' + q.id + '] cls=' + q.cls);
    console.log('      enunciado: ' + q.enunciado);
    console.log('      opciones: ' + JSON.stringify(q.opciones));
  }
  console.log('DOCK TEXT: ' + s.dockText);
  console.log('ESTADO: ' + JSON.stringify(s.estado));
  return s;
};

// PASO 2
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() || window.__tutoria.media.currentTime()>150', null, {timeout:30000}).catch(()=>{});
await page.waitForTimeout(1200);
await snap('PASO 2-3: llega cp1 (~144.76)');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-1-cp1.png'});

// PASO 3: pulsar 'Seguir'
const label = await page.textContent('#play');
console.log('\n>>> pulsando #play con etiqueta: "' + label + '"');
await page.click('#play');
await page.waitForTimeout(1000);
await snap('PASO 3b: tras pulsar Seguir');

// PASO 4
await page.evaluate(() => { window.__tutoria.media.seek(192.5); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() || window.__tutoria.media.currentTime()>200', null, {timeout:30000}).catch(()=>{});
await page.waitForTimeout(1500);
const s4 = await snap('PASO 4-5: llega cp2 (~194.56)');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-2-cp2.png'});

// PASO 5: pulsar opcion 1 de la tarjeta de ARRIBA
const nq = s4.nQ;
if (nq >= 2) {
  const ok = await page.evaluate(() => {
    const q = document.querySelectorAll('.q')[0];
    const b = q.querySelectorAll('.q-opciones button')[0];
    if (!b) return 'sin botones en la tarjeta de arriba';
    if (b.disabled) return 'DISABLED: ' + b.textContent.trim();
    b.click(); return 'CLICK: ' + b.textContent.trim();
  });
  console.log('\n>>> click en opcion 1 de tarjeta de arriba -> ' + ok);
  await page.waitForTimeout(1500);
  await snap('PASO 5b: tras contestar la vieja');
  await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-3-tras-click.png'});
} else {
  console.log('\n>>> NO HAY 2 TARJETAS: solo ' + nq);
}
await browser.close();
