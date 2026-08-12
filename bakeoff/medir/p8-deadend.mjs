import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
// Real student path: es + B -> click English
await page.goto('http://localhost:57330/?lang=es&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate('window.__tutoria.media.seek(60); window.__tutoria.media.play()');
await page.waitForTimeout(2500);
console.log('antes:', await page.evaluate(`({t:+window.__tutoria.media.currentTime().toFixed(1), href:document.querySelector('.idioma').getAttribute('href'), txt:document.querySelector('.idioma').textContent})`));
await page.click('.idioma');
await page.waitForTimeout(4000);
console.log('URL tras clic:', page.url());
// Try everything a student could press
for (const sel of ['#play','#ask']) {
  const el = await page.$(sel);
  if (!el) { console.log(sel,'-> no existe'); continue; }
  await el.click().catch(e=>console.log(sel,'click err',e.message));
  await page.waitForTimeout(1500);
  console.log(sel, 'clic ->', await page.evaluate(`({playTxt:(document.querySelector('#play')||{}).textContent, dockEstado:(document.querySelector('.dock')||{}).getAttribute?document.querySelector('.dock').getAttribute('data-estado'):null, reloj:(document.querySelector('.reloj')||document.querySelector('.tiempo')||{}).textContent, bodyTail:document.body.innerText.slice(-160).replace(/\\n+/g,' | ')})`));
}
// composer
const ci = await page.$('.composer-input');
console.log('composer-input existe:', !!ci);
if (ci) { await ci.fill('¿por qué?'); const b = await page.$('.composer-enviar'); if (b) { await b.click(); await page.waitForTimeout(3000); }
  console.log('tras enviar:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n+/g,' | ').slice(-300)); }
await page.screenshot({path:SP+'/deadend-en-B.png', fullPage:false});
console.log('video rect/bg:', await page.evaluate(`(()=>{const v=document.querySelector('video'); if(!v) return null; const r=v.getBoundingClientRect(); return {w:r.width,h:r.height,src:v.currentSrc,err:v.error&&v.error.code, disp:getComputedStyle(v).display}})()`));
await browser.close();
