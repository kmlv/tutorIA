import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>{ const m=window.__tutoria.media; (m.audio||m.video).playbackRate=6; });
console.log('  SIN NINGUN SEEK. play() desde t=0, contestando los checkpoints que pausen.');
await page.evaluate(()=> window.__tutoria.media.play());
const leer = () => page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(2),
  pausado: window.__tutoria.media.paused(),
  p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
  comp: !!document.querySelector('.ledger.compact'),
  eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  q:((document.querySelector('.q-enunciado')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  nopts: document.querySelectorAll('.q-opciones button').length}));
let a=false,b=false, ultimoT=-1, quieto=0;
for(let i=0;i<1500;i++){
  await page.waitForTimeout(200);
  const s = await leer();
  if(!a && s.t>200 && s.t<206.5){a=true; console.log('  ANTES del recap :', JSON.stringify(s));}
  if(!b && s.t>207.5){b=true; console.log('  TRAS  el recap  :', JSON.stringify(s));}
  if (s.pausado){
    if (s.nopts){ console.log(`  [checkpoint t=${s.t}] "${s.q}" -> contesto opcion 1`);
      await page.evaluate(()=> document.querySelectorAll('.q-opciones button')[0].click());
      await page.waitForTimeout(1500);
      const s2 = await leer();
      if (s2.pausado) { await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/seguir|continuar|siguiente|reanudar|next/i.test(x.innerText)); if(b)b.click(); else window.__tutoria.media.play();}); }
    } else if (Math.abs(s.t-ultimoT)<0.01) { quieto++; if(quieto>6){ console.log(`  pausado sin opciones en t=${s.t}, doy play`); await page.evaluate(()=>window.__tutoria.media.play()); quieto=0; } }
  }
  if (b && s.t>212) break;
  ultimoT = s.t;
}
console.log('  final:', JSON.stringify(await leer()));
await browser.close();
