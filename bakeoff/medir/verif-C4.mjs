import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await browser.newContext({viewport:{width:1280,height:860}}); const page=await ctx.newPage();
page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{ const m=window.__tutoria.media; (m.audio||m.video).playbackRate=6; m.seek(207); m.play(); });
await page.waitForFunction(()=> document.querySelector('.q-enunciado'), null,{timeout:60000});
await page.waitForTimeout(2000);
const leer = ()=>page.evaluate(()=>({
  p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
  eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  estado:(()=>{try{const e=window.__tutoria.estado();return {p1:e.p1,p2:e.p2,m:e.m};}catch(x){return null}})(),
  q:((document.querySelector('.q-enunciado')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  opts:[...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()),
  listo: !!([...document.querySelectorAll('button')].find(b=>/^listo$/i.test(b.innerText.trim()))),
  handles:[...document.querySelectorAll('.lienzo circle, .lienzo [data-handle], .lienzo .handle')].map(h=>{const r=h.getBoundingClientRect();return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), cls:h.getAttribute('class')||h.getAttribute('data-handle')};}),
}));
let ultimo='';
for(let paso=0; paso<30; paso++){
  const s=await leer();
  if(s.q!==ultimo){ ultimo=s.q;
    console.log(`\n>>> "${s.q}"`);
    console.log(`    ficha g1=${s.p1}  estado=${JSON.stringify(s.estado)}`);
    console.log(`    ECUACION="${s.eq}"`);
    if(s.opts.length) console.log(`    opciones=${JSON.stringify(s.opts)}`);
  }
  if(s.opts.length){ await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click()); await page.waitForTimeout(1100); continue; }
  if(s.listo){
    if(s.handles.length>=2){
      console.log(`    (manip) handles=${JSON.stringify(s.handles)}`);
      const objetivo = /precio del café/i.test(s.q) ? 'p' : 'm';
      // eje: usar los dos handles actuales para deducir la escala
      const [h1,h2] = s.handles.slice(0,2).sort((a,b)=>a.y-b.y); // h1 = intercepto x2 (arriba), h2 = intercepto x1
      const ox = h1.x, oy = h2.y;             // origen aproximado
      const escY = (oy - h1.y)/ (s.estado.m/s.estado.p2);
      const escX = (h2.x - ox)/ (s.estado.m/s.estado.p1);
      let mNuevo = s.estado.m, p1Nuevo = s.estado.p1;
      if(objetivo==='m') mNuevo = 150; else p1Nuevo = 4;
      const destY = oy - (mNuevo/s.estado.p2)*escY;
      const destX = ox + (mNuevo/p1Nuevo)*escX;
      await page.mouse.move(h1.x,h1.y); await page.mouse.down(); await page.mouse.move(h1.x,destY,{steps:12}); await page.mouse.up();
      await page.waitForTimeout(400);
      const s2=await leer(); const hh=s2.handles.slice(0,2).sort((a,b)=>a.y-b.y);
      await page.mouse.move(hh[1].x,hh[1].y); await page.mouse.down(); await page.mouse.move(destX,hh[1].y,{steps:12}); await page.mouse.up();
      await page.waitForTimeout(500);
    }
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/^listo$/i.test(b.innerText.trim())).click());
    await page.waitForTimeout(1400); continue;
  }
  await page.waitForTimeout(700);
}
await page.screenshot({path:'verif-practica4.png'});
await browser.close();
