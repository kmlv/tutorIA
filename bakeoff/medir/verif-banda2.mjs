import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

const abrir = async (url) => {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {ctx,page};
};
const leer = (page) => page.evaluate(()=>{
  const q = s => document.querySelector(s);
  const card = g => {
    const c = document.querySelector(`.card[data-good="${g}"]`);
    return c ? {precio:(c.querySelector('.price')||{}).textContent, comprimido: !!document.querySelector('.ledger.compact')} : null;
  };
  return {
    t: +window.__tutoria.media.currentTime().toFixed(2),
    dur: +window.__tutoria.media.duration().toFixed(1),
    g1: card('g1'), g2: card('g2'),
    ecuacion: (q('.eq-slot')||{}).innerText,
    dock: window.__tutoria.dock ? window.__tutoria.dock.actual : null,
    pregunta: (q('.q-enunciado')||{}).innerText,
    opciones: [...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText),
    caption: (q('.captions-band')||{}).innerText,
  };
});

// --- A: SIN NINGUN SEEK. Reproduccion continua desde t=0 ---
console.log('=== A: play() desde carga limpia, sin un solo seek ===');
{
  const {ctx,page} = await abrir('http://localhost:57330/?lang=es');
  console.log('   duracion =', (await leer(page)).dur);
  await page.evaluate(()=> window.__tutoria.media.play());
  let visto200=false, visto210=false;
  for(;;){
    await page.waitForTimeout(1000);
    const s = await leer(page);
    if (s.t>200 && s.t<206 && !visto200){ visto200=true; console.log(`  t=${s.t} ANTES recap  precio g1=${s.g1.precio} comprimido=${s.g1.comprimido}  eq="${(s.ecuacion||'').replace(/\n/g,' ')}"`); }
    if (s.t>208 && !visto210){ visto210=true; console.log(`  t=${s.t} TRAS recap   precio g1=${s.g1.precio} comprimido=${s.g1.comprimido}  eq="${(s.ecuacion||'').replace(/\n/g,' ')}"`); break; }
    if (s.t>240) break;
  }
  await page.evaluate(()=> window.__tutoria.media.pause());
  await ctx.close();
}

// --- B: entrada directa ?t=231 ---
console.log('\n=== B: carga limpia directa en ?lang=es&t=231 ===');
{
  const {ctx,page} = await abrir('http://localhost:57330/?lang=es&t=231');
  const s = await leer(page);
  console.log(JSON.stringify({t:s.t, g1:s.g1, g2:s.g2, eq:(s.ecuacion||'').replace(/\n/g,' '), dock:s.dock, pregunta:s.pregunta, opciones:s.opciones}, null, 1));
  await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-t231.png'});
  await ctx.close();
}

// --- C: llegar al bucle de practica reproduciendo hasta el final y mirar la banda ---
console.log('\n=== C: reproducir hasta el final -> bucle de practica ===');
{
  const {ctx,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{ window.__tutoria.media.seek(200); window.__tutoria.media.play(); });
  for(let i=0;i<70;i++){
    await page.waitForTimeout(1500);
    const s = await leer(page);
    if (s.pregunta || (s.t >= s.dur - 0.6)) {
      console.log(`  t=${s.t}/${s.dur} dock=${s.dock}`);
      console.log(`  ficha g1 = ${s.g1.precio}   ficha g2 = ${s.g2.precio}`);
      console.log(`  ecuacion = "${(s.ecuacion||'').replace(/\n/g,' ')}"`);
      console.log(`  pregunta = ${JSON.stringify(s.pregunta)}`);
      console.log(`  opciones = ${JSON.stringify(s.opciones)}`);
      if (s.pregunta) break;
    }
  }
  // responder unas cuantas preguntas y volver a mirar la banda
  for (let k=0;k<4;k++){
    const n = await page.evaluate(()=> document.querySelectorAll('.q-opciones button').length);
    if(!n) break;
    await page.evaluate(()=> document.querySelectorAll('.q-opciones button')[0].click());
    await page.waitForTimeout(1200);
    const s = await leer(page);
    console.log(`  [tras responder #${k+1}] ficha g1=${s.g1.precio} eq="${(s.ecuacion||'').replace(/\n/g,' ')}" pregunta=${JSON.stringify((s.pregunta||'').slice(0,80))}`);
    // avanzar si hay un boton de siguiente
    await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>/siguiente|continuar|next/i.test(x.innerText)); if(b) b.click(); });
    await page.waitForTimeout(900);
  }
  await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-practica.png'});
  await ctx.close();
}
await browser.close();
