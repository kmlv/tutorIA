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
  window.__log=[]; const of=window.fetch;
  window.fetch=async(...a)=>{const url=typeof a[0]==='string'?a[0]:a[0].url;const req=a[1]&&a[1].body?String(a[1].body):null;
    const r=await of(...a); if(/\/(next|answer)/.test(url)){const c=r.clone();c.text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''),req,resp:t})).catch(()=>{});} return r;};
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');
await page.waitForSelector('.dock .pregunta:last-child .q-opciones button');
await page.click('.dock .pregunta:last-child .q-opciones button');
await page.waitForSelector('.dock .pregunta:last-child .q.q-manip', {timeout:15000});
await page.waitForTimeout(400);

const snap = () => page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg');
  const l = svg.querySelector('.capa-linea .recta.linea');
  const tir = [...svg.querySelectorAll('.capa-manip .tirador')].map(c=>[Math.round(+c.getAttribute('cx')),Math.round(+c.getAttribute('cy'))]);
  const txt = [...svg.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent);
  const fichas = [...document.querySelectorAll('.bands .ficha, .bands [class*=estacion]')].map(e=>e.className+':'+(e.textContent||'').trim().slice(0,30));
  return {t:+window.__tutoria.media.currentTime().toFixed(2),
    x2: l?Math.round(+l.getAttribute('x2')):null, y1: l?Math.round(+l.getAttribute('y1')):null,
    tir, txt, aria:(svg.getAttribute('aria-label')||'').slice(0,120),
    ejeOn: !!svg.querySelector('.capa-ejes'),
    revelados: document.querySelectorAll('.bands .on').length,
    manipMontado: !!document.querySelector('.dock .q.q-manip'),
    subtitulo: (document.querySelector('.captions-band')||{}).textContent };
});
const svgD = await page.locator('.lienzo svg').boundingBox();
console.log('A montado:', JSON.stringify(await snap()));
await page.screenshot({path:OUT+'/R-A-montado.png'});

const hit = await page.evaluate(() => {
  const el=[...document.querySelectorAll('.lienzo svg .capa-manip circle')].find(c=>c.getAttribute('cursor')==='ew-resize');
  const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};
});
const dest = await page.evaluate(() => {
  const svg=document.querySelector('.lienzo svg'); const l=svg.querySelector('.capa-linea .recta.linea');
  const x0=+l.getAttribute('x1'), xe=+l.getAttribute('x2'); const ppu=(xe-x0)/(100/3);
  const p=svg.createSVGPoint(); p.x=x0+ppu*50; p.y=+l.getAttribute('y2');
  const q=p.matrixTransform(svg.getScreenCTM()); return {x:q.x,y:q.y};
});
await page.mouse.move(hit.x,hit.y); await page.mouse.down();
for(let i=1;i<=12;i++) await page.mouse.move(hit.x+(dest.x-hit.x)*i/12, hit.y,{steps:1});
await page.mouse.up(); await page.waitForTimeout(300);
console.log('B tras arrastre:', JSON.stringify(await snap()));
await page.screenshot({path:OUT+'/R-B-arrastrado.png'});

await page.click('#play');
const traza=[];
for(let i=0;i<40;i++){ await page.waitForTimeout(200); traza.push(await snap()); }
for(const s of traza) console.log('  t='+s.t, 'x2='+s.x2, 'tir='+JSON.stringify(s.tir), 'txt='+JSON.stringify(s.txt), 'rev='+s.revelados, 'manip='+s.manipMontado);
await page.screenshot({path:OUT+'/R-C-tras-play.png'});
const antesListo = await snap();
console.log('ANTES DE LISTO:', JSON.stringify(antesListo,null,1));
await page.click('.dock .pregunta:last-child .q.q-manip button.primario');
await page.waitForTimeout(1500);
const log = await page.evaluate('window.__log');
console.log('--- peticiones answer ---');
for(const l of log.filter(x=>/answer/.test(x.url))) console.log('  REQ:', l.req, '\n  RESP:', (l.resp||'').slice(0,200));
await page.screenshot({path:OUT+'/R-D-tras-listo.png'});
fs.writeFileSync(OUT+'/R-traza.json', JSON.stringify({traza,log},null,1));
await browser.close();
