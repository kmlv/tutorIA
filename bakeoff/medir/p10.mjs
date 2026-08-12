import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/shots';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
console.log('=== A) "Seguir" con el panel del tutor abierto ===');
await page.click('#play'); await page.waitForTimeout(1500);
await page.click('#ask'); await page.waitForTimeout(600);
await page.click('#play'); await page.waitForTimeout(2500);
console.log('dock:', await page.evaluate(()=>window.__tutoria.dock.actual), '| paused:', await page.evaluate(()=>window.__tutoria.media.paused()), '| cur:', await page.evaluate(()=>+window.__tutoria.media.currentTime().toFixed(1)));
console.log('el panel tapa el escenario?', await page.evaluate(()=>{const dk=document.querySelector('.dock'); const es=document.querySelector('.escenario')||document.querySelector('.lienzo'); if(!dk||!es) return 'n/a'; const a=dk.getBoundingClientRect(), b=es.getBoundingClientRect(); return JSON.stringify({dock:[a.x|0,a.width|0], escenario:[b.x|0,b.width|0]});}));
await page.screenshot({path:OUT+'/p10-seguir-con-dock.png'});
console.log('=== B) reloj y duracion ===');
console.log(await page.evaluate(()=>{const els=[...document.querySelectorAll('.controles *, .transporte *')].map(e=>e.className+':'+(e.innerText||'').slice(0,20)); return JSON.stringify(els);}));
console.log('=== C) medida del escenario vacio en t=0..44 ===');
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
console.log(await page.evaluate(()=>{
  const es=document.querySelector('.escenario')||document.querySelector('.lienzo');
  const r=es.getBoundingClientRect();
  const svg=es.querySelector('svg');
  const pintados = svg? [...svg.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect(); const s=getComputedStyle(e); return b.width>0&&b.height>0&&+s.opacity>0.05;}).length : -1;
  return JSON.stringify({clase:es.className, rect:[r.x|0,r.y|0,r.width|0,r.height|0], pct_pantalla:Math.round(r.width*r.height/(1280*860)*100)+'%', nodos_svg_visibles:pintados, texto:(es.innerText||'').slice(0,60)});
}));
console.log('=== D) primer instante con algo dibujado ===');
for(const t of [10,20,30,40,43,44,45,46,50]){
  await page.evaluate(tt=>window.__tutoria.media.seek(tt), t);
  await page.waitForTimeout(350);
  const n = await page.evaluate(()=>{const es=document.querySelector('.escenario')||document.querySelector('.lienzo'); const svg=es.querySelector('svg'); return svg? [...svg.querySelectorAll('line,path,circle,rect,text,polygon,polyline')].filter(e=>{const b=e.getBoundingClientRect(); return b.width>0&&b.height>0&&+getComputedStyle(e).opacity>0.05;}).length : -1;});
  console.log(`  t=${t}s -> elementos dibujados en el escenario: ${n}`);
}
await browser.close();
