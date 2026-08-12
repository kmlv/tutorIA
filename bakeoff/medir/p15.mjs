import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=180', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
for(const w of [500,2000,5000,9000]){
  await page.waitForTimeout(w===500?500:w-  (w===2000?500: w===5000?2000:5000));
  console.log(w+'ms:', JSON.stringify(await page.evaluate(()=>({cur:+window.__tutoria.media.currentTime().toFixed(2), audio: (()=>{const a=document.querySelector('audio'); return a? {ct:+a.currentTime.toFixed(2), rs:a.readyState, src:(a.currentSrc||'').split('/').pop()} : 'sin <audio>';})(), reloj:document.querySelector('.reloj')?.innerText}))));
}
console.log('media.seek(180) manual:');
await page.evaluate(()=>window.__tutoria.media.seek(180)); await page.waitForTimeout(1000);
console.log(JSON.stringify(await page.evaluate(()=>({cur:+window.__tutoria.media.currentTime().toFixed(2), reloj:document.querySelector('.reloj')?.innerText, est:JSON.stringify(window.__tutoria.estado().mostrar)}))));
await browser.close();
