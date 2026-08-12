import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const V of ['A','B']) {
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  await page.goto(`http://localhost:57330/?lang=es&variant=${V}&t=228`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  for (const w of [0,1000,2000]) { await page.waitForTimeout(w===0?300:1000);
    console.log(V,'esperado 228 ->', await page.evaluate('+window.__tutoria.media.currentTime().toFixed(2)'),
      'reloj', await page.evaluate(`document.getElementById('reloj').textContent`)); }
  await page.close();
}
await browser.close();
