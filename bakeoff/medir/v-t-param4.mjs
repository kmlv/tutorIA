import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const snap = `(() => { const cap=document.querySelector('.captions-band');
  return { ct:+window.__tutoria.media.currentTime().toFixed(1),
    mostrar: window.__tutoria.estado().mostrar, destacar: window.__tutoria.estado().destacar,
    caption: cap? cap.innerText.split('\\n')[0].slice(0,55):null }; })()`;

async function abrir(url){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,180)));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
  await page.waitForTimeout(2000);
  await page.click('#play');
  return {ctx, page};
}
const bug = await abrir('http://localhost:57330/?lang=es&t=144');   // enlace al checkpoint
const ctl = await abrir('http://localhost:57330/?lang=es');          // control limpio
for (let i=0;i<5;i++){
  await bug.page.waitForTimeout(7000);
  const b = await bug.page.evaluate(snap), c = await ctl.page.evaluate(snap);
  console.log(`audio ~${b.ct}s`);
  console.log('   ?t=144 :', JSON.stringify(b.mostrar), 'destacar=',b.destacar, '| cc:', b.caption);
  console.log('   control:', JSON.stringify(c.mostrar), 'destacar=',c.destacar, '| cc:', c.caption);
}
await bug.page.screenshot({path:'vt-mismatch-t144.png'});
await ctl.page.screenshot({path:'vt-mismatch-control.png'});
console.log('capturas: vt-mismatch-t144.png / vt-mismatch-control.png');
await browser.close();
