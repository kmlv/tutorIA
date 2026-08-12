import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
for (const l of ['No entiendo','¿Por qué?','Otro ejemplo','Más despacio','Listo, sigamos']){
  await page.locator('.dock-acciones button',{hasText:l}).first().click(); await page.waitForTimeout(400);
}
console.log('sin scroll:', JSON.stringify(await page.evaluate(()=>{const e=document.querySelector('.composer-enviar').getBoundingClientRect();
  const s=document.scrollingElement; return {enviarTop:Math.round(e.top),vh:innerHeight,scrollY:s.scrollTop,max:s.scrollHeight-s.clientHeight,
    pos:getComputedStyle(document.querySelector('.dock')).position, appOverflow:getComputedStyle(document.querySelector('.app')||document.body).overflow};})));
await page.screenshot({path:'probe/overflow-sin-scroll.png'});
await page.evaluate(()=>document.scrollingElement.scrollTo(0, 99999));
await page.waitForTimeout(500);
console.log('tras scroll al fondo:', JSON.stringify(await page.evaluate(()=>{const e=document.querySelector('.composer-enviar').getBoundingClientRect();
  const s=document.scrollingElement; return {enviarTop:Math.round(e.top),enviarBottom:Math.round(e.bottom),vh:innerHeight,scrollY:Math.round(s.scrollTop)};})));
await page.screenshot({path:'probe/overflow-con-scroll.png'});
let clic='OK'; try{ await page.click('.composer-enviar',{timeout:4000}); }catch{ clic='NO CLICABLE'; }
console.log('clic tras scroll:', clic);
// ¿queda visible el gráfico / el reproductor?
console.log('visibilidad:', JSON.stringify(await page.evaluate(()=>{const q=s=>{const e=document.querySelector(s); if(!e)return null; const r=e.getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom)};};
  return {escenario:q('.escenario'), play:q('#play'), lienzo:q('.lienzo'), bands:q('.bands')};})));
await browser.close();
