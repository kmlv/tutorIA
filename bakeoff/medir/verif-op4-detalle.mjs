import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

for (const lang of ['es','en']) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  page.on('response', async res => {
    if (res.url().includes('/answer')) {
      try { console.log(`  [${lang}] POST /answer ->`, res.status(), JSON.stringify(await res.json())); }
      catch(e){}
    }
  });
  await page.goto(`http://localhost:57330/?lang=${lang}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
  await page.waitForSelector('.q', {timeout:20000});
  const ops = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent.trim()));
  console.log(`\n##### ${lang.toUpperCase()} ##### opcion4 = "${ops[3]}"`);
  await page.$$eval('.q-opciones button', bs=>bs[3].click());
  await page.waitForTimeout(6000);
  console.log(`  [${lang}] dock:`, (await page.evaluate(()=>document.querySelector('.dock').innerText)).replace(/\n+/g,' | '));

  // ¿Queda alguna salida? probar el chip "Listo, sigamos" / "Ready, continue"
  const chips = await page.$$eval('.dock button', bs=>bs.filter(b=>!b.disabled).map(b=>b.textContent.trim()));
  console.log(`  [${lang}] botones habilitados:`, JSON.stringify(chips));
  const idx = chips.findIndex(t=>/sigamos|continue|got it|listo|ready/i.test(t));
  if (idx >= 0) {
    await page.$$eval('.dock button', (bs,t)=>{
      const b = bs.filter(x=>!x.disabled).find(x=>x.textContent.trim()===t); b.click();
    }, chips[idx]);
    await page.waitForTimeout(4000);
    console.log(`  [${lang}] tras "${chips[idx]}": t=`, await page.evaluate(()=>window.__tutoria.media.currentTime().toFixed(1)),
      'paused=', await page.evaluate(()=>window.__tutoria.media.paused()),
      '| .q sigue?', await page.evaluate(()=>!!document.querySelector('.q')));
  }
  await ctx.close();
}
await browser.close();
