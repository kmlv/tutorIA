import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const P=(...a)=>console.log(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '));
try{
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => P('  JS ERROR: '+String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');
const est = () => page.evaluate(() => { const q=document.querySelector('.dock .pregunta:last-child .q'); return q?{c:q.className,e:(q.querySelector('.q-enunciado')||{}).textContent}:null; });
for (let i=0;i<10;i++){ await page.waitForTimeout(500); const s=await est(); if(!s)break;
  if (s.c.includes('q-manip')) {P('MANIP: '+s.e); break;}
  if (s.c.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.c.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.c.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','x'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else await page.click('.dock .pregunta:last-child button'); }

P('CAPAS DEL SVG: '+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.lienzo svg > g')].map(g=>g.getAttribute('class')+' ('+g.children.length+')'))));
P('INTERCEPTOS (clases): '+JSON.stringify(await page.evaluate(()=>[...document.querySelector('.lienzo svg .capa-interceptos').children].map(e=>e.tagName+'.'+e.getAttribute('class')))));
P('FANTASMA: '+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.lienzo svg .capa-linea *')].map(e=>e.tagName+'.'+e.getAttribute('class')+' d='+(e.getAttribute('x1')+','+e.getAttribute('y1')+'->'+e.getAttribute('x2')+','+e.getAttribute('y2'))))));

const map = await page.evaluate(() => { const svg=document.querySelector('.lienzo svg'); const l=svg.querySelector('.capa-linea .recta.linea');
  const ox=+l.getAttribute('x1'),yTop=+l.getAttribute('y1'),xRight=+l.getAttribute('x2'),oy=+l.getAttribute('y2'); const m=svg.getScreenCTM();
  const conv=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(m);return{x:q.x,y:q.y};};
  const sx=(xRight-ox)/(100/3), sy=(yTop-oy)/100;
  return {x1a:conv(xRight,oy),x1b:conv(ox+50*sx,oy),x2a:conv(ox,yTop),x2b:conv(ox,oy+150*sy)}; });

// VIA TECLADO, no raton: mismo renderDOM
await page.click('.lienzo svg'); // dar foco no funciona sin pointerdown sobre tirador; usamos raton para x1
await page.mouse.move(map.x1a.x,map.x1a.y); await page.mouse.down(); await page.mouse.move(map.x1b.x,map.x1b.y,{steps:6}); await page.mouse.up();
await page.waitForTimeout(120);
P('TRAS RATON x1 -> circulo: '+JSON.stringify(await page.evaluate(()=>{const c=document.querySelector('.lienzo svg .capa-interceptos circle');return {cx:c.getAttribute('cx'),cy:c.getAttribute('cy')};})));
// ahora 3 flechas derecha (teclado)
for(let i=0;i<3;i++){ await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60); }
P('TRAS 3x FlechaDerecha -> circulo: '+JSON.stringify(await page.evaluate(()=>{const c=document.querySelector('.lienzo svg .capa-interceptos circle');const t=document.querySelectorAll('.lienzo svg .capa-interceptos text')[0];return {cx:c.getAttribute('cx'),cy:c.getAttribute('cy'),etiqueta:t.textContent,etiqX:t.getAttribute('x')};})));

await page.mouse.move(map.x2a.x,map.x2a.y); await page.mouse.down(); await page.mouse.move(map.x2b.x,map.x2b.y,{steps:6}); await page.mouse.up();
await page.waitForTimeout(150);
await page.locator('.lienzo').screenshot({path:OUT+'/int3-antes-listo.png'});
// CONFIRMAR
await page.click('.dock .pregunta:last-child button.primario');
await page.waitForTimeout(1800);
P('TRAS PULSAR LISTO -> interceptos: '+JSON.stringify(await page.evaluate(()=>{const g=document.querySelector('.lienzo svg .capa-interceptos'); if(!g) return 'sin capa';
  const c=g.querySelector('circle'),r=g.querySelector('rect'),ts=[...g.querySelectorAll('text')].map(t=>t.textContent);
  return {c:c&&{cx:c.getAttribute('cx'),cy:c.getAttribute('cy')}, r:r&&{x:r.getAttribute('x'),y:r.getAttribute('y')}, ts};})));
P('VEREDICTO EN EL DOCK: '+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].slice(-3).map(m=>m.className+': '+m.textContent.slice(0,180)))));
await page.locator('.lienzo').screenshot({path:OUT+'/int3-tras-listo.png'});
}catch(e){P('FALLO SCRIPT: '+String(e).slice(0,400));}
await browser.close();
