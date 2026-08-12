import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const cap = () => page.evaluate(()=>{
  const b=document.querySelector('.captions-band'); const cl=b?.querySelector('.caption-linea,.caption-texto,.captions-linea,p,span');
  return ((cl?.textContent)||(b?.firstChild?.textContent)||'').trim();
});
// A) muestreo fino del subtitulo 156-162 con seek (sin play) para fijar el instante exacto
console.log('SUBTITULO por instante (seek fino):');
let prev='';
for (let t=155; t<=163.01; t+=0.25){
  await page.evaluate(tt=>window.__tutoria.media.seek(tt), t);
  await page.waitForTimeout(60);
  const c = await cap();
  if (c!==prev){ console.log(`  t=${t.toFixed(2)} -> ${c}`); prev=c; }
}

// B) repro y estado en cp2/prediction con cp1 aun viva
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>144', null, {timeout:15000});
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime() >= 176.5 || (window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>176)', null, {timeout:70000});
await page.waitForTimeout(600);
console.log('\nDOCK a t=176.13 (prediction) con cp1 sin contestar:\n', await page.evaluate(()=>document.querySelector('.dock')?.innerText?.trim()));
console.log('nº de bloques .q:', await page.evaluate(()=>document.querySelectorAll('.q').length));
await page.screenshot({path:'v-dos-preguntas-apiladas.png', fullPage:false});

// C) registro/telemetria tras contestar bien post-spoiler
await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click());
await page.waitForTimeout(1500);
console.log('\nCLAVES globales:', await page.evaluate(()=>Object.keys(window).filter(k=>/tutor|sesion|prog|telem|log/i.test(k))));
console.log('localStorage:', await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage)).valueOf()).slice(0,600)));
await browser.close();
