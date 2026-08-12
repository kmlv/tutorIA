import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('requestfailed', r => console.log('  REQ FAILED:', r.url()));
await page.goto('http://localhost:57330/?lang=es&variant=A&t=80', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const snap = async (tag) => {
  const o = await page.evaluate(`(()=>{
    const q=document.querySelector('.q');
    return {
      t:+window.__tutoria.media.currentTime().toFixed(1),
      paused:window.__tutoria.media.paused(),
      dock:window.__tutoria.dock.actual,
      q: q? {enun:(q.querySelector('.q-enunciado')||{}).textContent, ops:[...q.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()), manip: !!q.querySelector('.q-manip')} : null,
      dockText: (document.querySelector('.dock')||{}).innerText,
      sess: window.__tutoriaSesion.session_id,
    };
  })()`);
  console.log(tag, JSON.stringify(o).slice(0,900));
};
await snap('t=80 ');
await page.evaluate('window.__tutoria.media.play()');
// wait for question to appear
await page.waitForSelector('.q', {timeout:30000});
await page.waitForTimeout(500);
await snap('question appeared ');
await browser.close();
