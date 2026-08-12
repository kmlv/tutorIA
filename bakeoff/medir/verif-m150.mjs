import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,900);}catch{} net.push({u:u.split('/').pop(),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = ()=>page.evaluate(()=>({
  estado: window.__tutoria.estado(),
  bands: document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ') || null,
  aria: document.querySelector('svg.bgraph')?.getAttribute('aria-label') || document.querySelector('.lienzo svg')?.getAttribute('aria-label'),
  interceptos: Array.from(document.querySelectorAll('.capa-interceptos text')).map(t=>t.textContent),
  enunciado: document.querySelector('.dock-body .pregunta:last-child .q-enunciado')?.innerText || document.querySelector('.q-enunciado')?.innerText,
}));

console.log('== ESTADO INICIAL (t=0) ==');
console.log(JSON.stringify(await snap(),null,1));

await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion', {timeout:20000});
await page.waitForTimeout(500);
const q1 = await page.evaluate(()=>({
  enun: document.querySelector('.dock-body .pregunta:last-child .q-enunciado')?.innerText,
  ops: Array.from(document.querySelectorAll('.dock-body .pregunta:last-child .q-opcion')).map(b=>b.innerText),
}));
console.log('== MCQ 1 ==', JSON.stringify(q1,null,1));
await browser.close();
