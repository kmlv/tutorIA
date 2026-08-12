import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
page.on('dialog', async dl=>{console.log('  DIALOG', dl.message()); await dl.dismiss();});
// A) href en la pagina rota en+B
await page.goto('http://localhost:57330/?lang=en&variant=B&t=90',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3000);
console.log('en+B roto -> idioma href:', await page.evaluate(`document.querySelector('.idioma').getAttribute('href')`), 'texto:', await page.evaluate(`document.querySelector('.idioma').textContent`));

// B) cambio de idioma DURANTE la practica (variante A)
await page.goto('http://localhost:57330/?lang=es&variant=A',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate('window.__tutoria.media.seek(229); window.__tutoria.media.play()');
await page.waitForTimeout(9000);
const rd = async tag => console.log(tag, JSON.stringify(await page.evaluate(`(()=>{const qs=[...document.querySelectorAll('.q')];return{
 url:location.search, t:+window.__tutoria.media.currentTime().toFixed(1), dock:window.__tutoria.dock.actual,
 nQ:qs.length, resp:qs.filter(q=>q.querySelector('.elegida')).length, sess:window.__tutoriaSesion.session_id,
 href:document.querySelector('.idioma').getAttribute('href'),
 dockTail:document.querySelector('.dock').innerText.replace(/\\n+/g,' | ').slice(-200)}})()`)));
await rd('practica  ');
// responder 2 items de practica
for (let i=0;i<2;i++){
  const qq = await page.$$('.q'); const l = qq[qq.length-1]; const b = await l.$$('.q-opciones button:not([disabled])');
  if(!b.length) break; await b[0].click(); await page.waitForTimeout(3000);
}
await rd('2 resptas ');
await page.click('.idioma');
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(2000);
await rd('tras idioma');
await browser.close();
