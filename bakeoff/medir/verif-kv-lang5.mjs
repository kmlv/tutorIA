import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
const foto = async (u,n)=>{
  await page.goto(u,{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.waitForTimeout(1500);
  console.log(n, u, JSON.stringify(await page.evaluate(()=>({
    reloj: document.querySelector('.reloj,.tiempo,.time')?.textContent.trim(),
    t: window.__tutoria.media.currentTime().toFixed(1),
    estado: window.__tutoria.estado(),
    captions: (document.querySelector('.captions-band')?.innerText||'').replace(/\s+/g,' ').slice(0,90),
    ownsStage: window.__tutoria.media.ownsStage,
  })),null,1));
  await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/kv-'+n+'.png'});
};
await foto('http://localhost:57330/?lang=en','EN-limpio');
await foto('http://localhost:57330/?lang=en&t=100','EN-t100');
await browser.close();
