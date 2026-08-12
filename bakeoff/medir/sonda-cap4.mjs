import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SCR='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}, deviceScaleFactor:2});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=59', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1200);
const cap = await page.evaluate(()=>{
  const c=document.querySelector('.caption-current');
  return {caption: c?c.textContent:null, tt: c?getComputedStyle(c).textTransform:null,
    names:[...document.querySelectorAll('.card-name')].map(e=>e.textContent)};
});
console.log(JSON.stringify(cap,null,2));
await page.screenshot({path:`${SCR}/full-t59.png`});
await browser.close();
