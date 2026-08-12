import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const snap = async (tag)=>{ const s= await page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
  dock: window.__tutoria.dock?.actual,
  cards: Array.from(document.querySelectorAll('.dock-body .q')).map((p,i)=>({i, cls:p.className,
    vivos:p.querySelectorAll('button:not([disabled])').length, txt:p.textContent.trim().replace(/\s+/g,' ').slice(0,60)})),
})); console.log('== '+tag+' '+JSON.stringify(s)); return s; };
console.log('SOLO UI: pulsar Empezar y dejar correr hasta cp1 (144.761)');
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime() > 146', null, {timeout:200000});
await page.waitForTimeout(1500);
await snap('A: en cp1');
await page.screenshot({path:'verif/v4-a-cp1.png'});
console.log('SOLO UI: pulsar Seguir SIN contestar el checkpoint');
await page.click('#play'); await page.waitForTimeout(2000);
await snap('B: tras Seguir sin contestar');
await page.waitForFunction('window.__tutoria.media.currentTime() > 196', null, {timeout:200000});
await page.waitForTimeout(1500);
await snap('C: tras cruzar cp2 con cp1 sin contestar');
await page.screenshot({path:'verif/v4-c-cp2.png', fullPage:true});
await browser.close();
