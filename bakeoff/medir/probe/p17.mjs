import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync(new URL('./key.json', import.meta.url), 'utf8'));
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,600);}catch{} net.push({u:u.replace(/.*\/api\//,''),b});}});
await page.goto('http://localhost:57330/?lang=es&variant=B',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
console.log('ownsStage:', await page.evaluate(()=>window.__tutoria.media.ownsStage));
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
let last=0;
for (let i=0;i<3;i++){
  await page.waitForFunction(n=>document.querySelectorAll('.dock-body .pregunta').length>n,last,{timeout:20000});
  last=await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(500);
  const cls=await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q').className);
  const en=await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q-enunciado').textContent);
  console.log(`item ${i+1} ${cls} "${en.slice(0,55)}"`);
  if (cls.includes('q-manip')){
    console.log('  capa-manip presente:', await page.evaluate(()=>!!document.querySelector('.capa-manip')));
    console.log('  svg visible:', await page.evaluate(()=>{const s=document.querySelector('.bgraph'); if(!s) return 'NO HAY SVG'; const r=s.getBoundingClientRect(); const cs=getComputedStyle(s); return JSON.stringify({w:Math.round(r.width),h:Math.round(r.height),display:cs.display,vis:cs.visibility,op:cs.opacity, escenario:document.querySelector('.escenario')?.dataset.escenario});}));
    await page.screenshot({path:'probe/variantB-manip.png'});
    break;
  }
  const lastNext=[...net].reverse().find(n=>n.u.endsWith('/next')); let qid=null; try{qid=JSON.parse(lastNext.b).question?.id;}catch{}
  const k=KEY[qid]||{};
  if (cls.includes('q-mcq')){ const f=(k.opciones||[]).findIndex(o=>o.correcta); await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(f<0?0:f).click(); }
  await page.waitForTimeout(1600);
}
await browser.close();
