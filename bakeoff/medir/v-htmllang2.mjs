import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
// avanzar a un punto con narracion visible
await page.evaluate('window.__tutoria.media.seek(40)');
await page.evaluate('window.__tutoria.media.play()');
await page.waitForTimeout(2500);
await page.evaluate('window.__tutoria.media.pause()');
const r = await page.evaluate(() => {
  const live = [...document.querySelectorAll('[aria-live],[role="status"],[role="alert"],[role="log"]')].map(e=>({
    sel: e.className || e.id || e.tagName, live: e.getAttribute('aria-live'), role: e.getAttribute('role'),
    ownLang: e.getAttribute('lang'), txt: (e.textContent||'').replace(/\s+/g,' ').trim().slice(0,90)
  }));
  const cap = document.querySelector('.captions-band');
  return {
    htmlLang: document.documentElement.lang,
    inheritedLangOfCaptions: (function(){ let n=cap; while(n && n.nodeType===1){ if(n.getAttribute('lang')) return n.getAttribute('lang'); n=n.parentElement;} return null; })(),
    captionText: cap ? cap.innerText.replace(/\s+/g,' ').trim().slice(0,140) : null,
    live,
    totalElemsWithLang: document.querySelectorAll('[lang]').length,
    langLinkOwnLang: (document.querySelector('a.idioma')||{}).getAttribute ? document.querySelector('a.idioma').getAttribute('lang') : 'n/a',
    langLinkText: document.querySelector('a.idioma') ? document.querySelector('a.idioma').textContent.trim() : null,
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
