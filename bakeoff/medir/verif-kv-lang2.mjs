import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
let dialogo=null; page.on('dialog', async d=>{dialogo=d.message(); await d.accept();});

// --- A: enlace con ?t= obsoleto ---
await page.goto('http://localhost:57330/?lang=es&t=100', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.locator('#play').click(); await page.waitForTimeout(400);
await page.evaluate(()=>window.__tutoria.media.seek(200));
await page.waitForTimeout(1200);
const A = await page.evaluate(()=>({
  t: window.__tutoria.media.currentTime().toFixed(1),
  reloj: document.querySelector('.reloj,.tiempo,.time')?.textContent.trim(),
  href: document.querySelector('a.idioma').getAttribute('href'),
}));
console.log('A. estudiante va por t=%s (%s), href del enlace = %s', A.t, A.reloj, A.href);
await page.locator('a.idioma').click();
await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(2500);
console.log('A. tras pulsar:', await page.evaluate(()=>({
  url:location.search, t:window.__tutoria.media.currentTime().toFixed(1),
  reloj:document.querySelector('.reloj,.tiempo,.time')?.textContent.trim()})));

// --- B: durante la practica (variant A) ---
await page.goto('http://localhost:57330/?lang=es&variant=A', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const dur = await page.evaluate(()=>window.__tutoria.media.duration());
console.log('B. duracion =', dur);
await page.locator('#play').click(); await page.waitForTimeout(400);
// saltar checkpoints hasta el final
for (let i=0;i<12;i++){
  await page.waitForTimeout(600);
  const st = await page.evaluate(()=>({t:window.__tutoria.media.currentTime(),p:window.__tutoria.media.paused(),q:document.querySelectorAll('.q .q-opciones button').length}));
  if (st.q>0) { await page.locator('.q').last().locator('.q-opciones button').first().click(); await page.waitForTimeout(800); }
  if (st.p) { await page.locator('#play').click().catch(()=>{}); await page.waitForTimeout(300); }
  await page.evaluate(d=>window.__tutoria.media.seek(Math.min(d-1, window.__tutoria.media.currentTime()+60)), dur);
}
await page.waitForTimeout(4000);
let B0 = await page.evaluate(()=>({url:location.search,t:window.__tutoria.media.currentTime().toFixed(1),
  reloj:document.querySelector('.reloj,.tiempo,.time')?.textContent.trim(),
  nQ:document.querySelectorAll('.q').length,
  dock:(document.querySelector('.dock')?.innerText||'').replace(/\s+/g,' ').slice(0,180)}));
console.log('B. fin de narracion:', B0);
// responder items de practica
for (let i=0;i<3;i++){
  const b = page.locator('.q').last().locator('.q-opciones button');
  if (await b.count()) { await b.first().click(); await page.waitForTimeout(1500); }
}
const B = await page.evaluate(()=>({url:location.search,t:window.__tutoria.media.currentTime().toFixed(1),
  reloj:document.querySelector('.reloj,.tiempo,.time')?.textContent.trim(),
  nQ:document.querySelectorAll('.q').length,
  href:document.querySelector('a.idioma').getAttribute('href'),
  dock:(document.querySelector('.dock')?.innerText||'').replace(/\s+/g,' ').slice(0,180)}));
console.log('B. antes de English:', B);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/kv-practica-antes.png'});
await page.locator('a.idioma').click();
await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(2500);
console.log('B. despues de English:', await page.evaluate(()=>({url:location.search,
  t:window.__tutoria.media.currentTime().toFixed(1),
  reloj:document.querySelector('.reloj,.tiempo,.time')?.textContent.trim(),
  nQ:document.querySelectorAll('.q').length,
  dock:(document.querySelector('.dock')?.innerText||'').replace(/\s+/g,' ').slice(0,180)})));
console.log('dialogo:', dialogo);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/kv-practica-despues.png'});
await browser.close();
