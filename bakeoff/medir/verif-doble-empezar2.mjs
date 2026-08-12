import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function corre(modo, delay) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('    JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
  // registrar eventos del media
  await page.evaluate(() => {
    window.__ev = [];
    const m = window.__tutoria.media;
    for (const e of ['play','pause','playing','timeupdate','seeked','ended'])
      m.on(e, () => { if(e!=='timeupdate'||window.__ev.filter(x=>x.e==='timeupdate').length<2)
        window.__ev.push({e, t:+m.currentTime().toFixed(2), ms:Math.round(performance.now())}); });
  });
  if (modo === 'dblclick') { await page.dblclick('#play'); }
  else { await page.click('#play'); await page.waitForTimeout(delay); await page.click('#play'); }
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() => ({
    boton: document.querySelector('#play').textContent.trim(),
    reloj: document.querySelector('#reloj').textContent.trim(),
    paused: window.__tutoria.media.paused(),
    t: +window.__tutoria.media.currentTime().toFixed(2),
    escenarioOn: document.querySelector('.escenario')?.dataset.on ?? null,
    dock: window.__tutoria.dock.actual,
    captions: (document.querySelector('.captions-band')?.innerText||'').slice(0,60),
    ev: window.__ev,
  }));
  console.log(`  modo=${modo} delay=${delay}ms -> boton="${s.boton}" reloj=${s.reloj} paused=${s.paused} t=${s.t} escenario.on=${s.escenarioOn} dock=${s.dock}`);
  console.log(`     captions="${s.captions.replace(/\n/g,' | ')}"`);
  console.log(`     eventos: ${s.ev.map(x=>`${x.e}@${x.t}`).join(', ')||'(ninguno)'}`);
  await ctx.close();
  return s;
}

console.log('== barrido de retardo entre los dos clics ==');
for (const dly of [0, 30, 60, 100, 200, 300, 500, 800, 1200]) await corre('click', dly);
console.log('== doble clic nativo (dblclick) ==');
await corre('dblclick', 0);
await browser.close();
