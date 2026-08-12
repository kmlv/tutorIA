import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const out = await page.evaluate(() => {
  const s = window.__tutoriaSesion;
  return {
    keys: Object.keys(s),
    duration: window.__tutoria.media.duration(),
    cues: (s.media?.cues||[]).map(c=>({t:c.t ?? c.time ?? c.at, type:c.type, id:c.id, raw: JSON.stringify(c).slice(0,400)}))
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 20000));
await browser.close();
