import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const SP = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
for (const u of ['http://localhost:57330/?lang=en&variant=B',
                 'http://localhost:57330/?lang=es&variant=C',
                 'http://localhost:57330/?lang=es&variant=b']) {
  console.log('=== ', u);
  await page.goto(u, {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(4000);
  const o = await page.evaluate(`(()=>({
    hook: !!window.__tutoria,
    texto: document.body.innerText.replace(/\\n+/g,' | ').slice(0,300),
    botones: [...document.querySelectorAll('button,a')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,15),
    play: (()=>{const p=document.querySelector('#play'); return p? {txt:p.textContent, disabled:p.disabled}:null})(),
    video: !!document.querySelector('video'),
    lienzoVisible: (()=>{const l=document.querySelector('.lienzo'); return l? getComputedStyle(l).display : null})(),
  }))()`);
  console.log(JSON.stringify(o, null, 1));
  await page.screenshot({path: SP+'/crash-'+u.split('?')[1].replace(/[=&]/g,'_')+'.png'});
}
await browser.close();
