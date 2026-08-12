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
await page.waitForTimeout(1200);
console.log('antes de click, paused=', await page.evaluate('window.__tutoria.media.paused()'));
await page.locator('.q .q-opcion').first().click();
await page.waitForTimeout(2000);
const after = await page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  nq: document.querySelectorAll('.q').length,
  html: document.querySelector('.pregunta')?.innerHTML.slice(0,2500),
  dockTxt: document.querySelector('.dock')?.innerText.replace(/\s*\n+\s*/g,' ~ ').slice(0,600)
}));
console.log('t=',after.t,'paused=',after.paused,'nq=',after.nq);
console.log('HTML:', after.html);
console.log('DOCK:', after.dockTxt);
await browser.close();
