import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const api=[];
page.on('request', r => { if(r.url().includes('/api/')) api.push(r.method()+' '+r.url().replace(/^.*\/api/,'/api').replace(/session\/[0-9a-f]+/,'session/SID')); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1200);
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela', exact:true}).first().click();
await page.waitForFunction(`document.querySelectorAll('.q-manip').length > 0`, null, {timeout:25000});
await page.waitForTimeout(1500);
const marca = api.length;
for(let i=0;i<3;i++){
  await page.evaluate(() => { const ms=[...document.querySelectorAll('.q-manip')]; const l=ms[ms.length-1]; const b=[...l.querySelectorAll('button')].find(x=>/listo/i.test(x.textContent)); if(b&&!b.disabled) b.click(); });
  await page.waitForTimeout(1800);
}
const st = await page.evaluate(()=>({nManip:document.querySelectorAll('.q-manip').length, ultimo:[...document.querySelectorAll('.q-enunciado')].pop()?.textContent}));
console.log('tras 3 clics Listo (camino CORRECTO):', JSON.stringify(st));
console.log('red desde el manip:', JSON.stringify(api.slice(marca)));
console.log('/answer totales en la sesion:', api.filter(x=>x.includes('/answer')).length);
await browser.close();
