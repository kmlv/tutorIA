import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const texto = process.argv[2] || 'cualquier cosa';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const t0 = Date.now();
page.on('response', async r => { const u=r.url(); if(u.includes('/api/')||u.includes(':8')) { let b=''; try{b=(await r.text()).slice(0,220);}catch{} console.log(`   NET +${((Date.now()-t0)/1000).toFixed(1)}s ${r.status()} ${u.replace('http://localhost:57330','')} -> ${b}`);} });
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000});
await page.waitForTimeout(500);
const dump = async(tag)=>{
  const r = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), p:window.__tutoria.media.paused(),
    dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | '),
    estado:document.querySelector('.dock').dataset.estado,
    hayQ:!!document.querySelector('.q'), hayTextarea:!!document.querySelector('.q-textarea')}));
  console.log(`--- ${tag} t=${r.t} paused=${r.p} dock-estado=${r.estado} q=${r.hayQ}`);
  console.log('    DOCK: '+r.dock.slice(0,700));
  return r;
};
await dump('checkpoint');
console.log(`\n>>> escribo "${texto}" en .q-textarea y pulso Responder`);
await page.fill('.q-textarea', texto);
await page.click('.q-form button[type=submit]');
await page.waitForTimeout(2000); await dump('+2s');
await page.waitForTimeout(8000); await dump('+10s');
await page.waitForTimeout(20000); await dump('+30s');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-casoA3.png'});
await browser.close();
