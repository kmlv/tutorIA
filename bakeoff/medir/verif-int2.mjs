import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const log=[]; const P=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
try{
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => P('  JS ERROR: '+String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');

const est = () => page.evaluate(() => {
  const q = document.querySelector('.dock .pregunta:last-child .q');
  return q ? {c:q.className, e:(q.querySelector('.q-enunciado')||{}).textContent} : null;
});
let found=null;
for (let i=0;i<10;i++){
  await page.waitForTimeout(500);
  const s = await est(); if(!s){P('sin pregunta');break;}
  P(`item ${i}: ${s.c} | ${(s.e||'').slice(0,90)}`);
  if (s.c.includes('q-manip')) { found=s; break; }
  if (s.c.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.c.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.c.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','no se'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else await page.click('.dock .pregunta:last-child button');
}
P('MANIP ENCONTRADO: '+JSON.stringify(found));
if(!found) throw new Error('no llegamos al manip');

const dump = async (etq) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('.lienzo svg');
    const g = svg.querySelector('.capa-interceptos');
    const conteo = {circle:g.querySelectorAll('circle').length, rect:g.querySelectorAll('rect').length, text:g.querySelectorAll('text').length};
    const c = g.querySelector('circle'); const rc = g.querySelector('rect');
    const ts = [...g.querySelectorAll('text')].map(t=>({x:t.getAttribute('x'),y:t.getAttribute('y'),txt:t.textContent}));
    const linea = svg.querySelector('.capa-linea .recta.linea');
    const la = linea?{x1:linea.getAttribute('x1'),y1:linea.getAttribute('y1'),x2:linea.getAttribute('x2'),y2:linea.getAttribute('y2')}:null;
    const tir = [...svg.querySelectorAll('.capa-manip .tirador')].map(t=>({cx:t.getAttribute('cx'),cy:t.getAttribute('cy')}));
    return {conteo, circulo:c?{cx:c.getAttribute('cx'),cy:c.getAttribute('cy')}:null,
      rect:rc?{x:rc.getAttribute('x'),y:rc.getAttribute('y'),w:rc.getAttribute('width'),h:rc.getAttribute('height')}:null,
      textos:ts, recta:la, tiradores:tir, aria:svg.getAttribute('aria-label')};
  });
  P('--- '+etq); P(JSON.stringify(r));
  return r;
};
const antes = await dump('ANTES DEL ARRASTRE');
await page.screenshot({path: OUT+'/int-antes.png'});

// mapeo: leemos la recta (x1,y1)=(x(0),y(m/p2)) y (x2,y2)=(x(m/p1),y(0))
const map = await page.evaluate(() => {
  const svg=document.querySelector('.lienzo svg');
  const l=svg.querySelector('.capa-linea .recta.linea');
  const ox=+l.getAttribute('x1'), yTop=+l.getAttribute('y1'), xRight=+l.getAttribute('x2'), oy=+l.getAttribute('y2');
  const m=svg.getScreenCTM();
  const conv=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(m);return {x:q.x,y:q.y};};
  const sx=(xRight-ox)/(100/3), sy=(yTop-oy)/100;
  return {ox,oy,yTop,xRight,sx,sy,
    x1_ahora:conv(xRight,oy), x1_meta:conv(ox+50*sx,oy),
    x2_ahora:conv(ox,yTop),   x2_meta:conv(ox,oy+150*sy)};
});
P('MAPA '+JSON.stringify(map));

// ARRASTRE 1: extremo x1 de 33.3 -> 50
let p0=map.x1_ahora, p1=map.x1_meta;
P(`drag x1: pantalla ${JSON.stringify(p0)} -> ${JSON.stringify(p1)}`);
await page.mouse.move(p0.x,p0.y); await page.mouse.down();
await page.mouse.move((p0.x+p1.x)/2,p0.y,{steps:5});
await page.waitForTimeout(120);
const durante1 = await dump('DURANTE EL ARRASTRE DE x1 (a mitad de camino)');
await page.screenshot({path: OUT+'/int-durante.png'});
await page.mouse.move(p1.x,p1.y,{steps:5}); await page.waitForTimeout(80); await page.mouse.up();
await page.waitForTimeout(150);
const tras1 = await dump('TRAS SOLTAR x1 (deberia ser 50.0)');

// ARRASTRE 2: extremo x2 de 100 -> 150
let q0=map.x2_ahora, q1=map.x2_meta;
P(`drag x2: pantalla ${JSON.stringify(q0)} -> ${JSON.stringify(q1)}`);
await page.mouse.move(q0.x,q0.y); await page.mouse.down();
await page.mouse.move(q0.x,(q0.y+q1.y)/2,{steps:5}); await page.waitForTimeout(120);
await page.mouse.move(q1.x,q1.y,{steps:5}); await page.waitForTimeout(120); await page.mouse.up();
await page.waitForTimeout(200);
const tras2 = await dump('TRAS SOLTAR x2 (deberia ser 150)');
await page.screenshot({path: OUT+'/int-final.png'});
await page.locator('.lienzo').screenshot({path: OUT+'/int-lienzo.png'});

// distancia entre el marcador y su etiqueta, en px de pantalla
const dist = await page.evaluate(() => {
  const svg=document.querySelector('.lienzo svg'); const g=svg.querySelector('.capa-interceptos');
  const c=g.querySelector('circle'); const rc=g.querySelector('rect');
  const ts=[...g.querySelectorAll('text')];
  const bb=e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};};
  const dc=bb(c), dt0=bb(ts[0]), dr=bb(rc), dt1=bb(ts[1]);
  const tir=[...svg.querySelectorAll('.capa-manip .tirador')].map(bb);
  return {circulo:dc, etiqX:dt0, distX:Math.hypot(dc.x-dt0.x,dc.y-dt0.y),
          rect:dr, etiqY:dt1, distY:Math.hypot(dr.x-dt1.x,dr.y-dt1.y), tiradores:tir};
});
P('DISTANCIAS EN PANTALLA: '+JSON.stringify(dist));
}catch(e){P('FALLO SCRIPT: '+String(e).slice(0,400));}
fs.writeFileSync(OUT+'/verif.log', log.join('\n'));
await browser.close();
