import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const dock = async () => await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(e => e.className+' :: '+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,110)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForSelector('.q', {timeout:25000});

console.log('restantes composer:', JSON.stringify(await page.evaluate(() => document.querySelector('.composer-restantes')?.textContent)));
console.log('opciones habilitadas:', await page.evaluate(() => Array.from(document.querySelectorAll('.q-opciones button')).map(b=>({txt:b.textContent.trim().slice(0,30), dis:b.disabled}))));

// pulsar 4 intenciones y luego comprobar que la MCQ sigue viva
for (const n of ['No entiendo','¿Por qué?','Otro ejemplo','Más despacio'])
  await page.evaluate(n => { const b=Array.from(document.querySelectorAll('.dock-acciones .intencion')).find(x=>x.textContent.trim()===n); b&&b.click(); }, n);
await page.waitForTimeout(3000);
console.log('\n-- tras 4 intenciones, MCQ sigue:', await page.evaluate(() => document.querySelectorAll('.q-opciones button').length));
console.log('-- clic en opcion correcta:');
await page.evaluate(() => { const b=Array.from(document.querySelectorAll('.q-opciones button')).find(x=>/paralela/.test(x.textContent)); b&&b.click(); });
await page.waitForTimeout(4000);
console.log((await dock()).join('\n'));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-int-5.png'});

// ahora "Listo, sigamos" durante la practica
console.log('\n########## "Listo, sigamos" durante la practica');
await page.evaluate(() => { const b=Array.from(document.querySelectorAll('.dock-acciones .intencion')).find(x=>/Listo/.test(x.textContent)); b&&b.click(); });
await page.waitForTimeout(3000);
console.log('dock estado:', await page.evaluate('__tutoria.dock.actual'), '| paused=', await page.evaluate('__tutoria.media.paused()'), '| t=', await page.evaluate('__tutoria.media.currentTime()'), '/', await page.evaluate('__tutoria.media.duration()'));
console.log('dock visible?', await page.evaluate(() => { const d=document.querySelector('.dock'); const r=d.getBoundingClientRect(); return {w:r.width,h:r.height,estado:d.dataset.estado}; }));
console.log('hay .q en pantalla?', await page.evaluate(() => document.querySelectorAll('.q').length));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-int-listo.png'});
await browser.close();
