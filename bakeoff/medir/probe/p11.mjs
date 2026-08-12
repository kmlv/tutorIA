import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
const g = ()=>page.evaluate(()=>{const e=document.querySelector('.composer-enviar').getBoundingClientRect();
  const d=document.querySelector('.dock').getBoundingClientRect(); const b=document.querySelector('.dock-body');
  return {vh:innerHeight, enviarB:Math.round(e.bottom), dockB:Math.round(d.bottom), dockBodyOverflow: getComputedStyle(b).overflowY, scroll: document.scrollingElement.scrollHeight-document.scrollingElement.clientHeight};});
console.log('inicio', JSON.stringify(await g()));
const labels=['No entiendo','¿Por qué?','Otro ejemplo','Más despacio','Listo, sigamos'];
for (let k=0;k<3;k++){
 for (const l of labels){
  try{ await page.locator('.dock-acciones button',{hasText:l}).first().click({timeout:3000}); }catch{ console.log('  no clicable:',l); }
  await page.waitForTimeout(400);
 }
 console.log('ronda',k+1, JSON.stringify(await g()));
 let clic='OK'; try{ await page.click('.composer-enviar',{timeout:3000}); }catch{ clic='NO CLICABLE'; }
 console.log('   clic enviar:', clic);
 if (clic==='NO CLICABLE'){ await page.screenshot({path:'probe/composer-inalcanzable.png'}); break; }
}
await browser.close();
