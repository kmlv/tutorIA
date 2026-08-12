import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const SCR='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';

async function abrir(url, tag){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`  [${tag}] JS ERROR:`, String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(1000);
  return {page, ctx};
}
const snap = (page) => page.evaluate(() => {
  const t = window.__tutoria;
  const one = s => { const e=document.querySelector(s); return e? e.textContent.trim().replace(/\s+/g,' ').slice(0,120):null; };
  // subtitulo visible: primer nodo dentro de captions-band que no sea boton
  const cb = document.querySelector('.captions-band');
  let sub = null;
  if (cb) {
    const cand = [...cb.childNodes].map(n=>n.textContent&&n.textContent.trim()).filter(Boolean);
    sub = cand[0] ? cand[0].replace(/\s+/g,' ').slice(0,140) : null;
  }
  const lienzoTxt = (document.querySelector('.lienzo')||{}).textContent || '';
  return {
    ct: +t.media.currentTime().toFixed(2),
    paused: t.media.paused(),
    reloj: one('.tiempo'),
    sub,
    mostrar: t.estado().mostrar,
    pendienteEnLienzo: /(-|−)\s*3[.,]00/.test(lienzoTxt),
    lienzoFrag: lienzoTxt.replace(/\s+/g,' ').slice(0,300),
  };
});

// --- A: carga limpia t=110 ---
const {page:pA} = await abrir('http://localhost:57330/?lang=es&variant=A&t=110','A');
console.log('\nA t=110 al cargar:', JSON.stringify(await snap(pA)));
await pA.screenshot({path:SCR+'/vA-110-carga.png'});
// pulsar Empezar / play
const botones = await pA.evaluate(()=>[...document.querySelectorAll('button')].map(b=>({id:b.id,cls:b.className,txt:(b.textContent||'').trim().slice(0,30)})).slice(0,25));
console.log('botones:', JSON.stringify(botones));
await pA.click('#play');
await pA.waitForTimeout(3500);
console.log('A tras pulsar play +3.5s:', JSON.stringify(await snap(pA)));
await pA.screenshot({path:SCR+'/vA-110-tras-play.png'});

// --- B: mismo ---
const {page:pB} = await abrir('http://localhost:57330/?lang=es&variant=B&t=110','B');
console.log('\nB t=110 al cargar:', JSON.stringify(await snap(pB)));
await pB.click('#play');
await pB.waitForTimeout(3500);
console.log('B tras pulsar play +3.5s:', JSON.stringify(await snap(pB)));
await pB.screenshot({path:SCR+'/vB-110-tras-play.png'});

// --- A: carga limpia t=0 (control) ---
const {page:p0} = await abrir('http://localhost:57330/?lang=es&variant=A','A0');
console.log('\nA sin t (control):', JSON.stringify(await snap(p0)));
await p0.screenshot({path:SCR+'/vA-0-carga.png'});

await browser.close();
