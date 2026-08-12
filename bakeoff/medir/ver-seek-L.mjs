import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.click('#play'); await page.waitForFunction('window.__tutoria.media.currentTime()>18',null,{timeout:60000});
console.log('antes English:', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
await page.click('a[href*="lang=en"]'); await page.waitForLoadState('domcontentloaded');
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000}); await page.waitForTimeout(600);
console.log('tras English:', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2), page.url());
await page.goBack({waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000}); await page.waitForTimeout(900);
console.log('tras Atras del navegador:', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2), await page.evaluate(()=>document.querySelector('#reloj').textContent), page.url());
// variante B
await page.goto('http://localhost:57330/?lang=es&t=180&variant=B',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000}); await page.waitForTimeout(1500);
console.log('variant=B ownsStage:', await page.evaluate('window.__tutoria.media.ownsStage'), 'ct:', await page.evaluate('window.__tutoria.media.currentTime()'), 'reloj:', await page.evaluate(()=>document.querySelector('#reloj').textContent));
// almacenamiento de progreso
console.log('localStorage:', await page.evaluate(()=>JSON.stringify(Object.keys(localStorage))), 'sessionStorage:', await page.evaluate(()=>JSON.stringify(Object.keys(sessionStorage))));
await browser.close();
