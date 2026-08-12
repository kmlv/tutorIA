import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

async function corre(opt, {espera=10000}={}) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage(); let net=null;
  page.on('response', async r=>{ if(r.url().includes('/answer')){ try{net=JSON.parse(await r.text());}catch(e){} }});
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.click('#play'); await page.waitForTimeout(300);
  await page.evaluate('window.__tutoria.media.seek(85)');
  if (await page.evaluate('window.__tutoria.media.paused()')) await page.click('#play');
  await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(600);
  await page.click(`.q-opciones button:nth-of-type(${opt})`);
  await page.waitForTimeout(espera);
  const o = await page.evaluate(() => ({
    dockHTML: document.querySelector('.dock')?.innerHTML || '',
    botones: [...document.querySelectorAll('.q-opciones button')].map(b=>({txt:b.textContent.trim().slice(0,40), cls:b.className, dis:b.disabled, aria:b.getAttribute('aria-label')||'', ds:JSON.stringify(b.dataset)})),
    qCls: document.querySelector('.q')?.className,
    htmlEntero: document.documentElement.innerHTML,
    t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  }));
  await ctx.close(); return {net, ...o};
}
const OK = await corre(1);
const MAL = await corre(3);
console.log('correcto  -> correcta=', OK.net?.correcta, ' socratica=', JSON.stringify(OK.net?.socratica));
console.log('incorrecto-> correcta=', MAL.net?.correcta, ' socratica=', JSON.stringify(MAL.net?.socratica));
const soc = (MAL.net?.socratica||'').trim().slice(0,30);
console.log('\n>> tras 10s, ¿la socratica esta EN ALGUN SITIO del DOM (incluso oculta)?',
  soc ? MAL.htmlEntero.includes(soc) : 'n/a');
console.log('>> t final=', MAL.t.toFixed(2), 'paused=', MAL.paused);
console.log('\n--- clases de .q:', 'OK:', OK.qCls, '| MAL:', MAL.qCls);
console.log('\n--- botones tras ACERTAR (opcion1):');
OK.botones.forEach((b,i)=>console.log(`   ${i+1}. cls="${b.cls}" dis=${b.dis} ds=${b.ds} | ${b.txt}`));
console.log('--- botones tras FALLAR (opcion3):');
MAL.botones.forEach((b,i)=>console.log(`   ${i+1}. cls="${b.cls}" dis=${b.dis} ds=${b.ds} | ${b.txt}`));
// diff crudo del dock
const a=OK.dockHTML, b=MAL.dockHTML;
let i=0; while(i<a.length&&i<b.length&&a[i]===b[i]) i++;
let j=0; while(j<a.length-i&&j<b.length-i&&a[a.length-1-j]===b[b.length-1-j]) j++;
console.log('\n--- DIFF dock innerHTML (longitudes', a.length, 'vs', b.length,'):');
console.log('   comun al inicio:', i, 'chars; comun al final:', j, 'chars');
console.log('   ACERTAR difiere en: ...' + JSON.stringify(a.slice(Math.max(0,i-60), a.length-j+60)));
console.log('   FALLAR  difiere en: ...' + JSON.stringify(b.slice(Math.max(0,i-60), b.length-j+60)));
await browser.close();
