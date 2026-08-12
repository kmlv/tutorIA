import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const t0 = Date.now();
page.on('request', r => { if (r.url().includes('/api/')) console.log(`  [${((Date.now()-t0)/1000).toFixed(1)}s] REQ ${r.method()} ${r.url().replace('http://localhost:57330','')}`); });
page.on('response', async r => { if (r.url().includes('/api/')) console.log(`  [${((Date.now()-t0)/1000).toFixed(1)}s] RES ${r.status()} ${r.url().replace('http://localhost:57330','')}`); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const burbujas = () => page.evaluate(() => Array.from(document.querySelectorAll('.msg')).map(m=>({cls:m.className, txt:(m.textContent||'').trim().slice(0,90)})));

await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForTimeout(4000);
console.log('t=', await page.evaluate('window.__tutoria.media.currentTime()'));
console.log('msgs iniciales:', JSON.stringify(await burbujas(), null, 1));

const chips = ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?'];
for (const c of chips) {
  console.log(`\n--- CLIC "${c}" [${((Date.now()-t0)/1000).toFixed(1)}s] ---`);
  const b = page.locator('.dock button.intencion', {hasText: c}).first();
  const n = await b.count();
  if (!n) { console.log('  NO ENCONTRADO'); continue; }
  await b.click();
  await page.waitForTimeout(6000);
  console.log('  msgs:', JSON.stringify(await burbujas(), null, 1));
}
await page.screenshot({path:SP+'v02-tras-chips.png', fullPage:false});

// paso 4: escribir en el composer
console.log(`\n--- COMPOSER "no entiendo" [${((Date.now()-t0)/1000).toFixed(1)}s] ---`);
await page.fill('.composer-input', 'no entiendo');
await page.click('.composer-enviar');
await page.waitForTimeout(12000);
console.log('  msgs:', JSON.stringify(await burbujas(), null, 1));
await page.screenshot({path:SP+'v02-tras-composer.png'});
await browser.close();
