import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync(new URL('./key.json', import.meta.url), 'utf8'));
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,600);}catch{} net.push({u:u.replace(/.*\/api\//,''),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
async function pressKb(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); }
let last=0;
for (let i=0;i<5;i++){
  await page.waitForFunction(n=>document.querySelectorAll('.dock-body .pregunta').length>n,last,{timeout:20000});
  last=await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(400);
  const en = await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q-enunciado').textContent);
  const cls= await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q').className);
  const g = await page.evaluate(()=>({scrollY:Math.round(document.scrollingElement.scrollTop), pageH:document.scrollingElement.scrollHeight,
    lienzo:(()=>{const r=document.querySelector('.lienzo')?.getBoundingClientRect(); return r?{top:Math.round(r.top),bottom:Math.round(r.bottom)}:null;})()}));
  console.log(`item ${i+1}: "${en.slice(0,60)}" cls=${cls} scrollY=${g.scrollY} pageH=${g.pageH} lienzo=${JSON.stringify(g.lienzo)}`);
  if (i===4){ await page.screenshot({path:'probe/manip-fuera-de-pantalla.png'}); console.log('  -> captura'); break; }
  const lastNext=[...net].reverse().find(n=>n.u.endsWith('/next')); let qid=null; try{qid=JSON.parse(lastNext.b).question?.id;}catch{}
  const k=KEY[qid]||{};
  if (cls.includes('q-mcq')){ const f=(k.opciones||[]).findIndex(o=>o.correcta); await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(f<0?0:f).click(); }
  else if (cls.includes('q-numeric')){ const st=await page.evaluate(()=>window.__tutoria.estado());
    const v=String(Number(new Function('m','p1','p2','return ('+k.respuesta.expr+')')(st.m,st.p1,st.p2)).toFixed(3));
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill(v);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-manip')){ await pressKb('ArrowUp',50); await pressKb('ArrowRight',17);
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click(); }
  await page.waitForTimeout(1600);
}
await browser.close();
