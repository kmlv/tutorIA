import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
for (const u of ['http://localhost:57330/?lang=fr','http://localhost:57330/?lang=ES','http://localhost:57330/?lang=en&t=225']) {
  console.log('===',u);
  await page.goto(u,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
  console.log(JSON.stringify(await page.evaluate(`(()=>({hook:!!window.__tutoria, h1:(document.querySelector('h1')||{}).textContent,
    body:document.body.innerText.replace(/\\n+/g,' | ').slice(0,180),
    idioma:(document.querySelector('.idioma')||{}).textContent, href:(document.querySelector('.idioma')||{getAttribute:()=>null}).getAttribute&&document.querySelector('.idioma')?document.querySelector('.idioma').getAttribute('href'):null,
    dur: window.__tutoria? +window.__tutoria.media.duration().toFixed(1):null,
    t: window.__tutoria? +window.__tutoria.media.currentTime().toFixed(1):null,
    caption:(document.querySelector('.captions-band')||{}).innerText}))()`)));
  await page.screenshot({path:SP+'/lang-'+u.split('?')[1].replace(/[=&]/g,'_')+'.png'});
}
await browser.close();
