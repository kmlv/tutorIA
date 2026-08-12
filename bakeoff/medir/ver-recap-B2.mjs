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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => window.__tutoria.media.seek(200));
await page.waitForTimeout(400);
await page.click('#play');
const snap = () => page.evaluate(() => {
  const q = s => { const e=document.querySelector(s); return e? e.innerText.replace(/\s+/g,' ').trim() : null; };
  const est = window.__tutoria.estado();
  return {t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
    eq:q('.eq-slot'), pr1:q('.card[data-good="g1"] .price'),
    p1:est.p1, lienzo:q('.lienzo'), cap:(q('.captions-band')||'').slice(0,120)};
});
for (let i=0;i<45;i++){
  const s = await snap();
  console.log(`t=${String(s.t).padStart(6)} p=${s.paused?1:0} | eq="${s.eq}" | ficha=${s.pr1} estado.p1=${s.p1} | ${s.lienzo}`);
  if (i%5===0) console.log('        cap:', s.cap);
  if (s.t > 231.5) break;
  await page.waitForTimeout(800);
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-recapB2-fin.png'});
await browser.close();
