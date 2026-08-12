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

const dur = await page.evaluate('window.__tutoria.media.duration()');
console.log('duracion total (s):', dur);

// Volcar toda la barra de transporte / controles
const dump = await page.evaluate(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  return {
    botones: q('button').map(b=>({t:(b.textContent||'').trim().slice(0,40), id:b.id, cls:b.className})),
    enlaces: q('a').map(a=>({t:(a.textContent||'').trim().slice(0,40), href:a.getAttribute('href')})),
    rangos: q('input[type=range],progress,[role=slider]').length,
    reloj: (document.querySelector('#reloj,.reloj,.clock,[class*=reloj],[class*=time]')||{}).textContent,
    bodytext: document.body.innerText.slice(0,600)
  };
});
console.log(JSON.stringify(dump, null, 1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/00-inicial.png'});
await browser.close();
