import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const abrir = async (url)=>{ const ctx=await browser.newContext({viewport:{width:1280,height:860}}); const page=await ctx.newPage();
  page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
  return {ctx,page}; };
const leer = (page)=>page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(2), dur:+window.__tutoria.media.duration().toFixed(1),
  pausado: window.__tutoria.media.paused(),
  p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
  p2:(document.querySelector('.card[data-good="g2"] .price')||{}).textContent,
  comp: !!document.querySelector('.ledger.compact'),
  eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  dock: window.__tutoria.dock ? window.__tutoria.dock.actual : null,
  q:((document.querySelector('.q-enunciado')||{}).innerText||'').replace(/\s+/g,' ').trim(),
  opts:[...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()),
  manip: !!document.querySelector('.q-manip'),
  estadoP1: (()=>{try{return window.__tutoria.estado().p1}catch(e){return null}})(),
  estadoM: (()=>{try{return window.__tutoria.estado().m}catch(e){return null}})(),
}));

console.log('=== B: carga limpia directa en ?lang=es&t=231 ===');
{ const {ctx,page}=await abrir('http://localhost:57330/?lang=es&t=231');
  console.log(JSON.stringify(await leer(page),null,1));
  await page.screenshot({path:'verif-t231.png'}); await ctx.close(); }

console.log('\n=== B2: barrido de entradas directas ===');
{ for (const t of [200,206,207,215,225,232]) {
    const {ctx,page}=await abrir(`http://localhost:57330/?lang=es&t=${t}`);
    const s=await leer(page);
    console.log(`  t=${t}: ficha g1=${s.p1} comprimido=${s.comp} eq="${s.eq}" estado.p1=${s.estadoP1} estado.m=${s.estadoM}`);
    await ctx.close(); } }

console.log('\n=== C: bucle de practica (llegar al final reproduciendo) ===');
{ const {ctx,page}=await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{ const m=window.__tutoria.media; (m.audio||m.video).playbackRate=6; m.seek(207); m.play(); });
  for(let i=0;i<200;i++){
    await page.waitForTimeout(400);
    const s=await leer(page);
    if (s.dock==='practica' || s.manip || (s.t>=s.dur-0.4 && s.pausado)) {
      console.log(`  llegue: t=${s.t}/${s.dur} dock=${s.dock} manip=${s.manip}`);
      console.log(`  ficha g1=${s.p1}  ficha g2=${s.p2}  comprimido=${s.comp}`);
      console.log(`  ecuacion="${s.eq}"`);
      console.log(`  pregunta="${s.q}"`);
      console.log(`  opciones=${JSON.stringify(s.opts.slice(0,6))}`);
      break; }
    if (s.pausado && s.opts.length) { await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click()); await page.waitForTimeout(1200);
      await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/seguir|continuar|siguiente|next/i.test(x.innerText)); if(b)b.click(); else window.__tutoria.media.play();}); }
  }
  console.log('  --- respondiendo varias preguntas del bucle y mirando la banda ---');
  for(let k=0;k<8;k++){
    const s=await leer(page);
    console.log(`  [#${k+1}] ficha g1=${s.p1} | eq="${s.eq}" | pregunta="${s.q.slice(0,90)}"`);
    const n=s.opts.length;
    if(n){ await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click()); }
    await page.waitForTimeout(1000);
    await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/seguir|continuar|siguiente|next|otra/i.test(x.innerText)); if(b)b.click();});
    await page.waitForTimeout(900);
  }
  await page.screenshot({path:'verif-practica.png', fullPage:false});
  await ctx.close(); }
await browser.close();
