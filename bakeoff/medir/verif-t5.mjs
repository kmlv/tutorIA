import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
const m = async ()=> await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(1),
  mostrar:window.__tutoria.estado().mostrar,
  cap:(document.querySelector('.captions-band')||{}).textContent?.trim().split('Ocultar')[0].slice(0,80)}));

// genuino t=5 (seek limpio)
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>window.__tutoria.media.seek(5)); await page.waitForTimeout(500);
console.log('GENUINO t=5 :', JSON.stringify(await m()));

// t=5 alcanzado reproduciendo tras ?t=100
await page.goto('http://localhost:57330/?lang=es&t=100', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.click('#play');
for (const w of [5000,15000,20000]) { await page.waitForTimeout(w===5000?5000:w-0); const s=await m();
  console.log(`tras ?t=100 + play, t=${s.t}:`, JSON.stringify(s.mostrar), JSON.stringify(s.cap)); if(w!==20000) continue; }
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/desfase.png'});
await browser.close();
