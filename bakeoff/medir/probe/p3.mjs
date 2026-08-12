import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync(new URL('./key.json', import.meta.url), 'utf8'));
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,200)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,600);}catch{} net.push({u:u.split('/').pop(),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});

const bands = ()=>page.evaluate(()=>({
  bands: document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ') || null,
  estado: window.__tutoria.estado(),
  intercepts: Array.from(document.querySelectorAll('.capa-interceptos text')).map(t=>t.textContent),
  ariaSvg: document.querySelector('.bgraph')?.getAttribute('aria-label'),
}));
async function press(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(100); }

// 1) responder bien la primera mcq para llegar al manip de ingreso
await page.waitForSelector('.dock-body .pregunta .q-opcion');
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click();
await page.waitForFunction(()=>document.querySelector('.dock-body .pregunta:last-child .q-manip'),null,{timeout:15000});
await page.waitForTimeout(600);
console.log('--- EN LA PREGUNTA MANIP DE INGRESO (antes de tocar) ---');
console.log(JSON.stringify(await bands(),null,1));
await page.screenshot({path:'probe/manip-antes.png'});
await press('ArrowUp',50); await press('ArrowRight',17);
console.log('--- TRAS CONSTRUIR LA RECTA CORRECTA (y=150, x=50) ---');
console.log(JSON.stringify(await bands(),null,1));
await page.screenshot({path:'probe/manip-despues.png'});
await page.locator('.dock-body .pregunta').last().locator('button.primario').click();
await page.waitForTimeout(1500);
console.log('respuesta manip:', net.filter(n=>n.u==='answer').slice(-1)[0]?.b);
console.log('--- TRAS ENVIAR ---'); console.log(JSON.stringify(await bands(),null,1));
await page.screenshot({path:'probe/manip-tras-enviar.png'});
await browser.close();
