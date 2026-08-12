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

// Aterrizaje real del caso B: el alumno acaba en ?lang=en&t=130
await page.goto('http://localhost:57330/?lang=en&t=130', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(800);
const cap = async () => await page.evaluate(`(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(1),
  reloj:document.querySelector('#reloj').innerText.trim(),
  play:document.querySelector('#play').innerText.trim(),
  precio:(document.querySelector('.escenario')||{}).innerText.match(/\\$\\d\\/kg/g),
  caption:(document.querySelector('.captions-band')||{}).innerText.trim().slice(0,80)
}))()`);
console.log('aterrizaje:      ', JSON.stringify(await cap()));
await page.click('#play');
await page.waitForTimeout(2500);
console.log('2.5s tras Start: ', JSON.stringify(await cap()));
await page.screenshot({path:'vi-C-tras-start.png'});
await browser.close();
