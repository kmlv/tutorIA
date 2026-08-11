import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe});
const ctx = await browser.newContext({viewport:{width:1280,height:860}, colorScheme:'light'});
const page = await ctx.newPage();
const puntos = [['objeto',45],['grafico',70],['algebra',130],['pivote',180]];
for (const [nombre,t] of puntos) {
  await page.goto(`http://localhost:61911/?lang=es&t=${t}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria !== undefined', null, {timeout:30000});
  await page.waitForTimeout(1000);
  const foco = await page.evaluate("document.querySelector('.escenario').dataset.foco");
  await page.locator('.escenario').screenshot({path:`docs/design-review/r2/${nombre}-t${t}.png`});
  console.log(`  ${nombre} t=${t} -> foco=${foco}`);
}
await browser.close();
