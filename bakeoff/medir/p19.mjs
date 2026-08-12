import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
console.log(await page.evaluate(()=>{
  const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && e.textContent.trim()==='Jugo De Naranja' || (e.children.length===0&&/Jugo/.test(e.textContent)));
  if(!el) return 'no encontrado';
  return JSON.stringify({txt:el.textContent, cls:el.className, tt:getComputedStyle(el).textTransform, padreCls:el.parentElement.className});
}));
await browser.close();
