import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=84', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1000);

console.log('=== cues ===');
console.log(await page.evaluate(()=>JSON.stringify(
  (window.__tutoriaSesion.media.cues||[]).map(c=>[c.t,c.id,c.type]))));

console.log('=== elementos media en el DOM ===');
console.log(await page.evaluate(()=>[...document.querySelectorAll('audio,video')]
  .map(e=>({tag:e.tagName, controls:e.controls, src:(e.currentSrc||e.src||'').slice(-40), hidden:e.hidden, style:e.getAttribute('style')}))));

// abrir transcripción y clicar una fila lejana
const det = await page.$('details');
if (det) { await det.click(); await page.waitForTimeout(500); }
const filas = await page.$$('li.transcript-row');
console.log('filas transcripcion:', filas.length);
if (filas.length > 6) {
  const antes = await page.evaluate(()=>window.__tutoria.media.currentTime());
  await filas[6].click();
  await page.waitForTimeout(600);
  const desp = await page.evaluate(()=>window.__tutoria.media.currentTime());
  console.log('click fila[6]: ct antes', antes, '-> despues', desp);
}
// también doble clic en el lienzo y en el escenario
for (const sel of ['.lienzo','.escenario']) {
  const el = await page.$(sel); if(!el) continue;
  const b = await el.boundingBox(); if(!b) continue;
  await page.mouse.click(b.x+b.width*0.7, b.y+b.height*0.5);
  await page.waitForTimeout(300);
  console.log('click', sel, 'ct=', await page.evaluate(()=>window.__tutoria.media.currentTime()));
}
await browser.close();
