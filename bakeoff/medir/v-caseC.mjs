import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const modo = process.argv[2] || 'cp1';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const seek = modo==='cp1' ? 143 : 193.5;
await page.evaluate((s) => { window.__tutoria.media.seek(s); window.__tutoria.media.play(); }, seek);
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000});
await page.waitForTimeout(500);
if (modo==='cp1') { await page.click('.q-opciones button:nth-of-type(1)'); }
else { await page.fill('.q-textarea','cualquier cosa'); await page.click('.q-form button[type=submit]'); }
await page.waitForTimeout(6000);
console.log('estado antes de "Listo, sigamos":', await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(3),p:window.__tutoria.media.paused(),dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(-260)})));

// instalar muestreo fino en la pagina
await page.evaluate(()=>{
  window.__trazas=[];
  window.__t0=performance.now();
  const tick=()=>{
    const dock=document.querySelector('.dock');
    window.__trazas.push({
      ms:+(performance.now()-window.__t0).toFixed(1),
      t:+window.__tutoria.media.currentTime().toFixed(3),
      p:window.__tutoria.media.paused(),
      txt:dock?dock.innerText.replace(/\n+/g,' | '):'' });
    if (performance.now()-window.__t0 < 4000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
console.log('\n>>> pulso "Listo, sigamos"');
await page.evaluate(()=>{ [...document.querySelectorAll('.dock-acciones button')].find(b=>/Listo/.test(b.innerText)).click(); });
await page.waitForTimeout(4500);
const tr = await page.evaluate(()=>window.__trazas);
// imprimir solo cambios relevantes
let prevP=null, prevTxt=null, primerAvance=null, primerSeguimos=null;
for(const r of tr){
  const seguimos = /Cuando quieras, seguimos/.test(r.txt);
  const cambio = r.p!==prevP || seguimos!==/Cuando quieras, seguimos/.test(prevTxt||'');
  if(prevP!==null && prevP===true && r.p===false && primerAvance===null) primerAvance=r;
  if(seguimos && primerSeguimos===null) primerSeguimos=r;
  if(cambio) console.log(`  ms=${r.ms} t=${r.t} paused=${r.p} tieneSeguimos=${seguimos}`);
  prevP=r.p; prevTxt=r.txt;
}
console.log('\nPRIMER frame despausado :', primerAvance? `ms=${primerAvance.ms} t=${primerAvance.t}`:'nunca');
console.log('PRIMER frame con "Cuando quieras, seguimos":', primerSeguimos? `ms=${primerSeguimos.ms} t=${primerSeguimos.t}`:'nunca');
console.log('\nultimo estado:', await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(3),p:window.__tutoria.media.paused(),dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(-300), estado:document.querySelector('.dock').dataset.estado})));
await browser.close();
