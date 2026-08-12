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
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
await page.addInitScript(()=>{
  window.__log=[];
  const of=window.fetch;
  window.fetch=async(...a)=>{const url=typeof a[0]==='string'?a[0]:a[0].url;const req=a[1]&&a[1].body?String(a[1].body):null;
    const r=await of(...a); if(/\/(next|answer)/.test(url)){const c=r.clone();c.text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''),req,resp:t})).catch(()=>{});} return r;};
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');
// item 1: mcq -> responder correcta
await page.waitForSelector('.dock .pregunta:last-child .q-opciones button');
await page.click('.dock .pregunta:last-child .q-opciones button');
// item 2: manip de recta
await page.waitForSelector('.dock .pregunta:last-child .q.q-manip', {timeout:15000});
await page.waitForTimeout(400);

const geo = () => page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg');
  const linea = svg.querySelector('.capa-linea .recta.linea');
  const tir = [...svg.querySelectorAll('.capa-manip .tirador')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]);
  const hits = [...svg.querySelectorAll('.capa-manip circle:not(.tirador)')].map(c=>({cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),cur:c.getAttribute('cursor')}));
  const txt = [...svg.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent);
  const conj = svg.querySelector('.capa-conjunto .conjunto');
  return {
    linea: linea?{x1:+linea.getAttribute('x1'),y1:+linea.getAttribute('y1'),x2:+linea.getAttribute('x2'),y2:+linea.getAttribute('y2')}:null,
    tiradores:tir, hits, textosIntercepto:txt,
    conjunto: conj?conj.getAttribute('points'):null,
    aria: svg.getAttribute('aria-label'),
    estado: window.__tutoria.estado(),
    playLabel: document.getElementById('play').textContent,
    playDisabled: document.getElementById('play').disabled,
    mediaT: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
    dock: window.__tutoria.dock.actual,
  };
});
console.log('--- A: recien montado ---'); console.log(JSON.stringify(await geo(),null,1));
await page.screenshot({path:OUT+'/A-montado.png'});

// arrastrar el extremo x1 (cursor ew-resize) hasta x=50
const svgBox = await page.locator('.lienzo svg').boundingBox();
const hit = await page.evaluate(() => {
  const svg=document.querySelector('.lienzo svg');
  const el=[...svg.querySelectorAll('.capa-manip circle')].find(c=>c.getAttribute('cursor')==='ew-resize');
  const r=el.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
});
// destino: x=50 en unidades -> pixel. graph.x no expuesto; uso proporcion via textos
const destino = await page.evaluate(() => {
  // localizar pixel de x=50 usando dos referencias conocidas: x=0 (origen) y x=33.33 (extremo actual)
  const svg=document.querySelector('.lienzo svg');
  const linea=svg.querySelector('.capa-linea .recta.linea');
  const x0px=+linea.getAttribute('x1'); // origen x=0
  const xEndPx=+linea.getAttribute('x2'); // x=33.33
  const pxPorUnidad=(xEndPx-x0px)/(100/3);
  const objetivoSvg = x0px + pxPorUnidad*50;
  const pt=svg.createSVGPoint(); pt.x=objetivoSvg; pt.y=+linea.getAttribute('y2');
  const p=pt.matrixTransform(svg.getScreenCTM());
  return {x:p.x,y:p.y,objetivoSvg,x0px,xEndPx};
});
console.log('hit en pantalla', hit, 'destino', destino);
await page.mouse.move(hit.x, hit.y);
await page.mouse.down();
for (let i=1;i<=12;i++) await page.mouse.move(hit.x+(destino.x-hit.x)*i/12, hit.y, {steps:1});
await page.mouse.up();
await page.waitForTimeout(400);
console.log('--- B: tras arrastrar x1 a 50 (SIN confirmar) ---'); console.log(JSON.stringify(await geo(),null,1));
await page.screenshot({path:OUT+'/B-tras-arrastre.png'});

// pulsar Empezar
await page.click('#play');
await page.waitForTimeout(2600);
console.log('--- C: tras 2.6 s de narracion ---'); console.log(JSON.stringify(await geo(),null,1));
await page.screenshot({path:OUT+'/C-tras-play.png'});

// pulsar Listo
await page.click('.dock .pregunta:last-child .q.q-manip button.primario');
await page.waitForTimeout(1500);
const log = await page.evaluate('window.__log');
console.log('--- D: peticiones ---');
for (const l of log) console.log(l.url, '\n   REQ:', l.req, '\n   RESP:', (l.resp||'').slice(0,300));
console.log('--- D geo ---'); console.log(JSON.stringify(await geo(),null,1));
await page.screenshot({path:OUT+'/D-tras-listo.png'});
fs.writeFileSync(OUT+'/v3-log.json', JSON.stringify(log,null,1));
await browser.close();
