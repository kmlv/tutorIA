import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play'); await page.waitForTimeout(1200); await page.click('#ask'); await page.waitForTimeout(400);
const r = await page.evaluate(() => {
  const c = document.querySelector('.composer'); c.dataset.agotado = '1';
  const g = el => ({op:getComputedStyle(el).opacity, pe:getComputedStyle(el).pointerEvents});
  return {input:g(document.querySelector('.composer-input')), enviar:g(document.querySelector('.composer-enviar')),
          chips:Array.from(document.querySelectorAll('.intencion')).map(b=>({t:b.textContent.trim(), ...g(b), dis:b.disabled}))};
});
console.log(JSON.stringify(r,null,1));
await browser.close();
