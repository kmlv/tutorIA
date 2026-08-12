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
await page.goto('http://localhost:57330/?lang=es&t=215', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1500);

const dump = async (tag) => {
  const info = await page.evaluate(() => {
    const t = (sel) => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g,' ').trim() : '(no existe '+sel+')'; };
    const all = [...document.querySelectorAll('.bands, .bands *')].slice(0,0);
    return {
      time: window.__tutoria.media.currentTime(),
      dur: window.__tutoria.media.duration(),
      paused: window.__tutoria.media.paused(),
      estado: window.__tutoria.estado ? window.__tutoria.estado() : null,
      bands: t('.bands'),
      escenario: t('.escenario'),
      lienzoText: t('.lienzo'),
      captions: t('.captions-band'),
      bandsHTML: (document.querySelector('.bands')||{}).innerHTML?.slice(0,2000) || null,
    };
  });
  console.log('=== ' + tag + ' ===');
  console.log(JSON.stringify(info, null, 2));
};
await dump('CAMINO A: carga directa ?t=215');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-recapA-215.png'});
await browser.close();
