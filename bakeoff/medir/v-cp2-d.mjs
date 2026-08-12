import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
await page.waitForSelector('.q textarea', {timeout: 15000});
await page.evaluate(() => window.__tutoria.media.pause());

// 1) enviar vacio varias veces
console.log('--- 1) VACIO x3 ---');
for (let i=0;i<3;i++){ await page.click('.q button'); await page.waitForTimeout(600); }
console.log('tras 3 clicks vacio -> msgs:', await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.innerText)));
console.log('btn:', await page.evaluate(()=>[...document.querySelectorAll('.q button')].map(b=>b.innerText+' dis='+b.disabled)));
console.log('textarea validationMessage:', await page.$eval('.q textarea',e=>e.validationMessage), '| required:', await page.$eval('.q textarea',e=>e.required));

// 2) respuesta buena
console.log('--- 2) respuesta ---');
await page.click('.q textarea'); await page.type('.q textarea','Porque el intercepto del jugo es m/p2 y p2 no cambio',{delay:1});
await page.click('.q button'); await page.waitForTimeout(4000);
console.log('msgs:', await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.className+'::'+m.innerText)));

// 3) seguir escribiendo -> se reactiva Responder?
console.log('--- 3) sigo escribiendo ---');
await page.click('.q textarea'); await page.type('.q textarea',' ... texto nuevo anadido',{delay:1});
await page.waitForTimeout(500);
console.log('ta:', JSON.stringify(await page.$eval('.q textarea',e=>e.value)));
console.log('btn tras teclear mas:', await page.evaluate(()=>[...document.querySelectorAll('.q button')].map(b=>b.innerText+' dis='+b.disabled)));
// intento Enter
await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
console.log('msgs tras Enter:', await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.innerText.slice(0,60))));

// 4) pulsar '¿Por qué?' -> da la respuesta?
console.log('--- 4) chips ---');
const chips = await page.evaluate(()=>[...document.querySelectorAll('.dock button')].map(b=>b.innerText));
console.log('chips disponibles:', JSON.stringify(chips));
await page.evaluate(()=>{const b=[...document.querySelectorAll('.dock button')].find(x=>x.innerText.trim()==='¿Por qué?'); if(b)b.click();});
await page.waitForTimeout(5000);
console.log('msgs tras ¿Por qué?:', await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.className+'::'+m.innerText.slice(0,300))));

// 5) reanudar audio: aparece la respuesta correcta en algun sitio?
console.log('--- 5) reanudar 25 s ---');
await page.evaluate(()=>window.__tutoria.media.play());
await page.waitForTimeout(25000);
console.log('t=', await page.evaluate(()=>window.__tutoria.media.currentTime()));
console.log('dock:', JSON.stringify((await page.evaluate(()=>document.querySelector('.dock').innerText)).replace(/\n+/g,' | ')));
console.log('captions:', JSON.stringify(await page.evaluate(()=>{const c=document.querySelector('.captions-band');return c?c.innerText.slice(0,300):null})));
await browser.close();
