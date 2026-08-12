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
const reqs = [];
page.on('request', r => { if (/tutor|ask|preguntar|chat/i.test(r.url())) reqs.push(r.method()+' '+r.url()); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const desc = () => page.evaluate(() => {
  const a = document.activeElement;
  if (!a) return 'null';
  const r = a.getBoundingClientRect();
  return `${a.tagName.toLowerCase()}${a.id?'#'+a.id:''}${a.className&&typeof a.className==='string'?'.'+a.className.trim().split(/\s+/).join('.'):''} | txt="${(a.textContent||a.value||a.placeholder||'').trim().slice(0,40)}" | rect x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.width)} h=${Math.round(r.height)}`;
});

console.log('dock.actual inicial:', await page.evaluate(()=>window.__tutoria?.dock?.actual));
console.log('FOCO inicial:', await desc());
for (let i=1;i<=8;i++){
  await page.keyboard.press('Tab');
  console.log(`Tab ${i}: ${await desc()}`);
}
await browser.close();
