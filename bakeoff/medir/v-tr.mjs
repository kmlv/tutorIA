import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const out = await page.evaluate(() => {
  const tr = window.__tutoriaSesion.media.transcript;
  const arr = Array.isArray(tr) ? tr : (tr.segments||tr.lineas||tr.lines||[]);
  return arr.filter(x=>{const t=x.t??x.start??x.inicio; return t>=138&&t<=185;});
});
console.log(JSON.stringify(out,null,1).slice(0,8000));
await browser.close();
