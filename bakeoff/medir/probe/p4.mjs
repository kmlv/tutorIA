import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
async function look(url, seekTo){
  const page = await ctx.newPage();
  page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,200)));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  if (seekTo!=null){ await page.evaluate(t=>window.__tutoria.media.seek(t), seekTo); await page.waitForTimeout(1200); }
  await page.waitForTimeout(800);
  const r = await page.evaluate(()=>({
    t: window.__tutoria.media.currentTime(),
    fichas: Array.from(document.querySelectorAll('.bands .ficha, .bands [class*=ficha], .bands > *')).map(n=>n.innerText.replace(/\n/g,' ¦ ')).slice(0,6),
    eq: document.querySelector('.bands')?.innerText.replace(/\n+/g,' | '),
  }));
  console.log(url, 'seek=',seekTo, '\n  t=',r.t.toFixed(1), '\n  band:', r.eq);
  await page.close();
}
await look('http://localhost:57330/?lang=es&t=231', null);
await look('http://localhost:57330/?lang=es', 231);
await look('http://localhost:57330/?lang=es&t=200', null);
await look('http://localhost:57330/?lang=es&t=180', null);
await browser.close();
