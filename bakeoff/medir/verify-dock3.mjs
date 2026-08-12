import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT='/Users/klopezva/GithubRepos/tutorIA/scratchpad/sondas-verify';
const browser = await chromium.launch({executablePath:exe,args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const m=async(et)=>{const r=await page.evaluate(()=>{const vh=innerHeight,vw=innerWidth;
 const f=s=>{const e=document.querySelector(s); if(!e)return null; const b=e.getBoundingClientRect();
  if(!b.width||!b.height)return{pct:0}; const v=Math.max(0,Math.min(b.bottom,vh)-Math.max(b.top,0))*Math.max(0,Math.min(b.right,vw)-Math.max(b.left,0));
  return {pct:Math.round(100*v/(b.width*b.height)),top:Math.round(b.top)};};
 return{scrollY:Math.round(scrollY),docH:document.documentElement.scrollHeight,lienzo:f('.lienzo'),opciones:f('.q-opciones'),
   caption:document.querySelector('.captions-band')?.textContent?.trim().slice(0,80),
   dockEstado:window.__tutoria?.dock?.actual, paused:window.__tutoria.media.paused(), t:+window.__tutoria.media.currentTime().toFixed(1)};});
 console.log(et,JSON.stringify(r)); return r;};
const emp=page.locator('button',{hasText:'Empezar'}).first(); if(await emp.count()) await emp.click();
await page.evaluate(()=>window.__tutoria.media.seek(142)); await page.evaluate(()=>window.__tutoria.media.play());
await page.waitForFunction(()=>!!document.querySelector('.q'),null,{timeout:30000});
await page.waitForTimeout(1000);
for(let i=0;i<3;i++){const a=await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
 await page.click('.composer-input'); await page.fill('.composer-input','explícame con detalle qué significa que la línea se desplace y por qué importa el ingreso aquí');
 await page.press('.composer-input','Enter');
 await page.waitForFunction(x=>document.querySelectorAll('.dock .msg').length>=x+2,a,{timeout:60000}).catch(()=>{});
 await page.waitForTimeout(2200);}
await m('tras 3 preguntas:');
// que es visible y clicable ahora mismo dentro del viewport?
const visibles = await page.evaluate(()=>{
  const vh=innerHeight,vw=innerWidth;
  return [...document.querySelectorAll('button,textarea,input,[role=button]')].filter(e=>{
    const b=e.getBoundingClientRect();
    return b.width>0&&b.height>0&&b.top<vh&&b.bottom>0&&b.left<vw&&b.right>0;
  }).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'').trim()).slice(0,45));
});
console.log('CONTROLES VISIBLES:', JSON.stringify(visibles));
// Tab desde el composer: a donde va el foco?
await page.click('.composer-input');
for(let i=0;i<4;i++){await page.keyboard.press('Tab');
 const f=await page.evaluate(()=>{const e=document.activeElement; const b=e.getBoundingClientRect();
   return {el:(e.tagName+':'+(e.textContent||'').trim()).slice(0,40), top:Math.round(b.top), scrollY:Math.round(scrollY)};});
 console.log(' Tab'+(i+1)+':',JSON.stringify(f));}
// Probar "Listo, sigamos" (accion visible)
const listo = page.locator('.dock-acciones button', {hasText:'Listo'}).first();
if(await listo.count()){await listo.click(); await page.waitForTimeout(2000); await m('tras "Listo, sigamos":');
 await page.screenshot({path:OUT+'/v-tras-listo.png'});}
else console.log('no hay boton Listo');
await browser.close();
