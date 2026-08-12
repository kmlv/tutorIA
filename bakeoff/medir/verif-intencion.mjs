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
const reqs = [];
page.on('request', r => { if (r.url().includes('/api/')) reqs.push([Date.now(), r.method(), r.url().replace('http://localhost:57330','')]); });
page.on('response', async r => { if (r.url().includes('/chat')) console.log('  CHAT RESP', r.status()); });

const lang = process.argv[2] || 'es';
await page.goto(`http://localhost:57330/?lang=${lang}`, {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('CARGA LIMPIA OK, dock =', await page.evaluate('window.__tutoria.dock.actual'));

// pulsar "Preguntar"
await page.click('#ask');
await page.waitForTimeout(500);
console.log('tras #ask: dock =', await page.evaluate('window.__tutoria.dock.actual'),
            ' paused =', await page.evaluate('window.__tutoria.media.paused()'));
const botones = await page.$$eval('.dock-acciones button', bs => bs.map(b=>b.textContent));
console.log('botones de intencion:', JSON.stringify(botones));

const orden = lang==='es' ? ['No entiendo','¿Por qué?','Otro ejemplo','Más despacio']
                          : ["I don't get it",'Why?','Another example','Slower'];
for (const etiqueta of orden) {
  const antes = reqs.length;
  const before = await page.$$eval('.dock-body .msg', ms => ms.length);
  await page.click(`.dock-acciones button:text-is(${JSON.stringify(etiqueta)})`);
  await page.waitForTimeout(6000);
  const msgs = await page.$$eval('.dock-body .msg', ms => ms.map(m=>`${m.className}|${m.textContent}`));
  const nuevos = reqs.slice(antes);
  console.log(`\n--- "${etiqueta}" ---`);
  console.log('  peticiones API en 6s:', JSON.stringify(nuevos.map(r=>r[1]+' '+r[2])));
  console.log('  mensajes (+%d):', msgs.length-before, JSON.stringify(msgs.slice(-4)));
  console.log('  dock =', await page.evaluate('window.__tutoria.dock.actual'),
              ' paused =', await page.evaluate('window.__tutoria.media.paused()'),
              ' t =', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(1));
}
// contraste: texto libre por el composer
console.log('\n=== CONTRASTE: texto libre ===');
const antes2 = reqs.length;
const b2 = await page.$$eval('.dock-body .msg', ms => ms.length);
await page.fill('.composer-input', lang==='es' ? 'no entiendo' : "i don't get it");
await page.click('.composer-enviar');
await page.waitForTimeout(8000);
const msgs2 = await page.$$eval('.dock-body .msg', ms => ms.map(m=>`${m.className}|${(m.textContent||'').slice(0,120)}`));
console.log('  peticiones API:', JSON.stringify(reqs.slice(antes2).map(r=>r[1]+' '+r[2])));
console.log('  mensajes (+%d):', msgs2.length-b2, JSON.stringify(msgs2.slice(-3)));

// ahora "listo"
console.log('\n=== "listo" ===');
const antes3 = reqs.length;
await page.click(`.dock-acciones button:text-is(${JSON.stringify(lang==='es'?'Listo, sigamos':'Ready, go on')})`);
await page.waitForTimeout(2500);
console.log('  peticiones API:', JSON.stringify(reqs.slice(antes3).map(r=>r[1]+' '+r[2])));
console.log('  dock =', await page.evaluate('window.__tutoria.dock.actual'),
            ' paused =', await page.evaluate('window.__tutoria.media.paused()'));
await page.screenshot({path:`/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/intencion-${lang}.png`});
await browser.close();
