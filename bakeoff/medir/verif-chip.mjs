import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#ask'); await page.waitForTimeout(600);
const chips = await page.$$('.dock button');
for (const c of chips) if ((await c.innerText()).trim()==='No entiendo') { await c.click(); break; }
await page.waitForTimeout(7000);
console.log('SIN limite, tras «No entiendo»:\n' + (await page.evaluate(()=>document.querySelector('.dock').innerText)).slice(0,500));
await browser.close();
