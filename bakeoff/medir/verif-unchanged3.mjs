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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const dur = await page.evaluate('window.__tutoria.media.duration()');

// barrido de 2 en 2 segundos desde 150 hasta el final: cuando aparece y si desaparece
let primera = null, ultima = null, huecos = [];
for (let t = 150; t <= dur; t += 2) {
  await page.evaluate(`window.__tutoria.media.seek(${t})`);
  await page.waitForTimeout(90);
  const txt = await page.evaluate(`(()=>{const e=document.querySelector('.bands');return e?e.innerText.replace(/\\s+/g,' ').trim():''})()`);
  const hay = /unchanged/.test(txt);
  if (hay && primera === null) primera = t;
  if (hay) ultima = t;
  if (!hay && primera !== null) huecos.push(t);
}
console.log('duracion =', dur);
console.log('primer t con "(unchanged)" =', primera);
console.log('ultimo t con "(unchanged)" =', ultima);
console.log('segundos sin la cadena tras aparecer:', huecos.length ? huecos.join(', ') : '(ninguno: persiste hasta el final)');

// captions en el cue income_shift, en ES
await page.evaluate('window.__tutoria.media.seek(156.2)');
await page.waitForTimeout(400);
const cap = await page.evaluate(`(()=>{const e=document.querySelector('.captions-band');return e?e.innerText.replace(/\\s+/g,' ').trim():'(sin captions-band)'})()`);
console.log('\ncaption ES en income_shift (t=156.2):');
console.log('  ', cap);
const banda = await page.evaluate(`(()=>{const e=document.querySelector('.bands');return e?e.innerText.replace(/\\s+/g,' ').trim():''})()`);
console.log('banda ES a la vez:');
console.log('  ', banda);
await page.screenshot({path:'verif-income-shift-es.png'});

await page.evaluate('window.__tutoria.media.seek(194.56)');
await page.waitForTimeout(400);
await page.screenshot({path:'verif-cp2-es.png'});
await browser.close();
