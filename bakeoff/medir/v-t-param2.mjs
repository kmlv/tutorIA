import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

async function probe(url, {seek}={}) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(2500);
  if (seek !== undefined) { await page.evaluate(`window.__tutoria.media.seek(${seek})`); await page.waitForTimeout(1500); }
  const r = await page.evaluate(`(() => {
    const cap = document.querySelector('.captions-band');
    const est = (window.__tutoria.estado && window.__tutoria.estado()) || null;
    return {
      ct: window.__tutoria.media.currentTime(),
      dock: window.__tutoria.dock && window.__tutoria.dock.actual,
      lang: document.documentElement.lang,
      textoBotonPlay: (document.querySelector('#play')||{}).textContent,
      caption: cap ? cap.innerText.slice(0,80) : null,
      estadoKeys: est ? JSON.stringify(est).slice(0,220) : null,
      href: location.href
    };
  })()`);
  console.log(url, seek!==undefined?`(+seek(${seek}))`:'', '\n  ', JSON.stringify(r), '\n');
  await ctx.close();
  return r;
}

console.log('=== A) limpio sin t ===');       const a = await probe('http://localhost:57330/?lang=es');
console.log('=== B) ?t=144 ===');             const b = await probe('http://localhost:57330/?lang=es&t=144');
console.log('=== C) sin t + seek(144) ===');  const c = await probe('http://localhost:57330/?lang=es', {seek:144});
console.log('=== D) ?t=60 ===');              await probe('http://localhost:57330/?lang=es&t=60');
console.log('=== E) ?lang=en (control param) ==='); await probe('http://localhost:57330/?lang=en');
console.log('=== F) ?variant=B (control param) ==='); await probe('http://localhost:57330/?lang=es&variant=B');
console.log('=== G) ?t=144 con hash #t=144 ==='); await probe('http://localhost:57330/?lang=es#t=144');
console.log('B == A (o sea t ignorado)?', b.ct===a.ct && b.estadoKeys===a.estadoKeys);
console.log('C (seek) distinto de A?', c.ct!==a.ct || c.estadoKeys!==a.estadoKeys);
await browser.close();
