import {abrir, hastaManip, qInfo, msgs} from './manip-lib.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const red=[];
page.on('request', r => { if (r.url().includes('/answer')) red.push({u:r.url().replace(/^.*\/api/,'/api'), body:r.postData()}); });
page.on('response', async r => { if (r.url().includes('/answer')) { try{red.push({resp:'answer', t:await r.text()});}catch{} }});
await page.goto('http://localhost:57330/?lang=es&t=180', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(600);
const lee = async ()=> await page.evaluate(()=>({
  aria: document.querySelector('svg.bgraph').getAttribute('aria-label'),
  bands: document.querySelector('.bands').innerText.replace(/\n+/g,' | '),
  estado: window.__tutoria.estado(),
  t: window.__tutoria.media.currentTime(),
}));
console.log('T180 AL CARGAR:', JSON.stringify(await lee(), null, 1));
const m = await hastaManip(page);
console.log('T180 MANIP:', m && m.enun);
console.log('T180 EN EL MANIP (antes de arrastrar):', JSON.stringify(await lee(), null, 1));
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,pasos=14){
  await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
// leer posiciones reales de los tiradores
const tir = await page.evaluate(()=>[...document.querySelectorAll('svg.bgraph .capa-manip .tirador')].map(t=>[+t.getAttribute('cx'),+t.getAttribute('cy')]));
console.log('TIRADORES', JSON.stringify(tir));
await drag(S(tir[0][0],tir[0][1]), S(502.6,396));
const tir2 = await page.evaluate(()=>[...document.querySelectorAll('svg.bgraph .capa-manip .tirador')].map(t=>[+t.getAttribute('cx'),+t.getAttribute('cy')]));
await drag(S(tir2[1][0],tir2[1][1]), S(62,56.6));
await page.waitForTimeout(200);
console.log('T180 TRAS RESOLVER:', JSON.stringify(await lee(), null, 1));
await page.screenshot({path:SP+'t180-resuelto.png'});
await page.click('.dock .pregunta:last-child button');
await page.waitForTimeout(1800);
console.log('T180 RED:', JSON.stringify(red, null, 1));
console.log('T180 MSGS:', JSON.stringify((await msgs(page)).slice(-3)));
console.log('T180 FINAL:', JSON.stringify(await lee(), null, 1));
await page.screenshot({path:SP+'t180-final.png'});
await browser.close();
