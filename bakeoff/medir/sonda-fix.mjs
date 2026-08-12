import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
let errs=0; page.on('pageerror', e => {errs++; console.log('  JS ERROR:', String(e).slice(0,160));});
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
// por que el enlace no se mueve: quien tiene el margen auto
console.log('margin-left .desfase:', await page.evaluate(()=>getComputedStyle(document.getElementById('desfase')).marginLeft));
console.log('margin-left .idioma :', await page.evaluate(()=>getComputedStyle(document.querySelector('.idioma')).marginLeft));
// simular el "arreglo ingenuo": borrar solo el span y reproducir
await page.evaluate(()=>document.getElementById('desfase').remove());
await page.click('#play');
await page.waitForTimeout(9000);
console.log(`tras 9s con el span borrado: errores JS = ${errs}, t=${await page.evaluate(()=>window.__tutoria.media.currentTime().toFixed(1))}`);
await browser.close();
