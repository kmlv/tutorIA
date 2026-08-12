import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0');
const dur = await page.evaluate('window.__tutoria.media.duration()');
console.log('duracion', dur);
// cues finales
console.log('ultimos cues:', JSON.stringify(await page.evaluate('(window.__tutoriaSesion.media.cues||[]).slice(-6).map(c=>[c.id,c.t])')));
for (const t of [0, 120, 180, 220, Math.floor(dur)]) {
  await page.evaluate(`window.__tutoria.media.seek(${t})`);
  await page.waitForTimeout(400);
  const e = await page.evaluate('(({p1,p2,m})=>({p1,p2,m}))(window.__tutoria.estado())');
  console.log(`t=${t} -> estado`, JSON.stringify(e));
}
await browser.close();
