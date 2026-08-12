import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const V=process.argv[2]||'B';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });

const snap = `(()=>{const v=document.querySelector('video');const q=document.querySelector('.q');
 const r=q?q.getBoundingClientRect():null; const pl=document.querySelector('#play');
 return {t:+window.__tutoria.media.currentTime().toFixed(2), dur:+window.__tutoria.media.duration().toFixed(1),
  paused:window.__tutoria.media.paused(), owns:window.__tutoria.media.ownsStage,
  playTxt:pl?pl.textContent.trim():null, playDisabled:pl?pl.disabled:null,
  video: v? getComputedStyle(v).display : 'NO-VIDEO-EL',
  videoRect: v? [Math.round(v.getBoundingClientRect().width),Math.round(v.getBoundingClientRect().height)]:null,
  lienzo: getComputedStyle(document.querySelector('.lienzo')).display,
  nQ: document.querySelectorAll('.q').length,
  qRect: r?[Math.round(r.width),Math.round(r.height)]:null,
  qText: q? q.innerText.replace(/\\s+/g,' ').slice(0,90):null,
  dock: window.__tutoria.dock.actual,
  dockTxt: (document.querySelector('.dock')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,120)}})()`;
const rd = async tag => console.log(tag.padEnd(16), JSON.stringify(await page.evaluate(snap)));

console.log('=== VARIANTE', V, '=== carga limpia');
await page.goto(`http://localhost:57330/?lang=es&variant=${V}&t=228`,{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(600);
await rd('tras carga');
// PASO 2: pulsar "Empezar"
const bt = await page.evaluate(`(document.querySelector('#play')||{}).textContent`);
console.log('  boton reproductor dice:', JSON.stringify(bt));
await page.click('#play');
await page.waitForTimeout(1500);
await rd('tras Empezar');
// esperar a que termine la narracion
await page.waitForFunction(`window.__tutoria.media.paused() || window.__tutoria.media.currentTime()>=window.__tutoria.media.duration()-0.15`,null,{timeout:40000}).catch(()=>console.log('  (timeout esperando fin)'));
await page.waitForTimeout(2500);
await rd('fin narracion');
await page.screenshot({path:`${SP}/V-${V}-1-practica.png`});
// PASO 3: pulsar el boton que dice "Seguir"
const b2 = await page.evaluate(`(()=>{const p=document.querySelector('#play');return {txt:p.textContent.trim(),dis:p.disabled}})()`);
console.log('  PASO 3 -> boton:', JSON.stringify(b2));
await page.click('#play');
await page.waitForTimeout(300); await rd('+0.3s');
await page.waitForTimeout(2700); await rd('+3s');
await page.screenshot({path:`${SP}/V-${V}-2-tras-seguir.png`});
// intentar recuperar con "Preguntar"
const ask = await page.evaluate(`(()=>{const a=document.querySelector('#ask');return a?{txt:a.textContent.trim(),dis:a.disabled}:null})()`);
console.log('  #ask:', JSON.stringify(ask));
if(ask){ await page.click('#ask'); await page.waitForTimeout(1200); await rd('tras Preguntar'); 
  await page.screenshot({path:`${SP}/V-${V}-3-tras-ask.png`}); }
await browser.close();
