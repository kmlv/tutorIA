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
await page.goto('http://localhost:57330/?lang=es&t=100', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = async (label) => {
  const s = await page.evaluate(() => ({
    currentTime: window.__tutoria.media.currentTime(),
    paused: window.__tutoria.media.paused(),
    duration: window.__tutoria.media.duration(),
    estado: JSON.parse(JSON.stringify(window.__tutoria.estado())),
    captions: (document.querySelector('.captions-band')||{}).textContent?.trim().slice(0,120),
    playBtn: (document.querySelector('#play')||{}).textContent?.trim(),
    reloj: Array.from(document.querySelectorAll('body *')).filter(e=>e.children.length===0 && /^\d?\d:\d\d(\s*\/\s*\d?\d:\d\d)?$/.test(e.textContent.trim())).map(e=>e.className+' -> '+e.textContent.trim()),
  }));
  console.log('=== ' + label);
  console.log('  currentTime=', s.currentTime, ' paused=', s.paused, ' dur=', s.duration);
  console.log('  playBtn=', JSON.stringify(s.playBtn));
  console.log('  reloj=', JSON.stringify(s.reloj));
  console.log('  captions=', JSON.stringify(s.captions));
  console.log('  estado=', JSON.stringify(s.estado));
  return s;
};

await snap('T+0 tras cargar ?t=100');
await page.waitForTimeout(9000);
await snap('T+9s sin tocar nada');
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/t100-carga.png'});
await browser.close();
