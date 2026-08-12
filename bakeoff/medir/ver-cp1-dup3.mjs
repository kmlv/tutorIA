import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// --- reproducción exacta de los pasos del informe
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction(()=>document.querySelectorAll('.q').length>0,null,{timeout:20000});
await page.waitForTimeout(900);
await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click());
await page.waitForTimeout(700);
await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/listo, sigamos/i.test(b.textContent)).click());
await page.waitForTimeout(900);
await page.evaluate(() => { window.__tutoria.media.seek(141); window.__tutoria.media.play(); });
await page.waitForFunction(()=>document.querySelectorAll('.q').length>1,null,{timeout:20000});
await page.waitForTimeout(1200);

const g = await page.evaluate(() => {
  const qs=[...document.querySelectorAll('.q')];
  const dock=document.querySelector('.dock');
  const inView = el => { const r=el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  return {
    scrollY: Math.round(scrollY), bodyScrollH: Math.round(document.documentElement.scrollHeight), vh: innerHeight,
    dockScrollTop: dock?Math.round(dock.scrollTop):null, dockScrollH: dock?Math.round(dock.scrollHeight):null, dockClientH: dock?Math.round(dock.clientHeight):null,
    cards: qs.map((q,i)=>{const r=q.getBoundingClientRect();return {i, top:Math.round(r.top), bot:Math.round(r.bottom), visible:inView(q), viva:[...q.querySelectorAll('button')].some(b=>!b.disabled)};}),
    chipsListo: [...document.querySelectorAll('button')].filter(b=>/listo, sigamos/i.test(b.textContent)).length,
    chipsNoEntiendo: [...document.querySelectorAll('button')].filter(b=>/no entiendo/i.test(b.textContent)).length,
    activeEl: document.activeElement?.tagName+':'+(document.activeElement?.textContent||'').trim().slice(0,25),
    captions: (document.querySelector('.captions-band')?.innerText||'').trim().slice(0,120),
  };
});
console.log('=== ESCENARIO EXACTO DEL INFORME (2 tarjetas) ===');
console.log(JSON.stringify(g,null,1));
await page.screenshot({path:'v-dup-viewport.png'});
// zoom a las dos tarjetas
const box = await page.evaluate(()=>{const qs=[...document.querySelectorAll('.q')];const a=qs[0].getBoundingClientRect(),b=qs[1].getBoundingClientRect();return {x:Math.round(a.left),y:Math.round(a.top+scrollY),w:Math.round(a.width),h:Math.round(b.bottom+scrollY-(a.top+scrollY))};});
await page.screenshot({path:'v-dup-dos-tarjetas.png', clip:{x:box.x,y:box.y,width:box.w,height:Math.min(box.h,3000)}, fullPage:true});
console.log('clip', JSON.stringify(box));

// --- ¿pasa TAMBIÉN sin contestar? carga limpia nueva
const p2 = await ctx.newPage();
p2.on('pageerror', e => console.log('  JS ERROR p2:', String(e).slice(0,160)));
await p2.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await p2.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await p2.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await p2.waitForFunction(()=>document.querySelectorAll('.q').length>0,null,{timeout:20000});
await p2.waitForTimeout(800);
console.log('\n=== SIN CONTESTAR: q antes de rebobinar =', await p2.evaluate(()=>document.querySelectorAll('.q').length));
await p2.evaluate(() => { window.__tutoria.media.seek(141); window.__tutoria.media.play(); });
await p2.waitForTimeout(6000);
console.log('=== SIN CONTESTAR: tras recruzar 144.76  q =', await p2.evaluate(()=>document.querySelectorAll('.q').length),
  ' botones=', await p2.evaluate(()=>document.querySelectorAll('.q-opciones button').length),
  ' t=', await p2.evaluate(()=>+window.__tutoria.media.currentTime().toFixed(2)),
  ' paused=', await p2.evaluate(()=>window.__tutoria.media.paused()));
await browser.close();
