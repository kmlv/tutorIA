import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// cues comparativos
const cues = await page.evaluate(() => (window.__tutoriaSesion?.media?.cues||[])
  .map(c=>({t:c.t ?? c.time ?? c.at, tipo:c.tipo ?? c.type ?? c.kind, id:c.id, raw:JSON.stringify(c).slice(0,300)})));
console.log('CUES total', cues.length);
for (const c of cues) if (/shift|pivot|unchanged|slope|compar/i.test(c.raw)) console.log(' ', c.t, c.tipo, c.id, c.raw.slice(0,240));

// barrido temporal: en qué segundos aparece "unchanged"
const marcas = [];
for (let t=140; t<=215; t+=2){
  await page.evaluate(s => window.__tutoria.media.seek(s), t);
  await page.waitForTimeout(120);
  const txt = await page.evaluate(()=>document.querySelector('.bands')?.innerText.replace(/\s+/g,' ')||'');
  marcas.push([t, /unchanged/i.test(txt), txt.slice(0,160)]);
}
console.log('\n--- barrido lang=es ---');
let prev=null;
for (const [t,u,txt] of marcas){ if (u!==prev){ console.log(`t=${t} unchanged=${u} | ${txt}`); prev=u; } }
console.log('rango con unchanged:', marcas.filter(m=>m[1]).map(m=>m[0]).slice(0,1), '->', marcas.filter(m=>m[1]).map(m=>m[0]).slice(-1));

// texto completo de la banda en varios puntos clave
for (const t of [150,158,165,175,182,195,205,210]){
  await page.evaluate(s => window.__tutoria.media.seek(s), t);
  await page.waitForTimeout(150);
  const txt = await page.evaluate(()=>document.querySelector('.bands')?.innerText.replace(/\s+/g,' ')||'');
  console.log(`  t=${t}: ${txt}`);
}
await browser.close();
