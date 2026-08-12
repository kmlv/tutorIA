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
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');

const snap = () => page.evaluate(() => {
  const q = document.querySelector('.dock .pregunta:last-child .q');
  const msgs=[...document.querySelectorAll('.dock .msg')].map(m=>m.textContent.trim());
  return {
    qClass: q ? q.className : null,
    enunciado: q ? (q.querySelector('.q-enunciado')||{}).textContent : null,
    intercepTexts: [...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent),
    linea: (()=>{const l=document.querySelector('.capa-linea .recta.linea'); return l?[+l.getAttribute('x1'),+l.getAttribute('y1'),+l.getAttribute('x2'),+l.getAttribute('y2')]:null;})(),
    conjunto: (()=>{const c=document.querySelector('.capa-conjunto .conjunto'); return c?c.getAttribute('points'):null;})(),
    hayCapaManip: !!document.querySelector('.capa-manip'),
    estado: (()=>{const e=window.__tutoria.estado(); return {m:e.m,p1:e.p1,p2:e.p2, mostrar:e.mostrar};})(),
    ultimos: msgs.slice(-3),
  };
});

// llegar al manip
for (let i=0;i<8;i++){
  await page.waitForTimeout(800);
  const s = await snap();
  if (!s.qClass) break;
  if (s.qClass.includes('q-manip')) break;
  if (s.qClass.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.qClass.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.qClass.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','no se'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
}
console.log('ANTES DEL ARRASTRE:', JSON.stringify(await snap(),null,1));

// helper: svg coords -> client coords
async function toClient(sx, sy){
  return await page.evaluate(([sx,sy])=>{
    const svg = document.querySelector('.lienzo svg');
    const p = svg.createSVGPoint(); p.x=sx; p.y=sy;
    const q = p.matrixTransform(svg.getScreenCTM());
    return [q.x, q.y];
  },[sx,sy]);
}
// donde estan los tiradores ahora (svg coords)
const tiradores = await page.evaluate(()=>{
  return [...document.querySelectorAll('.capa-manip circle')].map(c=>({r:c.getAttribute('r'),cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy')}));
});
console.log('tiradores', JSON.stringify(tiradores));

// escala: usar la recta actual. origen = (x1_de_linea, y2_de_linea)
const l0 = (await snap()).linea; // [x1,y1,x2,y2]
const ox = l0[0], oy = l0[3];
const pxPorX = (l0[2]-ox)/(100/3);   // x-intercepto = 33.33
const pxPorY = (oy-l0[1])/100;       // y-intercepto = 100
const destinoX = ox + pxPorX*50;
const destinoY = oy - pxPorY*150;
console.log('origen', ox, oy, 'destinoX(svg)', destinoX, 'destinoY(svg)', destinoY);

async function arrastrar(fromSvg, toSvg){
  const a = await toClient(fromSvg[0], fromSvg[1]);
  const b = await toClient(toSvg[0], toSvg[1]);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let k=1;k<=10;k++) await page.mouse.move(a[0]+(b[0]-a[0])*k/10, a[1]+(b[1]-a[1])*k/10);
  await page.mouse.up();
  await page.waitForTimeout(120);
}
// arrastrar extremo x1 (eje horizontal) de 33.3 a 50
await arrastrar([l0[2], oy], [destinoX, oy]);
console.log('tras arrastre X:', JSON.stringify((await snap()).intercepTexts));
// arrastrar extremo x2 (eje vertical) de 100 a 150
const l1 = (await snap()).linea;
await arrastrar([ox, l1[1]], [ox, destinoY]);
console.log('tras arrastre Y:', JSON.stringify((await snap()).intercepTexts));

await page.screenshot({path: path.join(OUT,'r-antes-listo.png')});
console.log('ANTES DE LISTO:', JSON.stringify(await snap(),null,1));

// pulsar Listo
await page.click('.dock .pregunta:last-child .q-manip button, .dock .pregunta:last-child button.primario');
await page.waitForTimeout(1500);
console.log('\nTRAS LISTO:', JSON.stringify(await snap(),null,1));
await page.screenshot({path: path.join(OUT,'r-tras-listo.png')});

// siguientes items
for (let i=0;i<4;i++){
  await page.waitForTimeout(1200);
  const s = await snap();
  console.log(`\n--- item siguiente ${i} ---`);
  console.log(JSON.stringify(s,null,1));
  await page.screenshot({path: path.join(OUT,`r-sig-${i}.png`)});
  if (!s.qClass) break;
  if (s.qClass.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.qClass.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','150'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.qClass.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','no se'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else break;
}
await browser.close();
