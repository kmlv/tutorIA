import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const t of [155,157,176,177,207,208,214,220]){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
  await page.goto(`http://localhost:57330/?lang=es&t=${t}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.waitForTimeout(700);
  const r = await page.evaluate(()=>{const x=document.querySelector('.bands')?.innerText.replace(/\s+/g,' ')||'';
    return {eq:x.replace(/.*\$\d\/kg/,'').replace(/●.*/,'').trim(), unchanged:/unchanged/i.test(x), dur:window.__tutoria.media.duration()};});
  console.log(`t=${t}  unchanged=${r.unchanged}  eq="${r.eq}"  (dur=${r.dur.toFixed(1)})`);
  await ctx.close();
}
await browser.close();
