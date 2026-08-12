import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
await page.goto('http://localhost:57330/?lang=es&t=130', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1500);
const out = await page.evaluate(() => {
  const short = (el) => el ? el.outerHTML.slice(0, 1500) : null;
  return {
    bodyClasses: document.body.className,
    bands: short(document.querySelector('.bands')),
    captions: short(document.querySelector('.captions-band')),
    dock: short(document.querySelector('.dock')),
    q: short(document.querySelector('.q')),
    controls: short(document.querySelector('#play')?.parentElement),
    estado: window.__tutoria.estado(),
    dockActual: window.__tutoria.dock?.actual,
    practice: Object.keys(window.__tutoria.practice||{}),
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 20000));
await browser.close();
