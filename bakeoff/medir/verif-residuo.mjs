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
  return {
    qClass: q ? q.className : null,
    enunciado: q ? (q.querySelector('.q-enunciado')||{}).textContent : null,
    nota: q ? ((q.querySelector('.q-nota')||{}).textContent||null) : null,
    opciones: q ? [...q.querySelectorAll('.q-opciones button')].map(b=>b.textContent) : [],
    botones: q ? [...q.querySelectorAll('button')].map(b=>b.textContent) : [],
    intercepTexts: [...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent),
    intercepPos: [...document.querySelectorAll('.capa-interceptos circle')].map(c=>[c.getAttribute('cx'),c.getAttribute('cy')]),
    linea: (()=>{const l=document.querySelector('.capa-linea .recta.linea'); return l?['x1',l.getAttribute('x1'),'y1',l.getAttribute('y1'),'x2',l.getAttribute('x2'),'y2',l.getAttribute('y2')]:null;})(),
    hayCapaManip: !!document.querySelector('.capa-manip'),
    estado: window.__tutoria.estado ? (()=>{const e=window.__tutoria.estado(); return {m:e.m,p1:e.p1,p2:e.p2};})() : null,
  };
});

for (let i=0;i<8;i++){
  await page.waitForTimeout(800);
  const s = await snap();
  console.log(`\n=== iter ${i} ===`);
  console.log(JSON.stringify(s,null,1));
  if (!s.qClass) break;
  if (s.qClass.includes('q-manip')) { console.log('>>> MANIP ALCANZADO en iter', i); break; }
  if (s.qClass.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.qClass.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','1'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.qClass.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','no se'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else { console.log('clase desconocida, paro'); break; }
}
await page.screenshot({path: path.join(OUT,'r-manip.png')});
await browser.close();
