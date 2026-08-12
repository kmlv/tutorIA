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
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const info = await page.evaluate(() => {
  const s = window.__tutoriaSesion;
  return {
    dur: window.__tutoria.media.duration(),
    dock: window.__tutoria.dock && window.__tutoria.dock.actual,
    cueTypes: [...new Set((s.media.cues||[]).map(c=>c.tipo||c.type))],
    cuesTail: (s.media.cues||[]).slice(-12).map(c=>({t:c.t??c.tiempo, tipo:c.tipo||c.type})),
    buttons: [...document.querySelectorAll('button')].map(b=>({cls:b.className, txt:(b.textContent||'').trim().slice(0,40), vis: b.offsetParent!==null})),
  };
});
console.log(JSON.stringify(info, null, 1).slice(0, 6000));
await browser.close();
