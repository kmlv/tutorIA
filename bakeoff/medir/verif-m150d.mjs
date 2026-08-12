import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const net=[]; page.on('request', r=>{ if(r.url().includes('/api/')) net.push({dir:'>',u:r.url().split('/').pop(), body:(r.postData()||'').slice(0,500)}); });
page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,500);}catch{} net.push({dir:'<',u:u.split('/').pop(),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click();
await page.waitForFunction(()=>document.querySelector('.dock-body .pregunta:last-child .q-manip'),null,{timeout:20000});
await page.waitForTimeout(700);

// ARRASTRE REAL con el mouse: tirador vertical (y-int 100 -> 150), luego horizontal (33.3 -> 50)
const geom = await page.evaluate(()=>{
  const svg = document.querySelector('.lienzo svg');
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const sx = r.width/vb.width, sy = r.height/vb.height;
  const cs = Array.from(document.querySelectorAll('.capa-manip circle.tirador'));
  const g = window.__tutoria;
  return {
    rect:{x:r.x,y:r.y,w:r.width,h:r.height}, sx, sy,
    tiradores: cs.map(c=>({cx:+c.getAttribute('cx'), cy:+c.getAttribute('cy')})),
  };
});
const toScreen = (cx,cy)=>[geom.rect.x + cx*geom.sx, geom.rect.y + cy*geom.sy];
// tirador Y es el que tiene cx pequeno (sobre el eje vertical)
const tY = geom.tiradores.reduce((a,b)=> a.cx<b.cx? a:b);
const tX = geom.tiradores.reduce((a,b)=> a.cx>b.cx? a:b);
// necesitamos px de y=150 y x=50: usamos las funciones del grafico via aritmetica lineal
const px = await page.evaluate(()=>{
  const svg=document.querySelector('.lienzo svg');
  // dos referencias conocidas de la capa interceptos
  const t=Array.from(svg.querySelectorAll('.capa-interceptos text'));
  return {xText:{x:+t[0].getAttribute('x'), val:parseFloat(t[0].textContent)}, yText:{y:+t[1].getAttribute('y'), val:parseFloat(t[1].textContent)}};
});
// escala: hallamos origen probando con el eje. Mas simple: usamos el drag por pasos y leemos aria.
let [sxp,syp] = toScreen(tY.cx, tY.cy);
await page.mouse.move(sxp,syp); await page.mouse.down();
for (let i=1;i<=20;i++){ await page.mouse.move(sxp, syp - i*4); }
await page.mouse.up();
await page.waitForTimeout(300);
console.log('TRAS ARRASTRAR EL TIRADOR VERTICAL HACIA ARRIBA:');
console.log('  aria :', await page.evaluate(()=>document.querySelector('.lienzo svg').getAttribute('aria-label')));
console.log('  estado:', JSON.stringify(await page.evaluate(()=>{const e=window.__tutoria.estado(); return {m:e.m,p1:e.p1,p2:e.p2};})));
console.log('  bands:', await page.evaluate(()=>document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ')));
await page.screenshot({path:'verif-drag.png'});
await browser.close();
