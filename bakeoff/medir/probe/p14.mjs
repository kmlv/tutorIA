import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const label of ['Listo, sigamos','No entiendo','Más despacio','Otro ejemplo','¿Por qué?']){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
  await page.waitForSelector('.dock-body .pregunta .q-opcion');
  await page.waitForTimeout(500);
  const a = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(1),paused:window.__tutoria.media.paused(),
    dockB:Math.round(document.querySelector('.dock').getBoundingClientRect().bottom), sw:document.scrollingElement.scrollWidth, sh:document.scrollingElement.scrollHeight}));
  await page.locator('.dock-acciones button',{hasText:label}).first().click();
  await page.waitForTimeout(2500);
  const b = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(1),paused:window.__tutoria.media.paused(),
    dock:window.__tutoria.dock?.actual,
    dockB:Math.round(document.querySelector('.dock').getBoundingClientRect().bottom), sw:document.scrollingElement.scrollWidth, sh:document.scrollingElement.scrollHeight,
    opcionVisible: (()=>{const o=document.querySelector('.dock-body .pregunta .q-opcion'); if(!o)return null; const r=o.getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;})()}));
  console.log(`[${label}]  antes t=${a.t} paused=${a.paused} dockB=${a.dockB} page=${a.sw}x${a.sh}`);
  console.log(`          despues t=${b.t} paused=${b.paused} dock=${b.dock} dockB=${b.dockB} page=${b.sw}x${b.sh} opcionVisible=${b.opcionVisible}`);
  await page.close(); await ctx.close();
}
await browser.close();
