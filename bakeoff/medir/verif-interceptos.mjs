import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');

async function est(){
  return await page.evaluate(() => {
    const q = document.querySelector('.dock .pregunta:last-child .q');
    return q ? {c:q.className, e:(q.querySelector('.q-enunciado')||{}).textContent} : null;
  });
}
let found=null;
for (let i=0;i<14;i++){
  await page.waitForTimeout(600);
  const s = await est();
  if(!s){console.log('sin pregunta'); break;}
  console.log(i, s.c, '|', (s.e||'').slice(0,80));
  if (s.c.includes('q-manip')) { found=s; break; }
  if (s.c.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.c.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.c.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','no se'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else { await page.click('.dock .pregunta:last-child button'); }
}
console.log('MANIP:', JSON.stringify(found));

// Volcado del SVG de interceptos ANTES
const dump = async (etq) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('.lienzo svg');
    const g = svg.querySelector('.capa-interceptos');
    const info = [...g.children].map(el => {
      const a = {};
      for (const at of el.attributes) a[at.name]=at.value;
      return {tag: el.tagName, cls: a.class, cx:a.cx, cy:a.cy, x:a.x, y:a.y, w:a.width, h:a.height, tx:a.x, ty:a.y, txt: el.textContent};
    });
    const linea = svg.querySelector('.capa-linea .recta.linea');
    const la = linea ? {x1:linea.getAttribute('x1'),y1:linea.getAttribute('y1'),x2:linea.getAttribute('x2'),y2:linea.getAttribute('y2')} : null;
    const nCircles = g.querySelectorAll('circle').length;
    const nRects = g.querySelectorAll('rect').length;
    const nTexts = g.querySelectorAll('text').length;
    const tiradores = [...svg.querySelectorAll('.capa-manip .tirador')].map(t=>({cx:t.getAttribute('cx'),cy:t.getAttribute('cy')}));
    return {info, la, nCircles, nRects, nTexts, tiradores, aria: svg.getAttribute('aria-label')};
  });
  console.log('--- '+etq);
  console.log(JSON.stringify(r, null, 1));
  return r;
};
const antes = await dump('ANTES DEL ARRASTRE');
await page.screenshot({path: OUT+'/int-antes.png'});

// Coordenadas de los tiradores en pantalla
const box = await page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg');
  const r = svg.getBoundingClientRect();
  const vb = svg.getAttribute('viewBox');
  const hits = [...svg.querySelectorAll('.capa-manip circle')].map(c=>{
    const b=c.getBoundingClientRect();
    return {cls:c.getAttribute('class'), r:c.getAttribute('r'), cx:c.getAttribute('cx'), cy:c.getAttribute('cy'), sx:b.x+b.width/2, sy:b.y+b.height/2};
  });
  return {rect:{x:r.x,y:r.y,w:r.width,h:r.height}, vb, hits};
});
console.log('BOX', JSON.stringify(box, null, 1));
fs.writeFileSync(OUT+'/box.json', JSON.stringify(box,null,1));

globalThis.__page = page; globalThis.__browser = browser;
// dejamos el navegador abierto para la fase 2 en el mismo script
export {};
