import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
export async function open(url='http://localhost:57330/?lang=es') {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
    .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
  const exe = path.join(base, d, 'chrome-mac-arm64',
    'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => { errs.push(String(e).slice(0,300)); console.log('  JS ERROR:', String(e).slice(0,300)); });
  page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,200)); });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {browser, ctx, page, errs};
}
export async function snap(page, label='') {
  return await page.evaluate((label) => {
    const t = window.__tutoria.media.currentTime();
    const paused = window.__tutoria.media.paused();
    const q = document.querySelector('.q');
    const qinfo = q ? {
      visible: !!(q.offsetParent !== null || q.getClientRects().length),
      enunciado: (q.querySelector('.q-enunciado')||{}).textContent?.trim(),
      opciones: [...q.querySelectorAll('.q-opciones button')].map(b => ({
        txt: b.textContent.trim(), cls: b.className, disabled: b.disabled,
        aria: b.getAttribute('aria-disabled')
      })),
      manip: !!q.querySelector('.q-manip'),
      html: q.innerHTML.replace(/\s+/g,' ').slice(0, 2500),
    } : null;
    const dock = document.querySelector('.dock');
    return {
      label, t: +t.toFixed(2), paused,
      dockState: window.__tutoria.dock ? window.__tutoria.dock.actual : null,
      dockText: dock ? dock.textContent.replace(/\s+/g,' ').trim().slice(0,600) : null,
      captions: (document.querySelector('.captions-band')||{}).textContent?.replace(/\s+/g,' ').trim().slice(0,200),
      q: qinfo,
    };
  }, label);
}
