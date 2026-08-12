import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/shots';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:',m.text().slice(0,200)); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const snap = async (tag)=> {
  const s = await page.evaluate(()=>{
    const t=window.__tutoria;
    const q=document.querySelector('.q');
    return {cur:+t.media.currentTime().toFixed(2), paused:t.media.paused(), dock:t.dock&&t.dock.actual,
      play:document.querySelector('#play')?.innerText, ask:document.querySelector('#ask')?.innerText,
      cap:(document.querySelector('.captions-band')?.innerText||'').replace(/\n/g,' ').slice(0,110),
      est:JSON.stringify(t.estado().mostrar)+' enf='+t.estado().enfasis+' dest='+t.estado().destacar,
      q: q? {vis:getComputedStyle(q).display, txt:q.innerText.replace(/\n/g,' | ').slice(0,200)} : null};
  });
  console.log(tag, JSON.stringify(s));
  return s;
};
console.log('== antes de pulsar Empezar =='); await snap('t?');
await page.click('#play');
const t0=Date.now();
for(let i=0;i<31;i++){
  await page.waitForTimeout(2000);
  const s=await snap(String(Math.round((Date.now()-t0)/1000))+'s');
  if(i%5===0) await page.screenshot({path:OUT+`/p2-${String(i).padStart(2,'0')}.png`});
}
await page.screenshot({path:OUT+'/p2-fin60.png'});
await browser.close();
