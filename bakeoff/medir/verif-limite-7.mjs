import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
const posts=[]; page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname.split('/').pop());});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
await page.locator('#ask').first().click(); await page.waitForTimeout(400);
// BASELINE: boton de intencion ANTES de gastar nada
const n0=await page.locator('.dock-body > *').count(); const p0=posts.length;
await page.locator('.intencion',{hasText:'No entiendo'}).click(); await page.waitForTimeout(6000);
console.log(`BASELINE (0 preguntas gastadas) "No entiendo": burbujas ${n0} -> ${await page.locator('.dock-body > *').count()}  POSTs: ${JSON.stringify(posts.slice(p0))}`);
console.log('  ultimas:', JSON.stringify(await page.evaluate(`[...document.querySelectorAll('.dock-body > *')].slice(-2).map(x=>x.className+' :: '+x.textContent.trim().slice(0,80))`)));
console.log('  contador:', await page.evaluate(`document.querySelector('.composer-restantes').textContent`));
await browser.close();
