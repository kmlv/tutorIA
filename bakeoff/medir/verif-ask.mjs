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
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = async (label) => {
  const s = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const esc = document.querySelector('.escenario');
    const r = dock ? dock.getBoundingClientRect() : null;
    const re = esc ? esc.getBoundingClientRect() : null;
    return {
      dockActual: window.__tutoria.dock ? window.__tutoria.dock.actual : null,
      paused: window.__tutoria.media.paused(),
      t: +window.__tutoria.media.currentTime().toFixed(2),
      dockPresent: !!dock,
      dockRect: r ? {x:Math.round(r.x), w:Math.round(r.width), h:Math.round(r.height)} : null,
      dockVisible: r ? (r.width>0 && r.height>0) : false,
      escRect: re ? {x:Math.round(re.x), w:Math.round(re.width)} : null,
      dockClass: dock ? dock.className : null,
      dockHeaderText: dock ? (dock.querySelector('header')||dock.firstElementChild||{}).textContent : null,
    };
  });
  console.log(label, JSON.stringify(s));
  return s;
};

// buscar botones visibles
const listBtns = async (label) => {
  const b = await page.evaluate(() => [...document.querySelectorAll('button')]
    .filter(x=>x.offsetParent!==null)
    .map(x=>({t:(x.textContent||'').trim().slice(0,40), id:x.id, cls:x.className.slice(0,40)})));
  console.log(label, JSON.stringify(b));
};

console.log('--- carga limpia ---');
await snap('estado inicial:');
await listBtns('botones inicial:');

// 1) pulsar Empezar
const empezar = page.locator('button', {hasText:/Empezar/i}).first();
if (await empezar.count()) { await empezar.click(); console.log('click Empezar OK'); }
else { console.log('NO hay boton Empezar; probando #play'); await page.click('#play'); }
await page.waitForTimeout(1500);
await snap('tras Empezar +1.5s:');
await listBtns('botones tras empezar:');

await browser.close();
