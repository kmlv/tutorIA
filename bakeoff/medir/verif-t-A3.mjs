import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log('JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&variant=A&t=110',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(1200);
// localizar TODO elemento cuyo texto sea un reloj mm:ss
const relojes = await page.evaluate(()=>{
  const out=[];
  document.querySelectorAll('*').forEach(e=>{
    if(e.children.length===0){
      const t=(e.textContent||'').trim();
      if(/^\d{1,2}:\d{2}(\s*\/\s*\d{1,2}:\d{2})?$/.test(t)) out.push({tag:e.tagName, cls:e.className, txt:t});
    }
  });
  return out;
});
console.log('RELOJES:', JSON.stringify(relojes));
// buscar -3.00 en toda la pagina
const pend = await page.evaluate(()=>{
  const body=document.body.innerText;
  const m=body.match(/[-−]\s*3[.,]00/g);
  // tambien SVG text nodes
  const svg=[...document.querySelectorAll('svg text')].map(t=>t.textContent.trim()).filter(Boolean);
  return {matchesEnTexto:m, svgTexts:svg.slice(0,40)};
});
console.log('PENDIENTE:', JSON.stringify(pend));
// subtitulo visible aislado
const sub = await page.evaluate(()=>{
  const cb=document.querySelector('.captions-band');
  return cb? [...cb.querySelectorAll('*')].map(e=>({cls:e.className,txt:(e.textContent||'').trim().slice(0,90)})).slice(0,6):null;
});
console.log('SUB:', JSON.stringify(sub,null,1));
// ahora: cambiar idioma con el enlace y ver si t sobrevive
const href = await page.evaluate(()=>{const a=[...document.querySelectorAll('a')].find(a=>(a.getAttribute('href')||'').includes('lang=en')); return a?a.getAttribute('href'):null;});
console.log('ENLACE IDIOMA:', href);
if(href){
  await page.click(`a[href="${href}"]`);
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.waitForTimeout(1200);
  const tras = await page.evaluate(()=>({url:location.href, ct:window.__tutoria.media.currentTime(), mostrar:window.__tutoria.estado().mostrar}));
  console.log('TRAS CAMBIO DE IDIOMA:', JSON.stringify(tras));
}
await browser.close();
