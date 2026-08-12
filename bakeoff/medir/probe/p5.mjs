import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(198); m.play(); });
for (let i=0;i<10;i++){
  await page.waitForTimeout(2000);
  const r = await page.evaluate(()=>({t:window.__tutoria.media.currentTime(),
    band: document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ')}));
  console.log(r.t.toFixed(1), '|', r.band);
}
await page.screenshot({path:'probe/recap.png'});
await browser.close();
