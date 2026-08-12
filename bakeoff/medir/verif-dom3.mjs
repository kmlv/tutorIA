import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play');
await page.evaluate('window.__tutoria.media.seek(84)');
await page.waitForFunction('document.querySelectorAll(".q").length > 0', null, {timeout:60000});
await page.waitForTimeout(1500);
const html = await page.evaluate(() => {
  const q = document.querySelector('.q');
  return {t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
    padre: q.parentElement.className, html: q.outerHTML.slice(0, 3000)};
});
console.log('t=',html.t,'paused=',html.paused,'padre=',html.padre);
console.log(html.html);
await browser.close();
