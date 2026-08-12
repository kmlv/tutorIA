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
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe-v';
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const dur = await page.evaluate('__tutoria.media.duration()');
console.log('duracion', dur);

// paso 2
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(3000);
console.log('t tras play final =', await page.evaluate('__tutoria.media.currentTime()'), 'paused=', await page.evaluate('__tutoria.media.paused()'));

// que hay en pantalla?
const dump = async (tag) => {
  const info = await page.evaluate(() => ({
    t: window.__tutoria.media.currentTime(),
    paused: window.__tutoria.media.paused(),
    q: document.querySelector('.q-enunciado')?.textContent?.trim().slice(0,140) || null,
    opciones: [...document.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim().slice(0,60)),
    manip: !!document.querySelector('.q-manip'),
    capaManip: !!document.querySelector('.capa-manip'),
    capaManipHTML: document.querySelector('.capa-manip')?.outerHTML?.slice(0,600) || null,
    lienzoChildren: [...(document.querySelector('.lienzo')?.children||[])].map(c=>c.getAttribute('class')||c.tagName),
    play: document.querySelector('#play')?.textContent?.trim(),
  }));
  console.log('--- '+tag, JSON.stringify(info, null, 1));
  await page.screenshot({path: path.join(OUT, tag+'.png')});
  return info;
};
await dump('01-final');
await browser.close();
