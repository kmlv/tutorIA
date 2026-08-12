import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

const urls = ['?lang=EN', '?lang=es-ES', '?lang=pt', '?lang=fr', '?lang=es', '?lang=en', ''];

for (const u of urls) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs = [], reqs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,300)));
  page.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,300)); });
  page.on('request', r => { const url=r.url(); if (url.includes('/api/')) reqs.push(r.method()+' '+url.replace('http://localhost:57330','')); });
  await page.goto('http://localhost:57330/'+u, {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(5000);
  const info = await page.evaluate(() => ({
    bodyText: (document.body.innerText||'').slice(0,200),
    bodyLen: (document.body.innerText||'').length,
    childCount: document.body.children.length,
    hasTutoria: typeof window.__tutoria !== 'undefined',
    hasSesion: typeof window.__tutoriaSesion !== 'undefined',
    dur: (window.__tutoria && window.__tutoria.media) ? window.__tutoria.media.duration() : null,
    btns: document.querySelectorAll('button').length,
    html: document.body.innerHTML.slice(0,300),
  }));
  console.log('=== URL: /'+u);
  console.log('  bodyLen:', info.bodyLen, '| children:', info.childCount, '| buttons:', info.btns, '| __tutoria:', info.hasTutoria, '| dur:', info.dur);
  console.log('  bodyText:', JSON.stringify(info.bodyText));
  console.log('  api reqs:', JSON.stringify(reqs));
  console.log('  errors:', JSON.stringify(errs));
  await ctx.close();
}
await browser.close();
