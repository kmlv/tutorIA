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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const read = () => page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  estado: window.__tutoria.estado(),
  bands: document.querySelector('.bands')?.innerText.replace(/\s*\n+\s*/g,' | ') || null,
  q: document.querySelector('.q-enunciado')?.innerText.replace(/\n/g,' ') || null,
  ops: [...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\n/g,' ')),
  manip: !!document.querySelector('.q-manip'),
  caps: document.querySelector('.captions-band')?.innerText.replace(/\s*\n+\s*/g,' ') || null,
}));
await page.click('#play');
let last = '';
const t0 = Date.now();
while (Date.now()-t0 < 420000) {
  const s = await read();
  const key = `${s.paused}|${s.q}|${s.ops.join('/')}|${JSON.stringify(s.estado.p1)+JSON.stringify(s.estado.m)}`;
  if (key !== last) {
    console.log(`\n@t=${s.t.toFixed(2)} paused=${s.paused} p1=${s.estado.p1} p2=${s.estado.p2} m=${s.estado.m} fantasma=${JSON.stringify(s.estado.fantasma)}`);
    if (s.q) console.log('   Q:', s.q, '| ops:', JSON.stringify(s.ops), '| manip:', s.manip);
    last = key;
  }
  if (s.t > 175) break;
  if (s.paused && (s.ops.length || s.manip)) {
    console.log('   >> BLOQUEO en t=', s.t.toFixed(2), 'q=', s.q, 'ops=', JSON.stringify(s.ops), 'manip=', s.manip);
    console.log('   BANDS:', s.bands);
    console.log('   CAPS:', (s.caps||'').slice(0,200));
    break;
  }
  await page.waitForTimeout(1000);
}
const fin = await read();
console.log('\nFIN t=', fin.t.toFixed(2), 'paused=', fin.paused, 'q=', fin.q, 'ops=', JSON.stringify(fin.ops));
await page.screenshot({path:'verif2.png', fullPage:false});
await browser.close();
