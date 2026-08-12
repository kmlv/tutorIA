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
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// Inventario de cues de checkpoint
const cues = await page.evaluate(() => (window.__tutoriaSesion?.media?.cues||[]).map(c=>({t:c.t, tipo:c.tipo||c.type, id:c.id, ref:c.ref||c.pregunta||c.q})));
console.log('CUES:', JSON.stringify(cues.filter(c=>/check|preg|quest|cp/i.test(JSON.stringify(c))), null, 1));

await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForTimeout(3500);
const st = await page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  dock: window.__tutoria.dock?.actual,
  q: !!document.querySelector('.q'),
  enun: document.querySelector('.q-enunciado')?.textContent?.trim().slice(0,120),
  ops: [...document.querySelectorAll('.q-opciones button')].map(b=>({txt:b.textContent.trim().slice(0,60), dis:b.disabled})),
  cap: document.querySelector('.captions-band')?.textContent?.trim().slice(0,200),
}));
console.log('EN CP1:', JSON.stringify(st, null, 1));

// Buscar botones visibles del reproductor / cualquier "Seguir"
const btns = await page.evaluate(() => [...document.querySelectorAll('button, [role=button], a')].map(b=>({
  tag:b.tagName, id:b.id, cls:b.className?.toString().slice(0,60), txt:(b.textContent||'').trim().slice(0,40),
  vis: !!(b.offsetParent||b.getClientRects().length), dis: b.disabled===true,
})).filter(b=>b.vis));
console.log('BOTONES VISIBLES:'); btns.forEach(b=>console.log('  ', JSON.stringify(b)));
await page.screenshot({path:'v-cp1.png'});
await browser.close();
