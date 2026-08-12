import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,400);}catch{} net.push({u:u.replace(/.*\/api\//,''),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const sid1 = await page.evaluate(()=>window.__tutoriaSesion.session_id);
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
const tail = ()=>page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body > *')).slice(-4).map(n=>n.className+' :: '+n.textContent.trim().slice(0,120)));

console.log('=== C) botones de intención con una pregunta abierta ===');
for (const label of ['No entiendo','¿Por qué?','Otro ejemplo','Listo, sigamos']){
  await page.locator('.dock-acciones button', {hasText:label}).first().click();
  await page.waitForTimeout(3500);
  console.log(' >',label,'->', JSON.stringify(await tail()));
}
console.log('\n=== D) composer con una pregunta abierta ===');
await page.fill('.composer-input','¿Cuál es la respuesta correcta?');
await page.click('.composer-enviar');
await page.waitForTimeout(6000);
console.log(' composer ->', JSON.stringify(await tail()));
console.log(' turnos net chat:', net.filter(n=>/chat|turn|ask/.test(n.u)).slice(-3).map(n=>n.u+' '+n.s+' '+(n.b||'').slice(0,200)));
await page.screenshot({path:'probe/intenciones.png'});

console.log('\n=== E) recarga con la práctica a medias ===');
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click();
await page.waitForTimeout(2000);
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(1500);
const sid2 = await page.evaluate(()=>window.__tutoriaSesion.session_id);
console.log(' sesion antes:',sid1,' despues:',sid2, ' misma?', sid1===sid2);
console.log(' estado tras recarga:', JSON.stringify(await page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(1), dock:window.__tutoria.dock?.actual,
  nPreg: document.querySelectorAll('.dock-body .pregunta').length,
  dockBody: document.querySelector('.dock-body')?.textContent.trim().slice(0,120)}))));
await page.screenshot({path:'probe/tras-recarga.png'});
await browser.close();
