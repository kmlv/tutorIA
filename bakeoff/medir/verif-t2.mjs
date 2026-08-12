import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));

const snap = async (label) => {
  const s = await page.evaluate(() => ({
    t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
    estado: window.__tutoria.estado().mostrar,
    cap: (document.querySelector('.captions-band')||{}).textContent?.trim().split('Ocultar')[0].slice(0,110),
    reloj: (document.querySelector('.reloj')||{}).textContent?.trim(),
    play: (document.querySelector('#play')||{}).textContent?.trim(),
  }));
  console.log(`=== ${label}\n  t=${s.t.toFixed(2)} paused=${s.paused} reloj=${s.reloj} play=${JSON.stringify(s.play)}`);
  console.log('  mostrar=', JSON.stringify(s.estado));
  console.log('  cap=', JSON.stringify(s.cap));
  return s;
};

// --- caso A: ?t=100, pulsar Empezar
await page.goto('http://localhost:57330/?lang=es&t=100', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await snap('A) carga ?t=100');
await page.click('#play');
await page.waitForTimeout(5200);
await snap('A) 5s despues de Empezar');
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/t100-tras-play.png'});
await page.evaluate(()=>window.__tutoria.media.pause());

// --- caso B: sin ?t, referencia
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await snap('B) carga sin ?t (referencia t=0)');

// --- caso C: ?t=9999
await page.goto('http://localhost:57330/?lang=es&t=9999', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await snap('C) carga ?t=9999');

// --- caso D: seek(180) programatico desde carga limpia
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>window.__tutoria.media.seek(180));
await page.waitForTimeout(600);
await snap('D) seek(180) programatico');

// --- caso E: ?t=100 y pulsar Empezar mirando si hay salto tardio
await page.goto('http://localhost:57330/?lang=es&t=100', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(3000);
const t0 = await page.evaluate(()=>window.__tutoria.media.currentTime());
console.log('E) tras 3s de espera extra, currentTime =', t0);
await browser.close();
