import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
await page.goto('http://localhost:57330/?lang=es&t=140',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(2500);
const snap = async (tag)=>{ const s= await page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
  dock: window.__tutoria.dock?.actual,
  burbujas: Array.from(document.querySelectorAll('.dock-body > *')).map(n=>n.className+' | '+n.textContent.trim().replace(/\s+/g,' ').slice(0,50)),
  cards: Array.from(document.querySelectorAll('.dock-body .q')).map((p,i)=>({i, cls:p.className,
    vivos:p.querySelectorAll('button:not([disabled])').length, txt:p.textContent.trim().replace(/\s+/g,' ').slice(0,50)})),
})); console.log('\n== '+tag); console.log(JSON.stringify(s,null,1)); return s; };
await snap('0: cargado con ?t=140');
await page.click('#ask'); await page.waitForTimeout(6000);
await snap('1: tras pulsar Preguntar (#ask)');
await page.screenshot({path:'verif/v3b-1.png'});
await page.click('#play'); await page.waitForTimeout(10000);
await snap('2: tras Seguir y cruzar cp1 (144.761)');
await page.screenshot({path:'verif/v3b-2.png', fullPage:true});
await browser.close();
