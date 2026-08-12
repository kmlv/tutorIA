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
await page.waitForFunction(()=> window.__tutoria.dock.actual==='abierto-activo' && document.querySelector('.q-enunciado'), null,{timeout:60000});
await page.waitForTimeout(2000);
const leer = ()=>page.evaluate(()=>({
  p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
  eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  estado: (()=>{try{const e=window.__tutoria.estado(); return {p1:e.p1,p2:e.p2,m:e.m};}catch(x){return null}})(),
  ultimoMsg:[...document.querySelectorAll('.dock .msg, .dock p, .q')].slice(-1).map(x=>x.innerText.replace(/\s+/g,' ').trim())[0]||'',
  q:((document.querySelector('.q-enunciado')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  opts:[...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()),
  listo: !!([...document.querySelectorAll('button')].find(b=>/^listo$/i.test(b.innerText.trim()))),
}));
const vistos=new Set();
for(let paso=0; paso<25; paso++){
  const s=await leer();
  const clave = s.q + '|' + (s.listo?'L':'');
  if(!vistos.has(clave)){
    vistos.add(clave);
    console.log(`\n>>> ITEM: "${s.q || s.ultimoMsg.slice(0,90)}"`);
    console.log(`    ficha g1=${s.p1}   estado=${JSON.stringify(s.estado)}`);
    console.log(`    ECUACION="${s.eq}"`);
    if(s.opts.length) console.log(`    opciones=${JSON.stringify(s.opts)}`);
  }
  if(s.opts.length){ await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click()); await page.waitForTimeout(1000); }
  else if(s.listo){ await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/^listo$/i.test(b.innerText.trim())).click()); await page.waitForTimeout(1300); }
  else { await page.waitForTimeout(800); }
}
const sf=await leer();
console.log('\nFINAL:', JSON.stringify(sf,null,1).slice(0,900));
await page.screenshot({path:'verif-practica3.png'});
await browser.close();
