import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('CARGA LIMPIA. Pulso Empezar y NO toco nada mas.');
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:150000});
await page.waitForTimeout(700);
const r = await page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(),
  caption: document.querySelector('.caption-current')?.textContent?.trim(),
  enunciado: document.querySelector('.q-enunciado')?.textContent?.trim(),
  opciones: [...document.querySelectorAll('.q .q-opciones button')].map(b=>b.textContent.trim()),
  toggle: document.querySelector('.caption-toggle')?.textContent?.trim(),
  ariaPressed: document.querySelector('.caption-toggle')?.getAttribute('aria-pressed'),
}));
console.log(JSON.stringify(r,null,1));
await page.screenshot({path: SP+'natural-es-8705.png'});
await browser.close();
