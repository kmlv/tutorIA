import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

async function nueva(lang){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  page.on('request', r => { if (r.url().includes('/events')) { const b=r.postData(); console.log('  EVENT ->', (b||'').slice(0,160)); } else if (r.url().includes('/api/')) console.log('  REQ', r.method(), r.url().split('/').slice(-1)[0]); });
  await page.goto(`http://localhost:57330/?lang=${lang}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return page;
}
const msgs = p => p.evaluate(() => Array.from(document.querySelectorAll('.msg')).map(m=>m.className+' :: '+(m.textContent||'').trim().slice(0,70)));

// A) FUERA del checkpoint: abrir el dock con #ask (pausa) en t=60
console.log('\n===== A) FUERA DEL CHECKPOINT (t=60, boton Preguntar/#ask) =====');
let p = await nueva('es');
await p.evaluate('window.__tutoria.media.seek(60); window.__tutoria.media.play()');
await p.waitForTimeout(2500);
await p.click('#ask');
await p.waitForTimeout(800);
console.log('  dock=', await p.evaluate('window.__tutoria.dock.actual'));
for (const c of ['No entiendo','¿Por qué?']) {
  await p.locator('.dock button.intencion', {hasText:c}).first().click();
  await p.waitForTimeout(7000);
}
console.log('  msgs:', JSON.stringify(await msgs(p)));
await p.screenshot({path:SP+'v04-fuera-cp.png'});
await p.context().close();

// B) INGLES
console.log('\n===== B) ?lang=en, checkpoint =====');
p = await nueva('en');
await p.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await p.waitForTimeout(4000);
console.log('  t=', await p.evaluate('window.__tutoria.media.currentTime()'), 'dock=', await p.evaluate('window.__tutoria.dock.actual'));
for (const c of ["I don't get it",'Why?']) {
  const b = p.locator('.dock button.intencion', {hasText:c}).first();
  if (await b.count()) { await b.click(); await p.waitForTimeout(7000); } else console.log('  no chip', c);
}
console.log('  msgs:', JSON.stringify(await msgs(p)));
await p.screenshot({path:SP+'v04-en.png'});
await p.context().close();

// C) tras los chips, se puede seguir contestando el checkpoint?
console.log('\n===== C) tras 4 chips, contestar la opcion correcta =====');
p = await nueva('es');
await p.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await p.waitForTimeout(4000);
for (const c of ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?']) { await p.locator('.dock button.intencion',{hasText:c}).first().click(); await p.waitForTimeout(1200); }
console.log('  --- ahora pulso la opcion 1 ---');
await p.locator('.q-opciones button').first().click();
await p.waitForTimeout(6000);
console.log('  msgs:', JSON.stringify(await msgs(p), null, 1));
console.log('  paused=', await p.evaluate('window.__tutoria.media.paused()'), 't=', await p.evaluate('window.__tutoria.media.currentTime()'));
await p.screenshot({path:SP+'v04-tras-responder.png'});
await p.context().close();
await browser.close();
