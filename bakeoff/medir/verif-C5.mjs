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
const leer = ()=>page.evaluate(()=>{
  const qs=[...document.querySelectorAll('.q')]; const last=qs[qs.length-1];
  const txt=e=>e?e.innerText.replace(/\s+/g,' ').trim():'';
  return {
    nq: qs.length,
    q: txt(last&&last.querySelector('.q-enunciado')),
    opts: last?[...last.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()):[],
    manip: !!(last&&last.querySelector('.q-manip')),
    listo: !!(last&&[...last.querySelectorAll('button')].find(b=>/^listo$/i.test(b.innerText.trim()))),
    p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
    eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\s+/g,' ').trim(),
    estado:(()=>{try{const e=window.__tutoria.estado();return {p1:e.p1,p2:e.p2,m:e.m};}catch(x){return null}})(),
    handles:[...document.querySelectorAll('.lienzo circle')].map(h=>{const r=h.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};}),
  };
});
const clickEnUltimo = (sel,i=0)=>page.evaluate(([sel,i])=>{const qs=[...document.querySelectorAll('.q')];const last=qs[qs.length-1];const b=last.querySelectorAll(sel)[i];if(b)b.click();},[sel,i]);
let visto='';
for(let paso=0; paso<40; paso++){
  const s=await leer();
  const clave=s.q+'#'+s.nq;
  if(clave!==visto){ visto=clave;
    console.log(`\n>>> ITEM ${s.nq}: "${s.q}"  ${s.manip?'[MANIP]':''}`);
    console.log(`    ficha g1=${s.p1}  estado=${JSON.stringify(s.estado)}`);
    console.log(`    ECUACION="${s.eq}"`);
    if(s.opts.length) console.log(`    opciones=${JSON.stringify(s.opts)}`); }
  if(s.opts.length){ await clickEnUltimo('.q-opciones button',0); await page.waitForTimeout(1100); continue; }
  if(s.listo){
    if(s.handles.length>=2){
      const hs=[...s.handles].sort((a,b)=>a.y-b.y); const h1=hs[0], h2=hs[hs.length-1];
      const ox=h1.x, oy=h2.y; const e=s.estado;
      const escY=(oy-h1.y)/(e.m/e.p2), escX=(h2.x-ox)/(e.m/e.p1);
      const esPrecio=/precio del caf/i.test(s.q);
      const mN = esPrecio? e.m : 150, pN = esPrecio? 4 : e.p1;
      const destY = oy - (mN/e.p2)*escY, destX = ox + (mN/pN)*escX;
      if(!esPrecio){ await page.mouse.move(h1.x,h1.y);await page.mouse.down();await page.mouse.move(h1.x,destY,{steps:14});await page.mouse.up();await page.waitForTimeout(350); }
      const s2=await leer(); const hs2=[...s2.handles].sort((a,b)=>a.y-b.y); const hx=hs2[hs2.length-1];
      await page.mouse.move(hx.x,hx.y);await page.mouse.down();await page.mouse.move(destX,hx.y,{steps:14});await page.mouse.up();
      await page.waitForTimeout(450);
      console.log(`    (arrastre hecho) estado ahora=${JSON.stringify((await leer()).estado)}`);
    }
    await clickEnUltimo('button', 0);
    await page.evaluate(()=>{const qs=[...document.querySelectorAll('.q')];const last=qs[qs.length-1];const b=[...last.querySelectorAll('button')].find(x=>/^listo$/i.test(x.innerText.trim()));if(b)b.click();});
    await page.waitForTimeout(1500); continue; }
  await page.waitForTimeout(700);
}
await page.screenshot({path:'verif-practica5.png'});
await browser.close();
