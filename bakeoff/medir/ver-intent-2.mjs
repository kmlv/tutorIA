import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const T0 = Date.now(); const ms = () => ((Date.now()-T0)/1000).toFixed(1);
page.on('request', r => { const u=r.url(); if (u.includes('/api/')||u.includes('/chat')) console.log(`  [${ms()}s] -> ${r.method()} ${u.replace('http://localhost:57330','')} ${(r.postData()||'').slice(0,160)}`); });
page.on('response', r => { const u=r.url(); if (u.includes('/api/')||u.includes('/chat')) console.log(`  [${ms()}s] <- ${r.status()} ${u.replace('http://localhost:57330','')}`); });

const dock = async () => await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(e => e.className+' :: '+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,120)));

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForSelector('.q', {timeout:25000});
console.log('\n=== practica abierta, dock:'); console.log((await dock()).join('\n'));

for (const nombre of ['No entiendo','¿Por qué?','Otro ejemplo','Más despacio']) {
  console.log(`\n=== CLIC "${nombre}" en [${ms()}s]`);
  await page.evaluate((n) => {
    const b = Array.from(document.querySelectorAll('.dock-acciones .intencion')).find(x=>x.textContent.trim()===n);
    if (!b) { console.log('NO BOTON '+n); return; } b.click();
  }, nombre);
  await page.waitForTimeout(15000);
  console.log(`--- dock tras 15s (t=${ms()}s):`); console.log((await dock()).join('\n'));
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-int-2.png', fullPage:false});
console.log('\n=== estado dock:', await page.evaluate('__tutoria.dock.actual'));
await browser.close();
