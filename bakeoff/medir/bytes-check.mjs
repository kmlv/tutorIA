import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const v of ['A','B']) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const urls = new Map(); let recibido = 0, finalizado = 0, nReq = 0, nFin = 0;
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent', e => { if (/\.(mp3|mp4)/.test(e.request.url)) { urls.set(e.requestId, 1); nReq++; } });
  cdp.on('Network.dataReceived', e => { if (urls.has(e.requestId)) recibido += (e.encodedDataLength||0); });
  cdp.on('Network.loadingFinished', e => { if (urls.has(e.requestId)) { finalizado += (e.encodedDataLength||0); nFin++; } });
  await page.goto(`http://localhost:61911/?lang=es&variant=${v}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate('window.__tutoria.media.play()');
  await page.waitForTimeout(45000);
  console.log(`${v}: dataReceived=${(recibido/1e6).toFixed(2)} MB  loadingFinished=${(finalizado/1e6).toFixed(2)} MB  peticiones=${nReq} finalizadas=${nFin}`);
  await ctx.close();
}
await browser.close();
