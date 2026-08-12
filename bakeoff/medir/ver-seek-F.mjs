import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
for (const u of ['?lang=es&t=180','?lang=es&t=101','?t=180&lang=es','?lang=es&t=180.0']) {
  await page.goto('http://localhost:57330/'+u, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(2500);
  const s = await page.evaluate(()=>{
    const el = Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0 && /^\d+:\d\d/.test((e.textContent||'').trim()));
    return {ct:+window.__tutoria.media.currentTime().toFixed(2), reloj: el&&el.textContent.trim(), play:document.querySelector('#play')?.textContent.trim(),
      lineaVisible: window.__tutoria.estado().mostrar.linea};
  });
  console.log(u, '->', JSON.stringify(s));
}
await browser.close();
