import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const cues = await page.evaluate(()=> window.__tutoriaSesion.media.cues
  .filter(c=>/mostrar|ejes|linea|conjunto|intercep|pendiente/i.test(JSON.stringify(c)))
  .map(c=>({t:c.t ?? c.tiempo ?? c.time, tipo:c.tipo ?? c.type, d:JSON.stringify(c).slice(0,150)})));
console.log('CUES de gráfico:'); cues.slice(0,25).forEach(c=>console.log(' ', JSON.stringify(c)));
await browser.close();
