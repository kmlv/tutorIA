import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const posts=[]; page.on('request', r=>{ if(r.url().includes('/api/')&&r.method()==='POST') posts.push(r.url().replace(/.*\/api\/session\/[^/]+\//,'')+' :: '+(r.postData()||'').slice(0,120)); });
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion');
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(1).click(); // MAL
await page.waitForFunction(()=>document.querySelector('.dock-body .pregunta:last-child .q-manip'),null,{timeout:15000});
console.log('llega la pregunta de manipulación. Pulso "Listo" 5 veces SIN arrastrar:\n');
for (let k=0;k<5;k++){
  const n0=posts.length;
  await page.locator('.dock-body .pregunta').last().locator('button.primario').click();
  await page.waitForTimeout(2500);
  const s = await page.evaluate(()=>({nPreg:document.querySelectorAll('.dock-body .pregunta').length,
    ultimos: Array.from(document.querySelectorAll('.dock-body > *')).slice(-2).map(n=>n.className+' :: '+n.textContent.trim().slice(0,80))}));
  console.log(`  clic ${k+1}: POSTs nuevos = ${JSON.stringify(posts.slice(n0))}`);
  console.log(`           preguntas en el dock = ${s.nPreg}; cola = ${JSON.stringify(s.ultimos)}`);
}
await browser.close();
