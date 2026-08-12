import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,300);}catch{} net.push({u:u.replace(/.*\/api\//,''),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});

const snap = async (tag)=>{ const s= await page.evaluate(()=>{
  const cards = Array.from(document.querySelectorAll('.dock-body .q'));
  return {
    t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
    dock: window.__tutoria.dock?.actual,
    estado: JSON.stringify(window.__tutoria.estado()).slice(0,260),
    cards: cards.map((p,i)=>({i, cls:p.className, viva: p.querySelectorAll('button:not([disabled])').length,
      txt: p.textContent.trim().replace(/\s+/g,' ').slice(0,60)})),
    burbujas: Array.from(document.querySelectorAll('.dock-body > *')).map(n=>n.className+' | '+n.textContent.trim().replace(/\s+/g,' ').slice(0,55)),
  };
}); console.log('\n== '+tag); console.log(JSON.stringify(s,null,1)); return s; };

await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .q .q-opcion', {timeout:20000});
await page.waitForTimeout(1200);
await page.locator('.dock-body .q').last().locator('.q-opcion').nth(0).click();
await page.waitForTimeout(2500);
await snap('A: manip abierta');
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(142); m.play();});
await page.waitForTimeout(9000);
await snap('B: tras cp1 -> 3 tarjetas');
const nAnsA = net.filter(n=>n.u.endsWith('/answer')).length;

// 1) intentar contestar el DUPLICADO (la ultima tarjeta)
console.log('\n--- clic en el duplicado (ultima tarjeta), opcion 1 "Se vuelve mas plana" (INCORRECTA) ---');
await page.locator('.dock-body .q').last().locator('.q-opcion').nth(1).click();
await page.waitForTimeout(3000);
await snap('C: tras contestar el duplicado con opcion incorrecta');
await page.screenshot({path:'verif/v2-c-dup-contestado.png', fullPage:true});
console.log('  /answer nuevos:', net.filter(n=>n.u.endsWith('/answer')).length - nAnsA);
console.log('  ultimos /api:', JSON.stringify(net.slice(-4)));

// 2) el "Listo" de la manip sigue vivo?
const listo = page.locator('.q-manip button:not([disabled])');
console.log('\n--- Listo de la manip:', await listo.count());
if (await listo.count()) { await listo.first().click(); await page.waitForTimeout(3000); await snap('D: tras pulsar Listo sin haber arrastrado'); }
await page.screenshot({path:'verif/v2-d-tras-listo.png', fullPage:true});
console.log('\n  TODAS las /api:', JSON.stringify(net.map(n=>n.u+':'+n.s)));
await browser.close();
