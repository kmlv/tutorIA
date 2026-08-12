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
page.on('response', async r => { if(r.url().includes('/answer')) { try{console.log('  POST /answer ->', r.status(), JSON.stringify(await r.json()));}catch{} }});
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const cps = await page.evaluate(()=> (window.__tutoriaSesion?.media?.cues||[]).filter(c=>(c.type||c.tipo)==='checkpoint').map(c=>({id:c.id,t:c.t})));
console.log('EN checkpoints:', JSON.stringify(cps), 'dur=', await page.evaluate(()=>window.__tutoria.media.duration().toFixed(1)));
await page.evaluate(()=>{ window.__tutoria.media.seek(131); window.__tutoria.media.play(); });
for (let i=0;i<40;i++){
  await page.waitForTimeout(1000);
  const st = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(1), q:!!document.querySelector('.q'), p:window.__tutoria.media.paused()}));
  if (st.q) { console.log('  .q aparece en t=', st.t); break; }
  if (i%5===0) console.log('  ...t=', st.t, 'paused=', st.p);
}
const q = await page.$('.q');
if (q) {
  console.log('ENUNCIADO EN:', (await page.textContent('.q-enunciado')).trim());
  const ops = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent.trim()));
  console.log(ops.map((o,i)=>`${i+1}) ${o}`).join('\n'));
  const antes = await page.evaluate(()=>document.querySelector('.dock').innerText);
  await page.$$eval('.q-opciones button', bs=>(bs[3]||bs[bs.length-1]).click());
  await page.waitForTimeout(8000);
  const desp = await page.evaluate(()=>document.querySelector('.dock').innerText);
  console.log('NUEVO EN EL DOCK (EN):', JSON.stringify(desp.split('\n').filter(l=>!antes.split('\n').includes(l)&&l.trim())));
} else console.log('  .q NUNCA aparecio en EN tras 40s');
await browser.close();
