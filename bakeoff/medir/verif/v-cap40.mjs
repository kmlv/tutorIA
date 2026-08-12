import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe/key.json','utf8'));
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,200)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,500);}catch{} net.push({u:u.replace(/.*\/api\//,''),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play();});
let last=0,n=0;
for (let i=0;i<60;i++){
  try{ await page.waitForFunction(x=>document.querySelectorAll('.dock-body .pregunta').length>x, last, {timeout:25000}); }
  catch{ console.log('  >>> NO llega otra pregunta tras', n, 'items'); break; }
  last = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(200); n++;
  const lastNext=[...net].reverse().find(x=>x.u.endsWith('/next')); let qid=null; try{qid=JSON.parse(lastNext.b).question?.id;}catch{}
  const cls = await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q').className);
  const k=KEY[qid]||{};
  if(n%5===0||n>36) console.log(` item ${n} (${qid})`);
  if (cls.includes('q-mcq')){ const f=(k.opciones||[]).findIndex(o=>!o.correcta); await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(f<0?1:f).click(); }
  else if (cls.includes('q-numeric')){ await page.locator('.dock-body .pregunta').last().locator('.q-input').fill('999');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-open')){ await page.locator('.dock-body .pregunta').last().locator('.q-textarea').fill('no se');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-manip')){ await page.locator('.dock-body .pregunta').last().locator('button.primario').click(); }
  await page.waitForTimeout(1200);
  if (await page.evaluate(()=>document.querySelector('.dock-body').textContent.includes('Eso es todo por ahora'))){ console.log('>>> CIERRE tras',n); break; }
}
await page.waitForTimeout(3000);
console.log('=== TRAS EL TOPE ===');
console.log(JSON.stringify(await page.evaluate(()=>({
  items:document.querySelectorAll('.dock-body .pregunta').length,
  hayCierre: document.querySelector('.dock-body').textContent.includes('Eso es todo por ahora'),
  ultimos: Array.from(document.querySelectorAll('.dock-body .msg')).slice(-3).map(m=>m.className+' :: '+m.innerText.slice(0,90)),
  ultimoNodo: document.querySelector('.dock-body').lastElementChild?.className,
  dock: window.__tutoria.dock?.actual,
  botonesDock: Array.from(document.querySelectorAll('.dock button:not([disabled])')).map(b=>b.textContent.trim()).filter(Boolean),
  botonesDockBody: Array.from(document.querySelectorAll('.dock-body button:not([disabled])')).map(b=>b.textContent.trim()),
  composerVivo: !!document.querySelector('.composer-input') && !document.querySelector('.composer-input').disabled,
})),null,1));
console.log('eventos capped/finished:', JSON.stringify(net.filter(x=>x.u.includes('events')).length));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif/v-cap40.png'});
await browser.close();
