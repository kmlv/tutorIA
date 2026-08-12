import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SCR='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}, deviceScaleFactor:3});
for (const lang of ['es','en']) {
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(`http://localhost:57330/?lang=${lang}&t=0`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(1000);
  const names = await page.$$('.card-name');
  for (let i=0;i<names.length;i++){
    const raw = await names[i].evaluate(e=>e.textContent);
    await names[i].screenshot({path: `${SCR}/name-${lang}-${i}.png`});
    console.log(lang, i, 'DOM text =', JSON.stringify(raw));
  }
  await page.close();
}
await browser.close();
