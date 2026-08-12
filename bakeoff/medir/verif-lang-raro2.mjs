import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const u of ['http://localhost:57330/?lang=EN','http://localhost:57330/?lang=en-US','http://localhost:57330/?lang=es&t=120','http://localhost:57330/?lang=Es','http://localhost:57330/?lang=%20es']) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage(); const errs=[];
  page.on('pageerror', e => errs.push(String(e).split('\n')[0].slice(0,120)));
  await page.goto(u,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3000);
  const o = await page.evaluate(()=>({len:document.body.innerText.length, hook:!!window.__tutoria}));
  console.log(u.padEnd(46), 'bodyLen='+String(o.len).padEnd(5), 'hook='+o.hook, errs.join(''));
  // ¿se recupera al recargar?
  if(o.len===0){ await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(2500);
    const o2 = await page.evaluate(()=>document.body.innerText.length);
    console.log('    tras F5 -> bodyLen=', o2); }
  await ctx.close();
}
await browser.close();
