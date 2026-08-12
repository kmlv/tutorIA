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
  const m = s.media;
  const capKeys = Object.keys(m);
  const caps = (m.captions||m.subtitulos||m.transcript||[]).filter?.(c=>c.t>=140&&c.t<=180) ?? null;
  return {checkpoints: s.checkpoints, mediaKeys: capKeys, caps};
});
console.log(JSON.stringify(out,null,1).slice(0,12000));
await browser.close();
