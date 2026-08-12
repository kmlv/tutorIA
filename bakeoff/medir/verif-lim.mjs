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
console.log('cargado');
// abrir el dock preguntando
const ask = await page.$('#ask');
console.log('#ask existe:', !!ask, ask ? await ask.innerText() : '');
await page.click('#ask');
await page.waitForTimeout(1200);
const dump = await page.evaluate(() => {
  const dock = document.querySelector('.dock');
  const inp = document.querySelector('.composer-input');
  const btn = document.querySelector('.composer-enviar');
  const composer = document.querySelector('.composer') || (inp && inp.closest('div'));
  return {
    dockHTMLlen: dock ? dock.outerHTML.length : -1,
    dockText: dock ? dock.innerText.slice(0,900) : null,
    inpTag: inp ? inp.tagName : null,
    inpPlaceholder: inp ? inp.getAttribute('placeholder') : null,
    inpDisabled: inp ? inp.disabled : null,
    btnText: btn ? btn.innerText : null,
    btnDisabled: btn ? btn.disabled : null,
    composerHTML: composer ? composer.outerHTML.slice(0,1500) : null,
    dockEstado: window.__tutoria?.dock?.actual ?? null,
  };
});
console.log(JSON.stringify(dump, null, 2));
await page.screenshot({path:'verif-lim-0.png'});
await browser.close();
