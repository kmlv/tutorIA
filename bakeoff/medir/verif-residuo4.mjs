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
const dump = () => page.evaluate(() => {
  const g = document.querySelector('.capa-interceptos');
  const kids = g ? [...g.children].map(e=>({tag:e.tagName, cls:e.getAttribute('class'), cx:e.getAttribute('cx'), cy:e.getAttribute('cy'), x:e.getAttribute('x'), y:e.getAttribute('y'), t:e.textContent})) : null;
  const q=document.querySelector('.dock .pregunta:last-child .q');
  return {enun:q?(q.querySelector('.q-enunciado')||{}).textContent:null, kids, capas:[...document.querySelectorAll('.lienzo svg > g')].map(g=>g.getAttribute('class'))};
});
const cls = () => page.evaluate(()=>{const q=document.querySelector('.dock .pregunta:last-child .q'); return q?q.className:null;});
for (let i=0;i<8;i++){ await page.waitForTimeout(800); const c=await cls(); if(!c) break;
  if (c.includes('q-manip')) break;
  if (c.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (c.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); } }
console.log('EN EL MANIP:', JSON.stringify(await dump(),null,1));
async function toClient(sx,sy){ return await page.evaluate(([sx,sy])=>{const svg=document.querySelector('.lienzo svg');const p=svg.createSVGPoint();p.x=sx;p.y=sy;const q=p.matrixTransform(svg.getScreenCTM());return [q.x,q.y];},[sx,sy]); }
async function arrastrar(a0,b0){ const a=await toClient(...a0); const b=await toClient(...b0);
  await page.mouse.move(a[0],a[1]); await page.mouse.down();
  for(let k=1;k<=10;k++) await page.mouse.move(a[0]+(b[0]-a[0])*k/10, a[1]+(b[1]-a[1])*k/10);
  await page.mouse.up(); await page.waitForTimeout(120); }
const l = await page.evaluate(()=>{const e=document.querySelector('.capa-linea .recta.linea'); return [+e.getAttribute('x1'),+e.getAttribute('y1'),+e.getAttribute('x2'),+e.getAttribute('y2')];});
const ox=l[0], oy=l[3], pxX=(l[2]-ox)/(100/3), pxY=(oy-l[1])/100;
await arrastrar([l[2],oy],[ox+pxX*50,oy]);
const y1 = await page.evaluate(()=>+document.querySelector('.capa-linea .recta.linea').getAttribute('y1'));
await arrastrar([ox,y1],[ox,oy-pxY*150]);
console.log('\nARRASTRADO (aun en el manip):', JSON.stringify(await dump(),null,1));
await page.click('.dock .pregunta:last-child button.primario');
await page.waitForTimeout(1800);
console.log('\nTRAS LISTO / ITEM SIGUIENTE:', JSON.stringify(await dump(),null,1));
await browser.close();
