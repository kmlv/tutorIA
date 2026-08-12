import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=86', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:60000});
const info = await page.evaluate(() => {
  const qs = [...document.querySelectorAll('.q')];
  return {t: window.__tutoria.media.currentTime(), n: qs.length, qs: qs.map((q,i)=>{
    const r = q.getBoundingClientRect();
    return {i, cls:q.className, id:q.id, dataset:JSON.stringify(q.dataset), vis: r.width>0&&r.height>0, disp:getComputedStyle(q).display, rect:[r.x|0,r.y|0,r.width|0,r.height|0],
      txt: q.innerText.replace(/\s*\n+\s*/g,' ~ ').slice(0,180)};
  })};
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
