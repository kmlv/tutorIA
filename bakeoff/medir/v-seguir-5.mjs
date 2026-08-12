import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
const snap = () => page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
  dis:[...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled).join(','), nq:document.querySelectorAll('.q').length}));

// CONTROL: camino previsto -> contestar EN el checkpoint, sin tocar 'Seguir'
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>144',null,{timeout:15000});
console.log('CONTROL parada:', JSON.stringify(await snap()));
await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click());
await page.waitForTimeout(2000);
console.log('CONTROL tras responder bien:', JSON.stringify(await snap()),
  '| play:', await page.evaluate(()=>document.querySelector('#play')?.textContent.trim()),
  '| veredicto:', await page.evaluate(()=>document.querySelector('.dock')?.innerText.match(/Correcto\.|Incorrecto|No exactamente|Casi/)?.[0]));

// CONTROL 2: respuesta EQUIVOCADA despues del spoiler (opcion 2)
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>144',null,{timeout:15000});
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime()>=160',null,{timeout:40000});
await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[1].click());
await page.waitForTimeout(2000);
console.log('\nTRAS SPOILER, opcion 2 (mala):', JSON.stringify(await snap()));
console.log('DOCK:', (await page.evaluate(()=>document.querySelector('.dock')?.innerText.trim())).slice(0,400));
await browser.close();
