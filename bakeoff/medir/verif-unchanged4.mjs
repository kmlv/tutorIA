import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
// texto hablado ES entre 150 y 200
const cap = await page.evaluate(`(()=>{
  const s = window.__tutoriaSesion;
  const cs = (s.media.cues||[]).filter(c=>c.t>=145 && c.t<=200);
  return cs.map(c=>({t:c.t, tipo:c.tipo||c.type, texto:(c.texto||c.text||c.caption||'')}));
})()`);
console.log(JSON.stringify(cap,null,1).slice(0,3000));
await browser.close();
