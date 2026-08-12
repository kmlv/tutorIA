import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=90', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1000);
console.log('antes  :', await page.evaluate(()=>`ct=${window.__tutoria.media.currentTime()} reloj=${document.querySelector('.reloj').textContent.trim()}`));
await page.evaluate(()=>window.__tutoria.media.seek(90));
await page.waitForTimeout(800);
console.log('tras media.seek(90):', await page.evaluate(()=>`ct=${window.__tutoria.media.currentTime().toFixed(1)} reloj=${document.querySelector('.reloj').textContent.trim()}`));
await page.click('#play'); await page.waitForTimeout(3000);
console.log('tras play 3s      :', await page.evaluate(()=>`ct=${window.__tutoria.media.currentTime().toFixed(1)} reloj=${document.querySelector('.reloj').textContent.trim()} cap="${(document.querySelector('.captions-band')?.textContent||'').trim().slice(0,70)}"`));
await browser.close();
