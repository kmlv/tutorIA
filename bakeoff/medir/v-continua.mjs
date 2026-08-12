import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(600);

// estilo de la opcion elegida vs otra
const est = await page.evaluate(()=>{
  const bs=[...document.querySelectorAll('.q-opciones button')];
  return bs.map(b=>{const c=getComputedStyle(b);return {t:b.textContent.trim().slice(0,30),cls:b.className,bg:c.backgroundColor,bd:c.borderColor,col:c.color,op:c.opacity};});
});
console.log('ESTILOS ANTES:', JSON.stringify(est,null,1));

const o = await page.$$('.q-opciones button'); await o[1].click(); await page.waitForTimeout(1500);
const est2 = await page.evaluate(()=>{
  const bs=[...document.querySelectorAll('.q-opciones button')];
  return bs.map(b=>{const c=getComputedStyle(b);return {t:b.textContent.trim().slice(0,30),cls:b.className,bg:c.backgroundColor,bd:c.borderColor,col:c.color,op:c.opacity};});
});
console.log('ESTILOS DESPUES:', JSON.stringify(est2,null,1));

// Listo, sigamos y seguir la narracion
await (await page.$('.dock button:has-text("Listo, sigamos")')).click();
await page.waitForTimeout(500);
console.log('tras listo: t=',await page.evaluate('window.__tutoria.media.currentTime()'),'paused=',await page.evaluate('window.__tutoria.media.paused()'));
for (let i=0;i<8;i++){
  await page.waitForTimeout(2500);
  const s = await page.evaluate(()=>({t:window.__tutoria.media.currentTime(),
    cap:document.querySelector('.captions-band')?.innerText.trim().slice(0,160),
    q:!!document.querySelector('.q')}));
  console.log(`  t=${s.t.toFixed(2)} qVisible=${s.q} cap="${s.cap}"`);
}
await page.screenshot({path:OUT+'/v5-tras-narrar.png'});
console.log('ERRS',errs);
await browser.close();
