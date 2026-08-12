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
let sid = null;
page.on('request', r => { const m = r.url().match(/\/api\/session\/([^/]+)\/chat/); if (m) sid = m[1]; });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#ask');
await page.waitForTimeout(600);
async function preguntar(txt) {
  await page.fill('.composer-input', txt);
  await page.click('.composer-enviar');
  await page.waitForTimeout(250);
  try { await page.waitForFunction(() => { const b=document.querySelector('.composer-enviar'); return b && !b.disabled; }, null, {timeout:40000}); } catch(e){}
  await page.waitForTimeout(350);
}
for (let i=1;i<=12;i++) await preguntar(`Pregunta ${i}: ¿que significa la pendiente?`);
console.log('SESSION_ID=' + sid);
console.log('estado tras 12 (contador 0):');
console.log(await page.evaluate(()=>{ const f=document.querySelector('.composer'); const i=document.querySelector('.composer-input'); const c=getComputedStyle(i);
 return JSON.stringify({contador:document.querySelector('.composer-restantes').textContent, agotado:JSON.stringify(f.dataset.agotado), pointerEvents:c.pointerEvents, opacity:c.opacity, disabled:i.disabled, placeholder:i.placeholder, btnDisabled:document.querySelector('.composer-enviar').disabled});}));
await page.screenshot({path:'lim-contador0.png', clip:{x:640,y:400,width:640,height:460}});
await preguntar('No entiendo por que la pendiente es negativa, ¿me lo explicas?');
console.log('estado tras la 13:');
console.log(await page.evaluate(()=>{ const f=document.querySelector('.composer'); const i=document.querySelector('.composer-input'); const c=getComputedStyle(i);
 return JSON.stringify({contador:document.querySelector('.composer-restantes').textContent, agotado:JSON.stringify(f.dataset.agotado), pointerEvents:c.pointerEvents, opacity:c.opacity, disabled:i.disabled, placeholder:i.placeholder});}));
await page.screenshot({path:'lim-tras13.png', clip:{x:640,y:400,width:640,height:460}});
// ¿siguen funcionando los chips despues del limite?
const chips = await page.$$('.dock button');
console.log('botones en dock:', await Promise.all(chips.map(async c=>(await c.innerText()).trim())));
const antes = await page.evaluate(()=>document.querySelector('.dock').innerText.length);
for (const c of chips) { const t=(await c.innerText()).trim(); if (t==='No entiendo') { await c.click(); break; } }
await page.waitForTimeout(6000);
const despues = await page.evaluate(()=>document.querySelector('.dock').innerText);
console.log('tras pulsar «No entiendo» despues del limite, cola del dock:\n' + despues.slice(-400));
await browser.close();
