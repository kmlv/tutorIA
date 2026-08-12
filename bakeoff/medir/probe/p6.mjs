import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,500);}catch{} net.push({u:u.replace(/.*\/api\/session\/[^/]+/,''),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click();   // bien
await page.waitForFunction(()=>document.querySelector('.dock-body .pregunta:last-child .q-manip'),null,{timeout:15000});
await page.waitForTimeout(600);
async function press(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(100); }
await press('ArrowUp',50); await press('ArrowRight',17);
const snap = ()=>page.evaluate(()=>({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  dock: window.__tutoria.dock?.actual,
  intercepts: Array.from(document.querySelectorAll('.capa-interceptos text')).map(t=>t.textContent),
  hayManipLayer: !!document.querySelector('.capa-manip'),
  hayListo: !!document.querySelector('.dock-body .pregunta:last-child button.primario:not([disabled])'),
  ultimoDock: Array.from(document.querySelectorAll('.dock-body > *')).slice(-2).map(n=>n.textContent.trim().slice(0,110)),
  playLabel: document.querySelector('#play')?.textContent,
}));
console.log('ANTES de tocar el reproductor:', JSON.stringify(await snap()));

console.log('\n>>> clic en #play (Seguir) durante la pregunta de manipulación');
await page.click('#play');
await page.waitForTimeout(2500);
console.log('DESPUES:', JSON.stringify(await snap()));
await page.screenshot({path:'probe/play-durante-manip.png'});

console.log('\n>>> retroceso: seek(120) y play, con la pregunta de manipulación abierta');
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(120); m.play();});
await page.waitForTimeout(4000);
console.log('DESPUES seek(120):', JSON.stringify(await snap()));
await page.screenshot({path:'probe/seek-durante-manip.png'});
console.log('\n>>> ahora pulso Listo');
try{ await page.click('.dock-body .pregunta:last-child button.primario', {timeout:3000}); }catch(e){ console.log('  no se pudo pulsar Listo:', e.message.slice(0,80)); }
await page.waitForTimeout(2500);
console.log('TRAS Listo:', JSON.stringify(await snap()));
console.log('net answer:', net.filter(n=>n.u.endsWith('/answer')).slice(-2).map(n=>n.b));
await page.screenshot({path:'probe/tras-listo.png'});
await browser.close();
