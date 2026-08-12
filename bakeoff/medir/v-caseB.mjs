import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const t0=Date.now();
page.on('response', async r => { const u=r.url(); if(u.includes('/api/answer')||u.includes('/answer')) { let b=''; try{b=(await r.text()).slice(0,200);}catch{} console.log(`   NET +${((Date.now()-t0)/1000).toFixed(1)}s ${r.status()} ${u.split('/').slice(-1)} -> ${b}`);} });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000});
await page.waitForTimeout(500);
const dump = async(tag)=>{
  const r = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), p:window.__tutoria.media.paused(),
    dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | '),
    estado:document.querySelector('.dock').dataset.estado,
    opciones:[...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.trim()+' ['+b.className+' dis='+b.disabled+']')}));
  console.log(`--- ${tag} t=${r.t} paused=${r.p} estado=${r.estado}`);
  console.log('    DOCK: '+r.dock.slice(0,600));
  if(r.opciones.length) console.log('    OPC: '+JSON.stringify(r.opciones));
  return r;
};
await dump('checkpoint cp1');
console.log('\n>>> pulso la opcion 1 (indice 0)');
await page.click('.q-opciones button:nth-of-type(1)');
await page.waitForTimeout(1500); await dump('+1.5s');
await page.waitForTimeout(8500); await dump('+10s');
await page.waitForTimeout(20000); await dump('+30s');
await page.waitForTimeout(30000); await dump('+60s');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-casoB.png'});
await browser.close();
