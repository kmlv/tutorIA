import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SCR='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}, deviceScaleFactor:2});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const dur = await page.evaluate(()=>window.__tutoria.media.duration());
console.log('duracion =', dur);
await page.waitForTimeout(800);
const led = await page.$('.ledger');
await led.screenshot({path:`${SCR}/ledger-t0.png`});
// comprobar en modo compacto (mas tarde en el video)
for (const t of [60,124,180,240]) {
  if (t > dur) continue;
  await page.evaluate(s=>window.__tutoria.media.seek(s), t);
  await page.waitForTimeout(900);
  const st = await page.evaluate(()=>{
    const l = document.querySelector('.ledger');
    const n = [...document.querySelectorAll('.card-name')].map(e=>({txt:e.textContent, tt:getComputedStyle(e).textTransform, vis:e.getBoundingClientRect().width>0}));
    return {compact: l.classList.contains('compact'), names:n};
  });
  console.log('t='+t, JSON.stringify(st));
}
await page.evaluate(()=>window.__tutoria.media.seek(180));
await page.waitForTimeout(900);
const led2 = await page.$('.ledger');
await led2.screenshot({path:`${SCR}/ledger-t180.png`});
await browser.close();
