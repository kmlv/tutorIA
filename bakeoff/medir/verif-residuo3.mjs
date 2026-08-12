import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');
const snap = () => page.evaluate(() => {
  const q = document.querySelector('.dock .pregunta:last-child .q');
  return {
    qClass: q ? q.className : null,
    enunciado: q ? (q.querySelector('.q-enunciado')||{}).textContent : null,
    intercepTexts: [...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent),
    linea: (()=>{const l=document.querySelector('.capa-linea .recta.linea'); return l?[+l.getAttribute('x1'),+l.getAttribute('y1'),+l.getAttribute('x2'),+l.getAttribute('y2')]:null;})(),
    bands: (document.querySelector('.bands')||{}).innerText,
    aria: (document.querySelector('.lienzo svg')||{}).getAttribute ? document.querySelector('.lienzo svg').getAttribute('aria-label') : null,
    hayCapaManip: !!document.querySelector('.capa-manip'),
  };
});
for (let i=0;i<8;i++){ await page.waitForTimeout(800); const s=await snap(); if(!s.qClass) break;
  if (s.qClass.includes('q-manip')) break;
  if (s.qClass.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.qClass.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); } }
const s0 = await snap();
console.log('EN EL MANIP (antes de tocar):'); console.log(JSON.stringify(s0,null,1));
await page.screenshot({path: path.join(OUT,'v3-manip-inicial.png')});
async function toClient(sx,sy){ return await page.evaluate(([sx,sy])=>{const svg=document.querySelector('.lienzo svg');const p=svg.createSVGPoint();p.x=sx;p.y=sy;const q=p.matrixTransform(svg.getScreenCTM());return [q.x,q.y];},[sx,sy]); }
async function arrastrar(a0,b0){ const a=await toClient(a0[0],a0[1]); const b=await toClient(b0[0],b0[1]);
  await page.mouse.move(a[0],a[1]); await page.mouse.down();
  for(let k=1;k<=10;k++) await page.mouse.move(a[0]+(b[0]-a[0])*k/10, a[1]+(b[1]-a[1])*k/10);
  await page.mouse.up(); await page.waitForTimeout(120); }
const l0=s0.linea, ox=l0[0], oy=l0[3];
const pxX=(l0[2]-ox)/(100/3), pxY=(oy-l0[1])/100;
await arrastrar([l0[2],oy],[ox+pxX*50,oy]);
const l1=(await snap()).linea;
await arrastrar([ox,l1[1]],[ox,oy-pxY*150]);
await page.screenshot({path: path.join(OUT,'v3-manip-resuelto.png')});
await page.click('.dock .pregunta:last-child button.primario');
await page.waitForTimeout(1800);
console.log('\n>>> ITEM SIGUIENTE (numerico, intercepto vertical):');
console.log(JSON.stringify(await snap(),null,1));
await page.screenshot({path: path.join(OUT,'v3-item2-residuo.png')});
await page.screenshot({path: path.join(OUT,'v3-item2-lienzo.png'), clip: await page.evaluate(()=>{const r=document.querySelector('.escenario').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};})});
// responder el numerico
await page.fill('.dock .pregunta:last-child .q-input','150');
await page.click('.dock .pregunta:last-child button[type=submit]');
await page.waitForTimeout(1800);
console.log('\n>>> ITEM #3 (precio del cafe 3->4):');
console.log(JSON.stringify(await snap(),null,1));
await page.screenshot({path: path.join(OUT,'v3-item3-residuo.png')});
await browser.close();
