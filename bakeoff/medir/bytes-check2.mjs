import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe});
const ctx = await browser.newContext(); const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page); const ids = new Set(); let bytes = 0;
await cdp.send('Network.enable');
cdp.on('Network.requestWillBeSent', e => { if (/\.mp4/.test(e.request.url)) ids.add(e.requestId); });
cdp.on('Network.dataReceived', e => { if (ids.has(e.requestId)) bytes += (e.encodedDataLength||0); });
// Descarga controlada: fetch() completo, sin elemento <video> de por medio.
await page.goto('http://localhost:61911/', {waitUntil:'domcontentloaded'});
const n = await page.evaluate(async () => {
  const r = await fetch('/media/budget-line/lesson-es.mp4');
  const b = await r.arrayBuffer();
  return b.byteLength;
});
await page.waitForTimeout(1500);
console.log(`fetch() dice ${(n/1e6).toFixed(2)} MB · CDP dataReceived dice ${(bytes/1e6).toFixed(2)} MB · en disco 11.06 MB`);
await browser.close();
