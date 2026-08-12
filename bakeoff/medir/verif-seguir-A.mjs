import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const snap = `(()=>{const q=document.querySelector('.q');const r=q?q.getBoundingClientRect():null;const pl=document.querySelector('#play');
 return {t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(), owns:window.__tutoria.media.ownsStage,
  playTxt:pl?pl.textContent.trim():null, reloj:(document.querySelector('.reloj,.tiempo,.time')||{}).textContent||null,
  nQ:document.querySelectorAll('.q').length, qRect:r?[Math.round(r.width),Math.round(r.height)]:null,
  nOpc:document.querySelectorAll('.q-opciones button').length, dock:window.__tutoria.dock.actual}})()`;
const rd = async tag => console.log(tag.padEnd(16), JSON.stringify(await page.evaluate(snap)));
await page.goto('http://localhost:57330/?lang=es&variant=A',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate('window.__tutoria.media.seek(228)'); await page.waitForTimeout(400);
await rd('en 228');
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused() && document.querySelectorAll(".q").length>0',null,{timeout:30000}).catch(()=>console.log(' (timeout)'));
await page.waitForTimeout(2000); await rd('fin narracion');
await page.screenshot({path:SP+'/A-1-practica.png'});
console.log('  boton:', await page.evaluate(`document.querySelector('#play').textContent.trim()`));
await page.click('#play'); await page.waitForTimeout(2500); await rd('tras Seguir');
await page.screenshot({path:SP+'/A-2-tras-seguir.png'});
await browser.close();
