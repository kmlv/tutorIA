import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
export async function abrir(opts={}){
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
  const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
  await page.addInitScript(()=>{
    window.__log = [];
    const of = window.fetch;
    window.fetch = async (...a) => {
      const url = typeof a[0]==='string'?a[0]:a[0].url;
      const req = a[1] && a[1].body ? String(a[1].body) : null;
      const r = await of(...a);
      if (/\/(next|answer|events)/.test(url)) {
        const c = r.clone();
        c.text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''), req, resp:t})).catch(()=>{});
      }
      return r;
    };
  });
  await page.goto('http://localhost:57330/?lang='+(opts.lang||'es'), {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {browser, page};
}
export const log = (page)=>page.evaluate('window.__log');
export async function qInfo(page){
  return await page.evaluate(() => {
    const q = document.querySelector('.dock .pregunta:last-child .q');
    return q ? {cls:q.className, enun:(q.querySelector('.q-enunciado')||{}).textContent,
      nota:(q.querySelector('.q-nota')||{}).textContent,
      btns:[...q.querySelectorAll('button')].map(b=>b.textContent+(b.disabled?' [DIS]':''))} : null;
  });
}
export const msgs = (page)=>page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.className.replace('msg ','')+': '+m.textContent));
