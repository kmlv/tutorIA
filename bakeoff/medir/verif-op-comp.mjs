import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
for (const OP of [1,2,3,4]) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
  await page.waitForSelector('.q', {timeout:20000});
  const antes = await page.evaluate(()=>document.querySelector('.dock').innerText);
  await page.$$eval('.q-opciones button', (bs,i)=>bs[i-1].click(), OP);
  await page.waitForTimeout(12000);
  const desp = await page.evaluate(()=>document.querySelector('.dock').innerText);
  // lo nuevo que aparecio en el dock
  const nuevo = desp.split('\n').filter(l=>!antes.split('\n').includes(l) && l.trim());
  console.log(`\n########## OPCION ${OP} ##########`);
  console.log('NUEVO EN EL DOCK:', JSON.stringify(nuevo));
  console.log('media t=', await page.evaluate(()=>window.__tutoria.media.currentTime().toFixed(1)),
              'paused=', await page.evaluate(()=>window.__tutoria.media.paused()));
  await page.screenshot({path:`verif-comp-op${OP}.png`});
  await ctx.close();
}
await browser.close();
