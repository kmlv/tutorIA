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
console.log('cargado. duracion=', await page.evaluate('window.__tutoria.media.duration()'));

// listar cues cercanos a 194
const cues = await page.evaluate(`(() => {
  const s = window.__tutoriaSesion;
  return (s.media.cues||[]).filter(c => c.t > 185 && c.t < 205).map(c => ({t:c.t, tipo:c.tipo||c.type, id:c.id}));
})()`);
console.log('cues 185-205:', JSON.stringify(cues, null, 1));

await page.evaluate('window.__tutoria.media.seek(193.5); window.__tutoria.media.play()');
await page.waitForTimeout(2500);
const t = await page.evaluate('window.__tutoria.media.currentTime()');
console.log('t ahora =', t);

const bands = await page.evaluate(`(() => {
  const el = document.querySelector('.bands');
  return el ? el.innerText : '(no .bands)';
})()`);
console.log('--- BANDS innerText ---');
console.log(bands);
console.log('--- fin ---');
console.log('contiene "(unchanged)":', bands.includes('unchanged'));
console.log('contiene "sin cambio":', bands.toLowerCase().includes('sin cambio'));

await page.screenshot({path:'verif-cp2.png'});
await browser.close();
