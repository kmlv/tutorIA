import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const cues = await page.evaluate(()=> (window.__tutoriaSesion?.media?.cues||[]).filter(c=>c.tipo==='checkpoint'||c.type==='checkpoint'||c.tipo==='prediction'||c.type==='prediction').map(c=>({id:c.id,t:c.t,tipo:c.tipo??c.type})));
console.log('CHECKPOINTS/PREDICCIONES:', JSON.stringify(cues));
for (const c of cues) {
  const p = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  await p.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await p.evaluate(t => { window.__tutoria.media.seek(t-2); window.__tutoria.media.play(); }, c.t);
  await p.waitForFunction(()=>document.querySelectorAll('.q').length>0,null,{timeout:20000}).catch(()=>{});
  await p.waitForTimeout(800);
  const antes = await p.evaluate(()=>document.querySelectorAll('.q').length);
  await p.evaluate(t => { window.__tutoria.media.seek(t-4); window.__tutoria.media.play(); }, c.t);
  await p.waitForTimeout(7000);
  const desp = await p.evaluate(()=>({q:document.querySelectorAll('.q').length, bt:document.querySelectorAll('.q-opciones button').length}));
  console.log(`  ${c.id} (${c.tipo}, t=${c.t}): .q antes=${antes} -> tras rebobinar=${desp.q} (botones ${desp.bt})`);
}
await browser.close();
