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
const rate = await page.evaluate(()=>{ const m=window.__tutoria.media; const a=m.audio||m.video; if(a){a.playbackRate=6; return (a.tagName||'?')+' rate '+a.playbackRate;} return 'sin elemento media'; });
console.log('  ', rate, '| SIN NINGUN SEEK, play() desde t=0');
await page.evaluate(()=> window.__tutoria.media.play());
const leer = () => page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(2),
  p1:(document.querySelector('.card[data-good="g1"] .price')||{}).textContent,
  comp: !!document.querySelector('.ledger.compact'),
  eq:((document.querySelector('.eq-slot')||{}).innerText||'').replace(/\n/g,' ')}));
let a=false,b=false;
for(let i=0;i<1200;i++){
  await page.waitForTimeout(250);
  const s = await leer();
  if(!a && s.t>200 && s.t<206.5){a=true; console.log('  ANTES  ', JSON.stringify(s));}
  if(!b && s.t>207.5){b=true; console.log('  DESPUES', JSON.stringify(s)); break;}
  if(s.t>225) break;
}
await page.evaluate(()=> window.__tutoria.media.pause());
await browser.close();
