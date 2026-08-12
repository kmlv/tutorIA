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
await page.evaluate(()=>document.scrollingElement.scrollTo(0,99999)); await page.waitForTimeout(400);
console.log(JSON.stringify(await page.evaluate(()=>{
  const b=document.querySelector('.composer-enviar'); const r=b.getBoundingClientRect();
  const cx=Math.round(r.left+r.width/2), cy=Math.round(r.top+r.height/2);
  const top=document.elementFromPoint(cx,cy);
  return {cx,cy, encima: top? top.className+'|'+top.tagName : null, esElBoton: top===b,
    opcionesVivas: Array.from(document.querySelectorAll('.dock-body .pregunta .q-opcion')).map(o=>{const rr=o.getBoundingClientRect(); return {txt:o.textContent.slice(0,25), top:Math.round(rr.top), vis: rr.top>=0&&rr.bottom<=innerHeight};})};
}),null,1));
await page.screenshot({path:'probe/overflow-fondo.png'});
await page.evaluate(()=>document.scrollingElement.scrollTo(0,0)); await page.waitForTimeout(300);
await page.screenshot({path:'probe/overflow-arriba.png'});
await browser.close();
