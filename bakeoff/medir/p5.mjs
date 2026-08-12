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
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:',m.text().slice(0,250)); });
page.on('response', r => { if(!r.url().includes('.mp3')&&!r.url().match(/\.(js|css|ts|svg|png|woff2?)($|\?)/)) console.log('  NET',r.status(),r.request().method(),r.url().slice(0,120)); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
await page.click('#play'); await page.waitForTimeout(3000);
console.log('== clic en ✋ Preguntar ==');
await page.click('#ask'); await page.waitForTimeout(1200);
console.log('dock:', await page.evaluate(()=>window.__tutoria.dock.actual), 'paused:', await page.evaluate(()=>window.__tutoria.media.paused()));
await page.screenshot({path:OUT+'/p5-ask1.png'});
console.log('body:', (await page.evaluate(()=>document.body.innerText)).replace(/\n/g,' | ').slice(0,700));
console.log('== escribir una pregunta y enviar ==');
await page.fill('.composer-input', '¿Por qué la pendiente es negativa?');
await page.screenshot({path:OUT+'/p5-ask2.png'});
const t0=Date.now();
await page.click('.composer-enviar');
for(let i=0;i<12;i++){
  await page.waitForTimeout(1500);
  const s = await page.evaluate(()=>{
    const d=document.querySelector('.dock');
    return {dock:window.__tutoria.dock.actual, paused:window.__tutoria.media.paused(), cur:+window.__tutoria.media.currentTime().toFixed(1),
      txt:(d?.innerText||'').replace(/\n/g,' | ').slice(0,600)};});
  console.log(Math.round((Date.now()-t0)/1000)+'s', JSON.stringify(s));
  if(i===2||i===11) await page.screenshot({path:OUT+`/p5-ask-resp${i}.png`});
}
await browser.close();
