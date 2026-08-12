import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OP = Number(process.argv[2] || 4);   // 1-indexed
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForSelector('.q', {timeout:20000});
console.log('cp1 aparece a t =', await page.evaluate(()=>window.__tutoria.media.currentTime().toFixed(2)));
console.log('ENUNCIADO:', (await page.textContent('.q-enunciado'))?.trim());
const ops = await page.$$eval('.q-opciones button', bs => bs.map((b,i)=>`${i+1}) ${b.textContent.trim()}`));
console.log(ops.join('\n'));

const snap = async () => await page.evaluate(() => ({
  t: +window.__tutoria.media.currentTime().toFixed(1),
  paused: window.__tutoria.media.paused(),
  dock: window.__tutoria.dock?.actual,
  dockText: document.querySelector('.dock')?.innerText?.replace(/\n+/g,' | ').slice(0,600),
  qPresente: !!document.querySelector('.q'),
  botones: [...document.querySelectorAll('.q-opciones button')].map(b=>({
    txt: b.textContent.trim().slice(0,45), dis: b.disabled,
    cls: b.className, aria: b.getAttribute('aria-disabled')})),
  otrosClicables: [...document.querySelectorAll('.q button, .q [role=button], .q a')].length,
  composerDis: document.querySelector('.composer-input')?.disabled,
}));
console.log('--- ANTES DEL CLIC ---'); console.log(JSON.stringify(await snap(), null, 1));

await page.$$eval('.q-opciones button', (bs,i)=>bs[i-1].click(), OP);
console.log(`>>> CLIC en opcion ${OP}`);

for (const espera of [0.3, 1, 2, 3, 5, 8, 12, 18, 25]) {
  await page.waitForTimeout(espera*1000 - (espera===0.3?0:0));
  const s = await snap();
  console.log(`\n=== +${espera}s ===`);
  console.log(JSON.stringify(s, null, 1));
  if (espera >= 25) break;
}
await page.screenshot({path:`verif-op${OP}.png`, fullPage:false});
await browser.close();
