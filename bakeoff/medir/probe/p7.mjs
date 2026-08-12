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
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
const snap = async (tag)=>{ const s= await page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
  dock:window.__tutoria.dock?.actual,
  nPreg: document.querySelectorAll('.dock-body .pregunta').length,
  vivas: Array.from(document.querySelectorAll('.dock-body .pregunta')).filter(p=>p.querySelector('button:not([disabled]), input:not([disabled])')).map(p=>p.textContent.trim().slice(0,70)),
  ultimo: Array.from(document.querySelectorAll('.dock-body > *')).slice(-2).map(n=>n.textContent.trim().slice(0,90)),
})); console.log(tag, JSON.stringify(s)); return s; };

await snap('P1 pregunta mcq abierta');
console.log('\n=== A) pulsar #play con pregunta abierta, luego #ask para recuperarla ===');
await page.click('#play'); await page.waitForTimeout(1500); await snap('  tras Seguir');
await page.click('#ask'); await page.waitForTimeout(1200); await snap('  tras Preguntar');
await page.screenshot({path:'probe/tras-preguntar.png'});
// contesto la mcq que debería seguir viva
try{ await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click({timeout:3000}); console.log('  clic en opcion OK'); }
catch(e){ console.log('  NO pude contestar:', e.message.slice(0,90)); }
await page.waitForTimeout(2000); await snap('  tras contestar');

console.log('\n=== B) dejar que la narración pase por un checkpoint con práctica activa ===');
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(142); m.play();});
await page.waitForTimeout(9000);
await snap('  tras pasar cp1 (t~150)');
await page.screenshot({path:'probe/checkpoint-durante-practica.png'});
console.log('  preguntas vivas:', (await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body .pregunta')).filter(p=>p.querySelector('button:not([disabled]),input:not([disabled])')).map(p=>p.textContent.trim().slice(0,90)))));
console.log('  net /next:', net.filter(n=>n.u.endsWith('/next')).length, ' /answer:', net.filter(n=>n.u.endsWith('/answer')).length);
await browser.close();
