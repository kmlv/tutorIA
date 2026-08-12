import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(3000);
await page.click('.q-opciones button:nth-child(1)');
await page.waitForSelector('.q-manip', {timeout:8000}); await page.waitForTimeout(1200);
await page.click('#play'); await page.waitForTimeout(2200);
console.log(JSON.stringify(await page.evaluate(()=>{
  const svg = document.querySelector('.lienzo svg');
  const fr = document.querySelector('.capa-manip rect');
  return {t:+__tutoria.media.currentTime().toFixed(1), svgAria: svg?.getAttribute('aria-label'),
    rectTabindex: fr?.getAttribute('tabindex'), rectRole: fr?.getAttribute('role'),
    rectBox: fr? (()=>{const r=fr.getBoundingClientRect();return `${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)}`;})():null};
}),null,1));
// tab desde el reproductor: se puede enfocar?
await page.evaluate(()=>{const fr=document.querySelector('.capa-manip rect'); fr.focus(); });
console.log('foco en:', await page.evaluate(()=>document.activeElement?.getAttribute('role')||document.activeElement?.tagName));
await browser.close();
