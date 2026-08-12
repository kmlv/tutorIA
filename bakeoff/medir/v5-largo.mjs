import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const post=[], nextResp=[];
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { const u=r.url(); if(u.includes('/api/')) post.push(r.method()+' '+u.replace(/^.*\/api/,'/api').replace(/session\/[0-9a-f]+/,'session/SID')); });
page.on('response', async r => { if(r.url().includes('/next')) { try{ nextResp.push(JSON.parse(await r.text())?.question?.id ?? 'DONE/'+(await r.text()).slice(0,80)); }catch(e){ nextResp.push('??'); } } });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1200);
await page.getByRole('button', {name:'Se vuelve más plana', exact:true}).first().click();
await page.waitForFunction(`document.querySelectorAll('.q-manip').length > 0`, null, {timeout:25000});
await page.waitForTimeout(1500);
let i=0, res='';
for (i=1; i<=60; i++) {
  res = await page.evaluate(() => {
    const ms=[...document.querySelectorAll('.q-manip')]; const l=ms[ms.length-1]; if(!l) return 'sin-manip';
    const b=[...l.querySelectorAll('button')].find(x=>/listo/i.test(x.textContent)); if(!b) return 'sin-boton';
    if(b.disabled) return 'DESHABILITADO';
    b.click(); return 'clic';
  });
  if(res!=='clic'){ console.log(`PARADA en iter ${i}: ${res}`); break; }
  await page.waitForTimeout(900);
}
const st = await page.evaluate(() => ({
  nQ: document.querySelectorAll('.q').length,
  nManip: document.querySelectorAll('.q-manip').length,
  botonesVivos: [...document.querySelectorAll('.q-manip button')].filter(b=>!b.disabled).length,
  dockState: window.__tutoria?.dock?.actual,
  alturaDock: document.querySelector('.dock')?.scrollHeight,
  ultimoEnunciado: [...document.querySelectorAll('.q-enunciado')].pop()?.textContent,
}));
console.log('iteraciones completadas:', i-1, 'estado final:', JSON.stringify(st));
console.log('ids servidos por /next:', JSON.stringify(nextResp));
console.log('POST /answer en toda la sesion:', post.filter(x=>x.includes('/answer')).length, ' /next:', post.filter(x=>x.includes('/next')).length);
await page.screenshot({path:'v5-final.png', fullPage:false});
await browser.close();
