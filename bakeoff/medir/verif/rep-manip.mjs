import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(),'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath:exe,args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log('  JS ERROR:',String(e).slice(0,200)));
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif';
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const dur = await page.evaluate(()=>window.__tutoria.media.duration());
await page.evaluate(d=>{window.__tutoria.media.seek(d-1.2);return window.__tutoria.media.play();},dur);
await page.waitForSelector('.q',{timeout:30000});
// contestar items hasta encontrar uno de manipulacion
for (let i=0;i<8;i++){
  await page.waitForTimeout(900);
  const st = await page.evaluate(()=>({manip:!!document.querySelector('.q-manip'),
    op:document.querySelectorAll('.q-opciones button').length,
    txt:(document.querySelectorAll('.q-enunciado')[document.querySelectorAll('.q-enunciado').length-1]?.textContent||'').trim().slice(0,60)}));
  console.log(i, JSON.stringify(st));
  if (st.manip) break;
  if (st.op===0) { console.log('sin opciones, paro'); break; }
  await page.locator('.q-opciones button').last().click({timeout:5000}).catch(e=>console.log('click fail',e.message));
}
const antes = await page.evaluate(()=>({manip:!!document.querySelector('.q-manip'),
  grafico:window.__tutoria.estado(), enun:[...document.querySelectorAll('.q-enunciado')].map(e=>e.textContent.trim().slice(0,60))}));
console.log('ANTES:', JSON.stringify(antes).slice(0,600));
await page.screenshot({path:`${OUT}/40-manip-antes.png`});
if (antes.manip){
  const box = await page.locator('.lienzo').boundingBox();
  if (box){ await page.mouse.click(box.x+box.width*0.35, box.y+box.height*0.4);
            await page.mouse.click(box.x+box.width*0.65, box.y+box.height*0.7); }
  await page.waitForTimeout(600);
  console.log('grafico tras trazar:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())).slice(0,400));
  await page.screenshot({path:`${OUT}/41-manip-trazado.png`});
  await page.locator('.dock-acciones button',{hasText:'Listo, sigamos'}).click();
  await page.waitForTimeout(2500);
  console.log('DESPUES:', JSON.stringify(await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(1),
    dock:window.__tutoria.dock.actual, grafico:window.__tutoria.estado(),
    manipEnDom:!!document.querySelector('.q-manip'),
    scrollH:document.documentElement.scrollHeight}))).slice(0,600));
  await page.screenshot({path:`${OUT}/42-manip-tras-listo.png`});
}
await browser.close();
