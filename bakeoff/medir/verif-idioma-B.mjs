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

const snap = async (page, etiqueta) => {
  const s = await page.evaluate(`(()=>{
    const relojEl = [...document.querySelectorAll('*')].find(e=>/^\\d+:\\d\\d$/.test(e.textContent.trim()) && e.children.length===0);
    const esc = document.querySelector('.escenario');
    const a = [...document.querySelectorAll('a')].find(x=>/English|Espa/i.test(x.innerText));
    return {
      t: +window.__tutoria.media.currentTime().toFixed(2),
      paused: window.__tutoria.media.paused(),
      reloj: relojEl ? relojEl.textContent.trim() : null,
      play: (document.querySelector('#play')||{}).innerText,
      escLen: esc ? esc.innerText.trim().length : null,
      escTxt: esc ? esc.innerText.trim().slice(0,200).replace(/\\n/g,' | ') : null,
      langHref: a ? a.getAttribute('href') : null,
      langTxt: a ? a.innerText.trim() : null,
      url: location.href,
    };
  })()`);
  console.log(etiqueta, JSON.stringify(s, null, 1));
  return s;
};

console.log('=== CASO B ===');
await page.goto('http://localhost:57330/?lang=es&t=130', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(600);
await snap(page, 'CARGA con ?t=130:');

await page.evaluate('window.__tutoria.media.seek(180)');
await page.waitForTimeout(1200);
const antes = await snap(page, 'TRAS seek(180):');
await page.screenshot({path:'vi-B-antes.png'});

await Promise.all([
  page.waitForNavigation({waitUntil:'domcontentloaded'}),
  page.click('a:has-text("English")'),
]);
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1000);
await snap(page, 'DESPUES de English:');
await page.screenshot({path:'vi-B-despues.png'});

// control: como se ve una carga limpia en EN a t=180 y a t=130
const p2 = await ctx.newPage();
await p2.goto('http://localhost:57330/?lang=en&t=180', {waitUntil:'domcontentloaded'});
await p2.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await p2.waitForTimeout(800);
await snap(p2, 'CONTROL ?lang=en&t=180:');

const p3 = await ctx.newPage();
await p3.goto('http://localhost:57330/?lang=en&t=130', {waitUntil:'domcontentloaded'});
await p3.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await p3.waitForTimeout(800);
await snap(p3, 'CONTROL ?lang=en&t=130:');

await browser.close();
