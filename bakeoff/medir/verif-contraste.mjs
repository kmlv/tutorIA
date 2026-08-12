import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function mira(url, etiqueta, png) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(1200);
  const s = await page.evaluate(() => {
    const t = window.__tutoria;
    const reloj = [...document.querySelectorAll('.reloj')].map(e=>e.textContent.trim());
    return {
      currentTime: +t.media.currentTime().toFixed(2),
      ownsStage: t.media.ownsStage,
      reloj,
      estado: t.estado(),
      captions: (document.querySelector('.captions-band')?.textContent||'').trim().slice(0,90),
      escenario: (document.querySelector('.escenario')?.innerText||'').replace(/\s+/g,' ').slice(0,200),
    };
  });
  console.log('=== ' + etiqueta + '  ' + url);
  console.log(JSON.stringify(s, null, 1));
  if (png) await page.screenshot({path:png});
  await ctx.close();
  return s;
}

const t0  = await mira('http://localhost:57330/?lang=es',            'A) limpio t=0 (por defecto)', 'verif-t0.png');
const t90 = await mira('http://localhost:57330/?lang=es&t=90',       'B) t=90 (por defecto)',       'verif-t90b.png');
const b90 = await mira('http://localhost:57330/?lang=es&variant=B&t=90','C) t=90 variant=B',        'verif-t90-varB.png');
const t44 = await mira('http://localhost:57330/?lang=es&t=44',       'D) t=44 (por defecto)');
const t500= await mira('http://localhost:57330/?lang=es&t=500',      'E) t=500 (por defecto)');

console.log('\n### ¿el escenario de t=90 difiere del de t=0?',
  JSON.stringify(t0.estado)!==JSON.stringify(t90.estado) ? 'SÍ (el dibujo sí se movió)' : 'NO');
console.log('### mostrar t=0 :', JSON.stringify(t0.estado.mostrar));
console.log('### mostrar t=90:', JSON.stringify(t90.estado.mostrar));
console.log('### mostrar B90 :', JSON.stringify(b90.estado.mostrar));
console.log('### relojes  t0/t90/B90/t44/t500:', t0.reloj, t90.reloj, b90.reloj, t44.reloj, t500.reloj);
console.log('### currentTime t0/t90/B90/t44/t500:', t0.currentTime, t90.currentTime, b90.currentTime, t44.currentTime, t500.currentTime);
await browser.close();
