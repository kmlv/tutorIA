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
await page.waitForFunction(()=> window.__tutoria.media.currentTime()>=232 || window.__tutoria.dock.actual==='abierto-activo', null, {timeout:60000});
await page.waitForTimeout(2500);

const leer = ()=>page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(2),
  p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
  eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  q:((document.querySelector('.q-enunciado')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  opts:[...document.querySelectorAll('.q-opciones button')].map(b=>({txt:b.innerText.replace(/\s+/g,' ').trim(), cls:b.className, dis:b.disabled})),
  manip: !!document.querySelector('.q-manip'),
  botones:[...document.querySelectorAll('.dock button, .q button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()).filter(Boolean),
  qHtml: ((document.querySelector('.q')||{}).innerHTML||'').slice(0,700),
}));
console.log('ESTADO AL ENTRAR EN PRACTICA:');
const s0=await leer(); console.log(JSON.stringify({t:s0.t,p1:s0.p1,eq:s0.eq,q:s0.q,opts:s0.opts.map(o=>o.txt),botones:s0.botones},null,1));
console.log('\nHTML del bloque .q (recorte):\n', s0.qHtml.replace(/\s+/g,' ').slice(0,600));

// Contestar SOLO con los botones de .q-opciones, buscando la correcta, sin tocar nada mas.
for (let k=0;k<6;k++){
  const s=await leer();
  if(!s.opts.length){ console.log(`  [${k}] sin opciones. manip=${s.manip} botones=${JSON.stringify(s.botones)}`); break; }
  // prueba opciones hasta que cambie el enunciado
  let cambio=false;
  for (let i=0;i<s.opts.length && !cambio;i++){
    await page.evaluate(i=>document.querySelectorAll('.q-opciones button')[i]?.click(), i);
    await page.waitForTimeout(900);
    const s2=await leer();
    console.log(`  [preg ${k+1}] click opcion ${i+1} ("${s.opts[i].txt}") -> ficha g1=${s2.p1} eq="${s2.eq}" | enunciado="${s2.q.slice(0,70)}" | t=${s2.t}`);
    if (s2.q!==s.q) cambio=true;
  }
  if(!cambio){
    const s3=await leer();
    console.log(`     botones disponibles ahora: ${JSON.stringify(s3.botones)}`);
    const av = await page.evaluate(()=>{const b=[...document.querySelectorAll('.q button, .dock button')].find(x=>/siguiente|continuar|otra|next/i.test(x.innerText)); if(b){b.click(); return b.innerText.trim();} return null;});
    console.log(`     avanzo con boton: ${JSON.stringify(av)}`);
    await page.waitForTimeout(1200);
  }
}
const sf=await leer();
console.log('\nFINAL:', JSON.stringify({t:sf.t,p1:sf.p1,eq:sf.eq,q:sf.q.slice(0,80)},null,1));
await page.screenshot({path:'verif-practica2.png'});
await browser.close();
