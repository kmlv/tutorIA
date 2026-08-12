import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const mk = async () => { const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const p = await ctx.newPage(); p.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,160)));
  await p.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000}); return p; };
const info = p => p.evaluate(()=>({
  actual: window.__tutoria?.dock?.actual,
  rect: (r=>({x:Math.round(r.x),w:Math.round(r.width)}))(document.querySelector('.dock').getBoundingClientRect()),
  opacity: getComputedStyle(document.querySelector('.dock')).opacity,
  texto: document.querySelector('.dock').innerText.replace(/\s+/g,' ').trim().slice(0,300)
}));

console.log('=== A) camino normal: abrir el dock con el ratón, sin preguntar nada');
let p = await mk();
await p.click('#ask'); await p.waitForTimeout(800);
console.log(JSON.stringify(await info(p)));

console.log('\n=== B) camino de teclado correcto: Tab x2 -> Enter sobre ✋ Preguntar');
let q = await mk();
await q.keyboard.press('Tab'); await q.keyboard.press('Tab');
await q.keyboard.press('Enter'); await q.waitForTimeout(800);
console.log(JSON.stringify(await info(q)));

console.log('\n=== C) el fallo: Tab x6 a ciegas, escribir, Enter; DESPUES abrir el dock');
let r = await mk();
for (let i=0;i<6;i++) await r.keyboard.press('Tab');
await r.keyboard.type('hola tutor');
await r.keyboard.press('Enter');
await r.waitForTimeout(6000);
console.log('  invisible, dock =', JSON.stringify(await info(r)));
console.log('  foco ahora:', await r.evaluate(()=>document.activeElement.className));
// Tab 7 = boton enviar, tambien invisible
await r.keyboard.press('Tab');
console.log('  Tab 7 ->', await r.evaluate(()=>{const a=document.activeElement;const b=a.getBoundingClientRect();
  return a.tagName+'.'+a.className+' x='+Math.round(b.x)+' texto="'+a.textContent.trim()+'"';}));
await r.click('#ask'); await r.waitForTimeout(900);
console.log('  tras pulsar ✋ Preguntar con el ratón:', JSON.stringify(await info(r)));
await r.screenshot({path:'tabdock-abierto-despues.png'});
await browser.close();
