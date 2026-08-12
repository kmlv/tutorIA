import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#ask'); await page.waitForTimeout(500);

for (let i=0;i<3;i++){
  await page.click('.composer-input');
  await page.keyboard.type('pregunta numero '+(i+1), {delay:5});
  const t0=Date.now();
  await page.keyboard.press('Enter');
  await page.waitForFunction('document.querySelector(".composer-input").disabled', null, {timeout:5000});
  await page.waitForFunction('!document.querySelector(".composer-input").disabled', null, {timeout:60000});
  console.log('envio', i+1, 'ventana ocupado ms:', Date.now()-t0,
    '| foco tras terminar:', await page.evaluate('document.activeElement.className'));
}

// via boton "Preguntar" en vez de Enter: ¿se puede pinchar la caja durante el busy?
await page.click('.composer-input');
await page.keyboard.type('con boton', {delay:5});
await page.click('.composer-enviar');
await page.waitForTimeout(200);
let clickOk = true;
try { await page.click('.composer-input', {timeout:800}); } catch(e){ clickOk=false; }
console.log('durante busy, click en caja aceptado:', clickOk,
  '| activeElement:', await page.evaluate('document.activeElement.className||document.activeElement.tagName'));
await page.waitForFunction('!document.querySelector(".composer-input").disabled', null, {timeout:60000});

// camino de error: cortar la API y ver si la caja se queda bloqueada
await page.route('**/api/session/**/chat', r => r.abort());
await page.click('.composer-input');
await page.keyboard.type('esta va a fallar', {delay:5});
await page.keyboard.press('Enter');
await page.waitForTimeout(1500);
console.log('tras error de red -> disabled:', await page.$eval('.composer-input', e=>e.disabled),
  '| boton:', await page.$eval('.composer-enviar', e=>e.textContent),
  '| dock:', (await page.$eval('.dock', e=>e.innerText)).split('\n').filter(Boolean).slice(-6).join(' / '));
await browser.close();
