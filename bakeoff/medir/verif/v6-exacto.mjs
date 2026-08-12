import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const CP = process.argv[2] === 'cp';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/answer')){let b=null;try{b=(await r.text()).slice(0,200);}catch{} net.push(b);}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .q .q-opcion',{timeout:20000});
await page.waitForTimeout(1200);
await page.locator('.dock-body .q').last().locator('.q-opcion').nth(0).click();
await page.waitForSelector('.q-manip',{timeout:15000}); await page.waitForTimeout(1500);
const tirs = async ()=> await page.evaluate(()=>[...document.querySelectorAll('.capa-manip .tirador')].map(t=>({cx:+t.getAttribute('cx'), cy:+t.getAttribute('cy')})));
const map = await page.evaluate(()=>{const svg=document.querySelector('svg.bgraph'); const m=svg.getScreenCTM(); return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,pasos=16){ await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){ await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);} await page.mouse.up(); await page.waitForTimeout(150);}
const t0=await tirs(); const hY=t0.find(t=>t.cy<300), hX=t0.find(t=>t.cy>300);
const ux=(hX.cx-hY.cx)/(100/3), uy=(hX.cy-hY.cy)/100;   // px por unidad
await drag(S(hY.cx,hY.cy), S(hY.cx, hX.cy-150*uy));      // x2 intercepto -> 150
await drag(S(hX.cx,hX.cy), S(hY.cx+50*ux, hX.cy));       // x1 intercepto -> 50
console.log('tiradores tras arrastre exacto:', JSON.stringify(await tirs()));
console.log('rotulos:', await page.evaluate(()=>[...document.querySelectorAll('svg.bgraph text')].map(t=>t.textContent.trim()).filter(x=>/^\d/.test(x))));
if (CP) { console.log('--- cruzando cp1 ---'); await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(142);m.play();}); await page.waitForTimeout(9000);
  console.log('tiradores tras cp1:', JSON.stringify(await tirs()));
  console.log('rotulos tras cp1:', await page.evaluate(()=>[...document.querySelectorAll('svg.bgraph text')].map(t=>t.textContent.trim()).filter(x=>/^\d/.test(x)))); }
await page.locator('.q-manip button:not([disabled])').first().click();
await page.waitForTimeout(3000);
console.log(CP?'CON checkpoint':'SIN checkpoint', '-> veredictos:', JSON.stringify(net));
await page.screenshot({path: CP?'verif/v6-cp.png':'verif/v6-limpio.png'});
await browser.close();
