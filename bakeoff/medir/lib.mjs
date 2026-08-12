import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
export async function abrir(url, opts={}){
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
  const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => { errs.push(String(e).slice(0,300)); console.log('  JS ERROR:', String(e).slice(0,300)); });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {browser, page, errs};
}
export const snapFn = () => {
  const q = document.querySelector('.q');
  const dock = document.querySelector('.dock');
  return {
    t: +window.__tutoria.media.currentTime().toFixed(2),
    paused: window.__tutoria.media.paused(),
    estado: window.__tutoria.estado(),
    dockEstado: window.__tutoria.dock?.actual ?? null,
    q: q ? {
      text: q.innerText.replace(/\n+/g,' | '),
      opciones: [...q.querySelectorAll('.q-opciones button')].map(b=>({t:b.innerText.trim(), cls:b.className, dis:b.disabled})),
      manip: !!q.querySelector('.q-manip'),
      html: q.outerHTML.length
    } : null,
    dockText: dock ? dock.innerText.replace(/\n+/g,' | ').slice(0,400) : null,
    captions: (document.querySelector('.captions-band')?.innerText||'').replace(/\n+/g,' | ').slice(0,200)
  };
};
