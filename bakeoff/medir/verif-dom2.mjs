import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=84', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('inicial t=', await page.evaluate('window.__tutoria.media.currentTime()'));
await page.click('#play');
for (let i=0;i<25;i++){
  const s = await page.evaluate(()=>({t:window.__tutoria.media.currentTime(), p:window.__tutoria.media.paused(),
     nq: document.querySelectorAll('.q').length,
     vis: [...document.querySelectorAll('.q')].filter(q=>q.getBoundingClientRect().height>0).length}));
  console.log(i, JSON.stringify(s));
  if (s.p && i>2) break;
  await page.waitForTimeout(1000);
}
const info = await page.evaluate(() => {
  const qs = [...document.querySelectorAll('.q')];
  return {t: window.__tutoria.media.currentTime(), n: qs.length, qs: qs.map((q,i)=>{
    const r = q.getBoundingClientRect();
    return {i, cls:q.className, dataset:JSON.stringify(q.dataset), h:r.height|0, disp:getComputedStyle(q).display,
      padre: q.parentElement.className, txt: q.innerText.replace(/\s*\n+\s*/g,' ~ ').slice(0,140)};
  })};
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
