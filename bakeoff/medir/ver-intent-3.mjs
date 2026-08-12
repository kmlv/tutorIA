import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const T0 = Date.now(); const ms = () => ((Date.now()-T0)/1000).toFixed(1);
page.on('request', r => { const u=r.url(); if (u.includes('/api/')||u.includes('/chat')) console.log(`  [${ms()}s] -> ${r.method()} ${u.replace('http://localhost:57330','')} ${(r.postData()||'').slice(0,180)}`); });
page.on('response', r => { const u=r.url(); if (u.includes('/api/')||u.includes('/chat')) console.log(`  [${ms()}s] <- ${r.status()} ${u.replace('http://localhost:57330','')}`); });
const dock = async () => await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(e => e.className+' :: '+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,150)));

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// --- A) DURANTE LA NARRACION, t=60, dock abierto
console.log('\n########## A) NARRACION t=60');
await page.evaluate('__tutoria.media.seek(60); __tutoria.media.play();');
await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelector('#ask')?.click());
await page.waitForTimeout(1500);
console.log('estado dock:', await page.evaluate('__tutoria.dock.actual'));
console.log('botones:', await page.evaluate(() => Array.from(document.querySelectorAll('.dock-acciones .intencion')).map(b=>b.textContent.trim())));
await page.evaluate(() => { const b=Array.from(document.querySelectorAll('.dock-acciones .intencion')).find(x=>x.textContent.trim()==='No entiendo'); b&&b.click(); });
await page.waitForTimeout(12000);
console.log('--- dock tras 12s:'); console.log((await dock()).join('\n'));

// --- B) COMPOSER con el mismo texto
console.log('\n########## B) COMPOSER "No entiendo"');
await page.fill('.composer-input', 'No entiendo');
await page.click('.composer-enviar');
const tA = Date.now();
try { await page.waitForFunction(() => Array.from(document.querySelectorAll('.dock-body .msg.tutor')).length >= 2, null, {timeout:20000});
  console.log(`  respuesta tutor en ${((Date.now()-tA)/1000).toFixed(1)}s`); } catch(e){ console.log('  SIN respuesta en 20s'); }
console.log('--- dock:'); console.log((await dock()).join('\n'));
await browser.close();
