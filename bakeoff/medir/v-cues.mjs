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
  const s = window.__tutoriaSesion;
  const cues = s.media.cues.filter(c => c.t >= 138 && c.t <= 185)
    .map(c => ({t:c.t, tipo:c.tipo||c.type, ...c}));
  const cp = s.media.cues.filter(c => JSON.stringify(c).includes('cp1'));
  return {cues, cp, keys:Object.keys(s)};
});
console.log(JSON.stringify(out,null,1).slice(0,9000));
await browser.close();
