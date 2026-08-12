import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
await page.goto('http://localhost:57330/?lang=es&t=150',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(2000);
const rd = async tag => console.log(tag, JSON.stringify(await page.evaluate(`(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(1),
  relojUI:[...document.querySelectorAll('.escenario *')].map(e=>e.textContent).filter(s=>/^\\d:\\d\\d$/.test(s))[0],
  estado: (({p1,p2,m,mostrar})=>({p1,p2,m,mostrar}))(window.__tutoria.estado()),
  bands: document.querySelector('.bands').innerText.replace(/\\n+/g,' | ').slice(0,220),
  caption: (document.querySelector('.captions-band')||{}).innerText
}))()`)));
await rd('t=150 al cargar (A)');
await page.screenshot({path:SP+'/A-t150.png'});
await page.evaluate('window.__tutoria.media.play()');
await page.waitForTimeout(4000);
await rd('tras Empezar 4s   ');
await page.screenshot({path:SP+'/A-t150-play.png'});
await browser.close();
