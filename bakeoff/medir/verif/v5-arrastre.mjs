import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/answer')){let b=null;try{b=(await r.text()).slice(0,300);}catch{} net.push(b);}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .q .q-opcion',{timeout:20000});
await page.waitForTimeout(1200);
await page.locator('.dock-body .q').last().locator('.q-opcion').nth(0).click();
await page.waitForSelector('.q-manip',{timeout:15000});
await page.waitForTimeout(1500);

const tirs = async ()=> await page.evaluate(()=>[...document.querySelectorAll('.capa-manip .tirador')].map(t=>({cx:+t.getAttribute('cx'), cy:+t.getAttribute('cy')})));
const map = await page.evaluate(()=>{const svg=document.querySelector('svg.bgraph'); const m=svg.getScreenCTM(); return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,pasos=14){ await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){ await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);} await page.mouse.up(); await page.waitForTimeout(120);}

console.log('tiradores antes:', JSON.stringify(await tirs()));
// el alumno arrastra: sube el intercepto de x2 (100 -> 150) y el de x1 (33.3 -> 50)
const t0 = await tirs(); const hY=t0.find(t=>t.cy<300)||t0[0]; const hX=t0.find(t=>t.cy>300)||t0[1];
// mover el tirador Y hacia arriba y el X hacia la derecha (aprox, solo para dejar huella)
await drag(S(hY.cx,hY.cy), S(hY.cx, hY.cy-95));
await drag(S(hX.cx,hX.cy), S(hX.cx+90, hX.cy));
console.log('tiradores tras arrastrar:', JSON.stringify(await tirs()));
console.log('estado tras arrastrar:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())).slice(0,200));
await page.screenshot({path:'verif/v5-a-arrastrado.png'});

console.log('\n--- ahora cruza cp1 ---');
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(142); m.play();});
await page.waitForTimeout(9000);
console.log('tiradores tras cp1:', JSON.stringify(await tirs()));
console.log('estado tras cp1:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())).slice(0,200));
await page.screenshot({path:'verif/v5-b-tras-cp1.png'});
console.log('\n--- el alumno pulsa Listo (creia haber contestado bien) ---');
await page.locator('.q-manip button:not([disabled])').first().click();
await page.waitForTimeout(3000);
console.log('veredictos /answer:', JSON.stringify(net));
await page.screenshot({path:'verif/v5-c-listo.png', fullPage:true});
await browser.close();
