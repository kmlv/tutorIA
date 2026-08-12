import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const v of ['a','b','','B%20','A ','x','1','AB','C','D']) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await page.goto('http://localhost:57330/?lang=es&variant='+v,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2600);
  const s = await page.evaluate(()=>({hook:typeof window.__tutoria!=='undefined', dur:window.__tutoria?.media?.duration()??null}));
  console.log('variant='+JSON.stringify(v).padEnd(8), 'vivo:', s.hook?'SI':'NO ', 'dur:', s.dur, errs[0]||'');
  await ctx.close();
}
await browser.close();
