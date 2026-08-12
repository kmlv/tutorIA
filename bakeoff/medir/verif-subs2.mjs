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
const info = await page.evaluate(() => {
  const s = window.__tutoriaSesion; const m = s.media;
  const preds = m.cues.filter(c=>c.type!=='graph');
  const tr = m.transcript;
  return {
    tipos: [...new Set(m.cues.map(c=>c.type))],
    noGraph: preds.map(c=>({t:c.t,type:c.type,id:c.id})),
    transcriptType: Array.isArray(tr) ? 'array' : typeof tr,
    trSample: Array.isArray(tr) ? tr.slice(0,3) : String(tr).slice(0,500),
    trLen: Array.isArray(tr) ? tr.length : null,
  };
});
console.log(JSON.stringify(info,null,2).slice(0,6000));
await browser.close();
