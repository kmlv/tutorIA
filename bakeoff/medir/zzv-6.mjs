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
await page.addInitScript(()=>{
  window.__log=[]; const of=window.fetch;
  window.fetch=async(...a)=>{const url=typeof a[0]==='string'?a[0]:a[0].url;const req=a[1]&&a[1].body?String(a[1].body):null;
    const r=await of(...a); if(/\/(next|answer)/.test(url)){const c=r.clone();c.text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''),req,resp:t})).catch(()=>{});} return r;};
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
// CAMINO REAL: reproducir hasta el final (salto cerca del final para no esperar 4 min)
await page.evaluate('window.__tutoria.media.seek(230); window.__tutoria.media.play();');
await page.waitForFunction('window.__tutoria.media.currentTime() >= window.__tutoria.media.duration()-0.2 || window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>231', null, {timeout:30000});
await page.waitForTimeout(1500);
console.log('tras ended: playLabel=', await page.textContent('#play'),
  'paused=', await page.evaluate('window.__tutoria.media.paused()'),
  't=', await page.evaluate('window.__tutoria.media.currentTime()'),
  'dock=', await page.evaluate('window.__tutoria.dock.actual'));
await page.waitForSelector('.dock .pregunta:last-child .q-opciones button', {timeout:15000});
await page.click('.dock .pregunta:last-child .q-opciones button');
await page.waitForSelector('.dock .pregunta:last-child .q.q-manip', {timeout:15000});
await page.waitForTimeout(500);
const snap = () => page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg');
  const l = svg.querySelector('.capa-linea .recta.linea');
  return {t:+window.__tutoria.media.currentTime().toFixed(2),
    x2: l?Math.round(+l.getAttribute('x2')):null,
    tir: [...svg.querySelectorAll('.capa-manip .tirador')].map(c=>[Math.round(+c.getAttribute('cx')),Math.round(+c.getAttribute('cy'))]),
    txt: [...svg.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent),
    play: document.getElementById('play').textContent,
    dock: window.__tutoria.dock.actual,
    dockVisible: getComputedStyle(document.querySelector('.dock')).display !== 'none' && document.querySelector('.dock').getBoundingClientRect().height>0,
    manipMontado: !!document.querySelector('.dock .q.q-manip'),
    btnListo: !!document.querySelector('.dock .q.q-manip button.primario'),
  };
});
console.log('manip montado:', JSON.stringify(await snap()));
await page.screenshot({path:OUT+'/REAL-A.png'});
const hit = await page.evaluate(() => {const el=[...document.querySelectorAll('.lienzo svg .capa-manip circle')].find(c=>c.getAttribute('cursor')==='ew-resize');const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
const dest = await page.evaluate(() => {const svg=document.querySelector('.lienzo svg');const l=svg.querySelector('.capa-linea .recta.linea');const x0=+l.getAttribute('x1'),xe=+l.getAttribute('x2');const ppu=(xe-x0)/(100/3);const p=svg.createSVGPoint();p.x=x0+ppu*50;p.y=+l.getAttribute('y2');const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};});
await page.mouse.move(hit.x,hit.y); await page.mouse.down();
for(let i=1;i<=12;i++) await page.mouse.move(hit.x+(dest.x-hit.x)*i/12, hit.y,{steps:1});
await page.mouse.up(); await page.waitForTimeout(300);
console.log('tras arrastre:', JSON.stringify(await snap()));
await page.screenshot({path:OUT+'/REAL-B.png'});
console.log('>>> pulso el boton de reproduccion, que dice:', await page.textContent('#play'));
await page.click('#play');
for(let i=0;i<10;i++){ await page.waitForTimeout(300); console.log('  ', JSON.stringify(await snap())); }
await page.screenshot({path:OUT+'/REAL-C.png'});
// intentar pulsar Listo
try{
  await page.click('.dock .q.q-manip button.primario', {timeout:3000});
  console.log('Listo pulsado');
}catch(e){ console.log('NO SE PUDO PULSAR LISTO:', String(e).slice(0,150)); }
await page.waitForTimeout(1500);
const log = await page.evaluate('window.__log');
for(const l of log.filter(x=>/answer/.test(x.url))) console.log('  REQ:', l.req, '\n  RESP:', (l.resp||'').slice(0,160));
await page.screenshot({path:OUT+'/REAL-D.png'});
console.log('final:', JSON.stringify(await snap()));
await browser.close();
