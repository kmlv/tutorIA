import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const tr = await page.evaluate(() => window.__tutoriaSesion.media.transcript);
console.log('transcript tipo:', Array.isArray(tr)?'array '+tr.length:typeof tr, Object.keys(tr||{}).slice(0,10));
const segs = Array.isArray(tr)? tr : (tr.segments||tr.segmentos||[]);
console.log('segmentos:', segs.length);
for (const s of segs) {
  const st = s.start_s ?? s.start ?? s.t;
  if ([87.045,123.864,176.128].some(p=>Math.abs(st-p)<0.6)) {
    console.log('>>> SEG que empieza en', st, 'fin', s.end_s??s.end, ':', (s.text||s.texto||'').slice(0,300));
  }
}
console.log('--- ventana 80-100 ---');
for (const s of segs) { const st=s.start_s??s.start??s.t; if (st>=80&&st<=100) console.log(st, '->', (s.end_s??s.end), '|', (s.text||s.texto||'').slice(0,200)); }
console.log('--- ventana 118-132 ---');
for (const s of segs) { const st=s.start_s??s.start??s.t; if (st>=118&&st<=132) console.log(st, '->', (s.end_s??s.end), '|', (s.text||s.texto||'').slice(0,200)); }
console.log('--- ventana 172-186 ---');
for (const s of segs) { const st=s.start_s??s.start??s.t; if (st>=172&&st<=186) console.log(st, '->', (s.end_s??s.end), '|', (s.text||s.texto||'').slice(0,200)); }
await browser.close();
