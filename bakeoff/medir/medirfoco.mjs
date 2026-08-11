import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
for (const t of [45,70,130,180]) {
  await page.goto(`http://localhost:61911/?lang=es&t=${t}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria !== undefined', null, {timeout:30000});
  await page.waitForTimeout(800);
  const r = await page.evaluate(`(() => {
    const b = e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(r.bottom)]; };
    const st = document.querySelector('.stage'), li = document.querySelector('.lienzo');
    return {foco: document.querySelector('.escenario').dataset.foco,
            stage: b(st), lienzo: b(li),
            desborda: li.getBoundingClientRect().bottom > st.getBoundingClientRect().bottom + 1};
  })()`);
  console.log(`t=${t}`, JSON.stringify(r));
}
await browser.close();
