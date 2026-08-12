import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.addInitScript(()=>{window.__log=[];const of=window.fetch;window.fetch=async(...a)=>{const url=typeof a[0]==='string'?a[0]:a[0].url;const req=a[1]&&a[1].body?String(a[1].body):null;const r=await of(...a);if(/\/(next|answer)/.test(url)){const c=r.clone();c.text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''),req,resp:t})).catch(()=>{});}return r;};});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(230); window.__tutoria.media.play();');
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>231', null, {timeout:30000});
await page.waitForSelector('.dock .pregunta:last-child .q-opciones button', {timeout:15000});
await page.click('.dock .pregunta:last-child .q-opciones button');
await page.waitForSelector('.dock .pregunta:last-child .q.q-manip', {timeout:15000});
await page.waitForTimeout(500);
const hit = await page.evaluate(() => {const el=[...document.querySelectorAll('.lienzo svg .capa-manip circle')].find(c=>c.getAttribute('cursor')==='ew-resize');const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
const dest = await page.evaluate(() => {const svg=document.querySelector('.lienzo svg');const l=svg.querySelector('.capa-linea .recta.linea');const x0=+l.getAttribute('x1'),xe=+l.getAttribute('x2');const ppu=(xe-x0)/(100/3);const p=svg.createSVGPoint();p.x=x0+ppu*50;p.y=+l.getAttribute('y2');const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};});
await page.mouse.move(hit.x,hit.y); await page.mouse.down();
for(let i=1;i<=12;i++) await page.mouse.move(hit.x+(dest.x-hit.x)*i/12, hit.y,{steps:1});
await page.mouse.up(); await page.waitForTimeout(300);
await page.click('#play'); await page.waitForTimeout(2000);
const est = () => page.evaluate(()=>{
  const dk=document.querySelector('.dock');
  const b=document.querySelector('.dock .q.q-manip button.primario');
  const r=b?b.getBoundingClientRect():null;
  return {dock:window.__tutoria.dock.actual, dockRect:dk.getBoundingClientRect().toJSON(),
    listoRect:r?{x:r.x,y:r.y,w:r.width,h:r.height}:null,
    listoVisible: r? (r.width>0&&r.height>0):false,
    hayLinea: !!document.querySelector('.lienzo svg .capa-linea .recta.linea'),
    tir:[...document.querySelectorAll('.lienzo svg .capa-manip .tirador')].map(c=>[Math.round(+c.getAttribute('cx')),Math.round(+c.getAttribute('cy'))]),
    t:+window.__tutoria.media.currentTime().toFixed(2)};
});
console.log('tras play:', JSON.stringify(await est()));
console.log('--- pruebo recuperar con "Preguntar" (#ask) ---');
await page.click('#ask'); await page.waitForTimeout(800);
console.log('tras #ask:', JSON.stringify(await est()));
await page.screenshot({path:OUT+'/REC-ask.png'});
// intentar Listo
try{ await page.click('.dock .q.q-manip button.primario',{timeout:3000}); console.log('Listo pulsado OK'); }
catch(e){ console.log('Listo NO clicable:', String(e).slice(0,120)); }
await page.waitForTimeout(1500);
const log = await page.evaluate('window.__log');
for(const l of log.filter(x=>/answer/.test(x.url))) console.log('  REQ:', l.req,'\n  RESP:',(l.resp||'').slice(0,180));
console.log('final:', JSON.stringify(await est()));
await page.screenshot({path:OUT+'/REC-final.png'});
await browser.close();
