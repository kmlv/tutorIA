import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

const urls = ['?lang=', '?lang=ES', '?lang=en-US', '?lang=es&t=90', '?lang=en-US&t=90', '?LANG=es'];
for (const u of urls) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage(); const errs=[];
  page.on('pageerror', e => errs.push(String(e).slice(0,120)));
  await page.goto('http://localhost:57330/'+u, {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(3500);
  const i = await page.evaluate(() => ({len:(document.body.innerText||'').length, t:typeof window.__tutoria!=='undefined'}));
  console.log('/'+u, '-> bodyLen', i.len, '| __tutoria', i.t, '|', JSON.stringify(errs));
  await ctx.close();
}

// ¿es permanente? ¿queda ALGO pulsable? ¿título? Espera larga en ?lang=EN
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=EN', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(20000);
const info = await page.evaluate(() => ({
  title: document.title,
  bodyHTML: document.body.innerHTML,
  clickables: document.querySelectorAll('button,a,input,[role="button"],select,textarea').length,
  appHTML: (document.getElementById('app')||{}).outerHTML,
}));
console.log('--- tras 20 s en ?lang=EN ---');
console.log('title:', JSON.stringify(info.title));
console.log('clickables:', info.clickables);
console.log('app:', JSON.stringify(info.appHTML));
console.log('body:', JSON.stringify(info.bodyHTML.slice(0,500)));
await page.screenshot({path:'lang-EN-blanco.png'});
await browser.close();
