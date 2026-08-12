import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,140)));
for (const u of ['http://localhost:57330/?lang=en','http://localhost:57330/?lang=es','http://localhost:57330/']) {
  await page.goto(u,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2500);
  console.log(u, JSON.stringify(await page.evaluate(`({htmlLang:document.documentElement.lang, titulo:document.title, h1:(document.querySelector('h1')||{}).textContent, idioma:(document.querySelector('.idioma')||{}).textContent, hook:!!window.__tutoria})`)));
}
await browser.close();
