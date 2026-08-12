import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
export const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
export async function abrir(url, {errores=[]}={}) {
  const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => { errores.push('JSERR '+String(e).slice(0,200)); console.log('  JS ERROR:', String(e).slice(0,200)); });
  page.on('console', m => { if(m.type()==='error'){ errores.push('CONS '+m.text().slice(0,200)); console.log('  CONSOLE ERROR:', m.text().slice(0,200)); } });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {browser, ctx, page};
}
export const SNAP = () => {
  const T = (s) => { const e = document.querySelector(s); return e ? e.textContent.trim().replace(/\s+/g,' ') : null; };
  const ledger = document.querySelector('.ledger');
  const cards = [...document.querySelectorAll('.ledger .card')].map(c => ({
    good: c.dataset.good, nombre: T2(c,'.card-name'), precio: T2(c,'.price'), sym: T2(c,'.sym'),
    stationsOn: [...c.querySelectorAll('.station.on')].map(s=>s.dataset.station),
  }));
  function T2(root, s){ const e = root.querySelector(s); return e ? e.textContent.trim().replace(/\s+/g,' ') : null; }
  const eqEl = document.querySelector('.eq-slot');
  const eq = eqEl ? (eqEl.querySelector('annotation')?.textContent || eqEl.textContent.trim().replace(/\s+/g,' ').slice(0,120)) : null;
  const q = document.querySelector('.q');
  return {
    t: +window.__tutoria.media.currentTime().toFixed(2),
    dur: +window.__tutoria.media.duration().toFixed(2),
    paused: window.__tutoria.media.paused(),
    reloj: T('#reloj'), play: T('#play'), desfase: T('#desfase'),
    caption: T('.caption-current'),
    estado: window.__tutoria.estado(),
    ledgerCompact: ledger ? ledger.classList.contains('compact') : null,
    cards, eq,
    dockEstado: document.querySelector('.dock')?.dataset.estado,
    dockActual: window.__tutoria.dock?.actual,
    dockBody: T('.dock-body'),
    q: q ? {enunciado: T2(q,'.q-enunciado'), opciones: [...q.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()), manip: !!q.querySelector('.q-manip'), html: q.className} : null,
    url: location.href,
  };
};
