import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));

async function traza(url, etiqueta){
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  const muestras=[];
  for (let i=0;i<10;i++){
    muestras.push(await page.evaluate(()=>window.__tutoria.media.currentTime().toFixed(1)+'/'+
      (document.querySelector('.reloj,.tiempo,.time')?.textContent.trim()||'?')));
    await page.waitForTimeout(1000);
  }
  console.log(etiqueta, url, '->', muestras.join('  '));
}
await traza('http://localhost:57330/?lang=es&t=100','carga directa');
await traza('http://localhost:57330/?lang=en&t=100','carga directa EN');
await browser.close();
