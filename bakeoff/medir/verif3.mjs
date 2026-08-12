import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const read = () => page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  estado: window.__tutoria.estado(),
  bands: document.querySelector('.bands')?.innerText.replace(/\s*\n+\s*/g,' | ') || null,
  q: document.querySelector('.q-enunciado')?.innerText.replace(/\n/g,' ') || null,
  ops: [...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\n/g,' ')),
  manip: !!document.querySelector('.q-manip'),
  qall: document.querySelector('.q')?.innerText.replace(/\s*\n+\s*/g,' ~ ') || null,
  caps: document.querySelector('.captions-band')?.innerText.replace(/\s*\n+\s*/g,' ') || null,
}));
const log = (tag,s) => {
  console.log(`\n--- ${tag} @t=${s.t.toFixed(2)} paused=${s.paused} | p1=${s.estado.p1} p2=${s.estado.p2} m=${s.estado.m} fantasma=${JSON.stringify(s.estado.fantasma)}`);
  if (s.q) console.log('    Q:', s.q, '\n    ops:', JSON.stringify(s.ops), 'manip:', s.manip);
};
await page.click('#play');
const correctas = [/gastan exactamente todo el ingreso/i, /más empinada|mas empinada/i, /baja|hacia adentro|se desplaza/i];
let hechas = 0;
const t0 = Date.now();
while (Date.now()-t0 < 500000) {
  const s = await read();
  if (s.t >= 176 && (s.ops.length||s.manip)) { console.log('\n### LLEGAMOS A price_effect'); log('price_effect', s); break; }
  if (s.paused && s.ops.length) {
    log('GATE', s);
    // elegir: la primera que matchee una heuristica de correcta, si no la 0
    let idx = 0;
    for (let i=0;i<s.ops.length;i++) if (correctas.some(r=>r.test(s.ops[i]))) { idx=i; break; }
    console.log('    >> respondo idx', idx, ':', s.ops[idx]);
    await page.$$eval('.q-opciones button', (bs,i)=>bs[i].click(), idx);
    await page.waitForTimeout(1200);
    const f = await read();
    console.log('    feedback:', (f.qall||'').slice(0,300));
    console.log('    tras responder: paused=',f.paused,'p1=',f.estado.p1,'m=',f.estado.m);
    // si sigue pausado con opciones (respuesta mala), reintentar otra
    let intentos=0;
    while ((await read()).paused && (await read()).ops.length && intentos<3 && (await read()).t < 175) {
      const s2 = await read();
      if (s2.t>=176) break;
      const nidx = (idx+1+intentos)%s2.ops.length;
      console.log('    >> aun bloqueado; pruebo idx', nidx, s2.ops[nidx]);
      await page.$$eval('.q-opciones button', (bs,i)=>bs[i].click(), nidx);
      await page.waitForTimeout(1500); intentos++;
      console.log('    feedback2:', ((await read()).qall||'').slice(0,250));
    }
    // si hay boton continuar
    const cont = await page.$$('.q button');
    for (const b of cont) { const t=(await b.innerText()).trim(); if (/continuar|seguir|adelante|listo/i.test(t)) { console.log('    >> click', t); await b.click(); break; } }
    hechas++;
  } else if (s.paused && s.manip) { log('GATE MANIP', s); console.log('    (manipulacion, contenido):', (s.qall||'').slice(0,300)); break; }
  await page.waitForTimeout(900);
}
const fin = await read();
log('ESTADO FINAL', fin);
console.log('BANDS:', fin.bands);
console.log('CAPS:', (fin.caps||'').slice(0,300));
console.log('QALL:', (fin.qall||'').slice(0,400));
await page.screenshot({path:'verif3.png'});
fs.writeFileSync('verif3-estado.json', JSON.stringify(fin,null,1));
await browser.close();
