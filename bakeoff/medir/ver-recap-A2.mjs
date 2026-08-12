import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
for (const url of ['http://localhost:57330/?lang=es&t=215','http://localhost:57330/?lang=en&t=215']) {
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(4000);
  const s = await page.evaluate(() => {
    const q = x => { const e=document.querySelector(x); return e? e.innerText.replace(/\s+/g,' ').trim() : null; };
    const est = window.__tutoria.estado();
    return {t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
      reloj:q('.escenario .tiempo')||q('[class*="tiempo"]')||q('[class*="clock"]'),
      eq:q('.eq-slot'), pr1:q('.card[data-good="g1"] .price'), p1:est.p1, lienzo:q('.lienzo'), cap:(q('.captions-band')||'').slice(0,110)};
  });
  console.log(url); console.log(JSON.stringify(s,null,1));
  await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-recapA2-'+(url.includes('en')?'en':'es')+'.png'});
}
await browser.close();
