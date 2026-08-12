import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,200)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('checkpoints:', JSON.stringify(await page.evaluate(()=>window.__tutoriaSesion.checkpoints), null, 1).slice(0,3000));
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play(); });
await page.waitForTimeout(4000);
const dump = await page.evaluate(()=>{
  const q = document.querySelector('.q');
  return {
    t: window.__tutoria.media.currentTime(),
    paused: window.__tutoria.media.paused(),
    dockActual: window.__tutoria.dock?.actual,
    hayQ: !!q,
    qHTML: q ? q.outerHTML.slice(0,3000) : null,
    bodyClasses: document.body.className,
  };
});
console.log(JSON.stringify(dump, null, 1));
await page.screenshot({path:'probe/s1.png'});
await browser.close();
