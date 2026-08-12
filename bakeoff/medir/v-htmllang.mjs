import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

const urls = ['http://localhost:57330/',
              'http://localhost:57330/?lang=en',
              'http://localhost:57330/?lang=es'];

for (const url of urls) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const langLinks = [...document.querySelectorAll('a[hreflang], a[href*="lang="]')].map(a=>({
      text: a.textContent.trim().slice(0,40), href: a.getAttribute('href'), hreflang: a.getAttribute('hreflang'), lang: a.getAttribute('lang')
    }));
    // any element with a lang attribute at all
    const withLang = [...document.querySelectorAll('[lang]')].map(e=>({
      tag: e.tagName.toLowerCase(), lang: e.getAttribute('lang'), txt: (e.textContent||'').trim().slice(0,30)
    }));
    return {
      htmlLang: document.documentElement.lang,
      htmlLangAttr: document.documentElement.getAttribute('lang'),
      dir: document.documentElement.getAttribute('dir'),
      h1: h1 ? h1.textContent.trim() : null,
      title: document.title,
      bodyStart: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,200),
      langLinks, withLang,
    };
  });
  console.log('=== ' + url);
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}
await browser.close();
