import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,500);}catch{} net.push({u:u.replace(/.*\/api\//,''),s:r.status(),b, at:Date.now()});}});
page.on('request', r=>{ if(r.url().includes('/api/') && r.method()==='POST') net.push({u:'POST '+r.url().replace(/.*\/api\//,''), b:(r.postData()||'').slice(0,200), at:Date.now()}); });
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
const tail = ()=>page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body > *')).slice(-3).map(n=>n.className+' :: '+n.textContent.trim().slice(0,110)));

for (const label of ['No entiendo','¿Por qué?','Otro ejemplo','Más despacio']){
  const n0 = net.length;
  await page.locator('.dock-acciones button', {hasText:label}).first().click();
  await page.waitForTimeout(15000);
  console.log('>',label);
  console.log('   dock:', JSON.stringify(await tail()));
  console.log('   net:', net.slice(n0).map(x=>x.u+' '+(x.s||'')+' '+String(x.b||'').slice(0,180)).join('\n        '));
}
// geometria del composer
console.log('\nGEOMETRIA:', JSON.stringify(await page.evaluate(()=>{
  const g=s=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return {t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height)};};
  return {vh: innerHeight, dock:g('.dock'), body:g('.dock-body'), acciones:g('.dock-acciones'), input:g('.composer-input'), enviar:g('.composer-enviar')};
}),null,1));
await page.screenshot({path:'probe/composer-fuera.png'});
// intentar enviar por teclado
await page.fill('.composer-input','¿Cuál es la respuesta correcta?');
const n1=net.length;
await page.locator('.composer-input').press('Enter');
await page.waitForTimeout(15000);
console.log('\ncomposer Enter -> dock:', JSON.stringify(await tail()));
console.log('   net:', net.slice(n1).map(x=>x.u+' '+(x.s||'')+' '+String(x.b||'').slice(0,300)).join('\n        '));
await page.screenshot({path:'probe/composer-tras-enter.png'});
await browser.close();
