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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

console.log('=== CASO A ===');
console.log('URL inicial:', page.url());

// buscar el boton "Empezar"
const play = await page.$('#play');
console.log('texto #play:', play ? (await play.innerText()).trim() : 'NO EXISTE');
await play.click();
await page.waitForTimeout(500);
console.log('tras Empezar: t=', await page.evaluate('window.__tutoria.media.currentTime()'),
            ' paused=', await page.evaluate('window.__tutoria.media.paused()'));

// esperar a llegar a 0:19
await page.waitForFunction('window.__tutoria.media.currentTime() >= 19', null, {timeout:60000});
const tAntes = await page.evaluate('window.__tutoria.media.currentTime()');
console.log('t antes de pulsar English:', tAntes.toFixed(2));

// leer reloj visible
const relojAntes = await page.evaluate(`(()=>{
  const el = document.querySelector('.reloj, .clock, .tiempo, .time');
  return el ? el.innerText.trim() : null;
})()`);
console.log('reloj visible antes:', relojAntes);

// buscar el enlace English
const info = await page.evaluate(`(()=>{
  const as = [...document.querySelectorAll('a')];
  return as.map(a=>({txt:a.innerText.trim(), href:a.getAttribute('href'), full:a.href}));
})()`);
console.log('enlaces en pagina:', JSON.stringify(info, null, 1));

await browser.close();
