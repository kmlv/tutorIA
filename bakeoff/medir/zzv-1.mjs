import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
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
console.log('duracion', await page.evaluate('window.__tutoria.media.duration()'));
console.log('play label inicial:', await page.textContent('#play'));

// arrancar practica por el hook (como el reporte)
await page.evaluate('window.__tutoria.practice.start(); 1');
const q = async () => page.evaluate(() => {
  const q = document.querySelector('.dock .pregunta:last-child .q');
  return q ? {cls:q.className, enun:(q.querySelector('.q-enunciado')||{}).textContent,
    nota:(q.querySelector('.q-nota')||{}).textContent,
    btns:[...q.querySelectorAll('button')].map(b=>b.textContent)} : null;
});
for (let i=0;i<10;i++){
  await page.waitForTimeout(600);
  const s = await q();
  console.log('iter',i, JSON.stringify(s));
  if (s && s.cls.includes('q-manip')) break;
}
console.log('play label en manip:', await page.textContent('#play'));
console.log('estado media: paused=', await page.evaluate('window.__tutoria.media.paused()'),
            't=', await page.evaluate('window.__tutoria.media.currentTime()'));
// geometria
const geo = async () => page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg');
  const linea = svg.querySelector('.capa-linea .recta.linea');
  const tiradores = [...svg.querySelectorAll('.capa-manip .tirador')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]);
  const hits = [...svg.querySelectorAll('.capa-manip circle:not(.tirador)')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy'),c.getAttribute('r')]);
  const textos = [...svg.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent);
  return {linea: linea?{x1:linea.getAttribute('x1'),y1:linea.getAttribute('y1'),x2:linea.getAttribute('x2'),y2:linea.getAttribute('y2')}:null, tiradores, hits, textos, estado: window.__tutoria.estado()};
});
console.log('GEO', JSON.stringify(await geo(), null, 1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/v1-manip.png'});
await browser.close();
