import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=90', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1200);
const linea = async () => page.evaluate(()=>{
  const t=window.__tutoria; const m=t.estado().mostrar;
  return `reloj=${document.querySelector('.reloj').textContent.trim()} ct=${t.media.currentTime().toFixed(1)} ` +
    `mostrar[ejes=${+m.ejes} linea=${+m.linea} conj=${+m.conjunto} pend=${+m.pendiente} inter=${+m.interceptos}] ` +
    `cap="${(document.querySelector('.captions-band')?.textContent||'').trim().slice(0,60)}"`;
});
console.log('antes de play : ' + await linea());
await page.click('#play');
for (const s of [2,4,6,10,14]) { await page.waitForTimeout(s===2?2000:(s===4?2000:(s===6?2000:4000))); console.log(`t≈${s}s play  : ` + await linea()); }
await page.screenshot({path:'verif-t90-play14.png'});
await browser.close();
