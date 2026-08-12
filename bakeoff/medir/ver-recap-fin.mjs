import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => window.__tutoria.media.seek(228));
await page.waitForTimeout(300);
await page.click('#play');
const snap = () => page.evaluate(() => {
  const q = s => { const e=document.querySelector(s); return e? e.innerText.replace(/\s+/g,' ').trim() : null; };
  return {t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
    eq:q('.eq-slot'), pr1:q('.card[data-good="g1"] .price'), p1:window.__tutoria.estado().p1,
    lienzo:q('.lienzo'), q:q('.q'), dock:(window.__tutoria.dock&&window.__tutoria.dock.actual)||null};
});
for (let i=0;i<14;i++){
  const s = await snap();
  console.log(`t=${s.t} p=${s.paused?1:0} eq="${s.eq}" ficha=${s.pr1} p1=${s.p1} lienzo="${s.lienzo}" dock=${JSON.stringify(s.dock)}`);
  if (s.q) console.log('   PREGUNTA:', s.q.slice(0,160));
  await page.waitForTimeout(1500);
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-recap-tras-fin.png', fullPage:false});
await browser.close();
