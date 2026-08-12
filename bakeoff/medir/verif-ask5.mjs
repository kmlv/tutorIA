import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const posts=[];
page.on('request', r => { if (r.url().includes('/events') && r.method()==='POST') posts.push(r.postData()); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play'); await page.waitForTimeout(1500);
posts.length=0;
await page.click('#ask'); await page.waitForTimeout(500);
console.log('tras 1er clic, eventos:', JSON.stringify(posts));
posts.length=0;
await page.click('#ask'); await page.waitForTimeout(500);
await page.click('#ask'); await page.waitForTimeout(500);
console.log('tras 2o+3er clic (redundantes), eventos:', JSON.stringify(posts));
console.log('foco activo:', await page.evaluate(()=>document.activeElement.className||document.activeElement.tagName));

// ¿saltar en el tiempo cierra el dock?
await page.evaluate(()=>window.__tutoria.media.seek(60));
await page.waitForTimeout(1200);
console.log('tras seek(60):', await page.evaluate(()=>({est:document.querySelector('.dock').dataset.estado, escW:Math.round(document.querySelector('.escenario').getBoundingClientRect().width)})));

// recargar misma URL con ?t -> ¿arranca cerrado?
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('tras recarga:', await page.evaluate(()=>document.querySelector('.dock').dataset.estado));
await browser.close();
