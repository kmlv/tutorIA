import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
const med = async ()=> page.evaluate(()=>{
  const l=document.querySelector('.lienzo'); const r=l.getBoundingClientRect();
  const svg=l.querySelector('svg');
  const vis = svg? [...svg.querySelectorAll('line,path,circle,rect,text,polygon,polyline,g')].filter(e=>{const b=e.getBoundingClientRect(); return b.width>0&&b.height>0&&+getComputedStyle(e).opacity>0.05;}) : [];
  return {rect:[r.x|0,r.y|0,r.width|0,r.height|0], pct:Math.round(r.width*r.height/(1280*860)*100), n:vis.length, tipos:[...new Set(vis.map(e=>e.tagName))].join(',')};
});
console.log('t=0:', JSON.stringify(await med()));
for(const t of [5,15,25,35,43,44.5,46,60,70]){
  await page.evaluate(tt=>window.__tutoria.media.seek(tt), t); await page.waitForTimeout(400);
  console.log(`t=${t}:`, JSON.stringify(await med()));
}
await browser.close();
