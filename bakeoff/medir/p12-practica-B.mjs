import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const V = process.argv[2] || 'B';
await page.goto(`http://localhost:57330/?lang=es&variant=${V}&t=226`,{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(1500);
const rd = async tag => console.log(tag, JSON.stringify(await page.evaluate(`(()=>{const v=document.querySelector('video');const q=[...document.querySelectorAll('.q')].pop();return{
  t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(), owns:window.__tutoria.media.ownsStage,
  video: v? {disp:getComputedStyle(v).display}:null, lienzo:getComputedStyle(document.querySelector('.lienzo')).display,
  dock:window.__tutoria.dock.actual,
  q: q? {enun:(q.querySelector('.q-enunciado')||{}).textContent, ops:q.querySelectorAll('.q-opciones button').length, manip:!!q.querySelector('.q-manip')}:null
}})()`)));
await rd('t=226      ');
if (V==='A') await page.evaluate('window.__tutoria.media.seek(226)');
await page.evaluate('window.__tutoria.media.play()');
await page.waitForTimeout(12000);
await rd('tras final ');
console.log(' body tail:', (await page.evaluate(`document.body.innerText`)).replace(/\n+/g,' | ').slice(-500));
await page.screenshot({path:SP+`/practica-${V}.png`});
// language switch during practice
console.log('--- clic .idioma durante la práctica ---');
console.log(' href:', await page.evaluate(`document.querySelector('.idioma').getAttribute('href')`));
await browser.close();
