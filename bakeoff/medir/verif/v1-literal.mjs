import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});

const snap = async (tag)=>{ const s= await page.evaluate(()=>{
  const cards = Array.from(document.querySelectorAll('.dock-body .pregunta, .dock .pregunta, .q'));
  return {
    t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
    dock: JSON.stringify(window.__tutoria.dock?.actual)?.slice(0,200),
    nCards: cards.length,
    cards: cards.map(p=>({
      txt: p.textContent.trim().replace(/\s+/g,' ').slice(0,110),
      viva: !!p.querySelector('button:not([disabled]), input:not([disabled])'),
      nBtnActivos: p.querySelectorAll('button:not([disabled])').length,
      cls: p.className,
    })),
  };
}); console.log('\n== '+tag); console.log(JSON.stringify(s,null,1)); return s; };

// PASO 2
await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
await page.waitForSelector('.dock-body .pregunta .q-opcion', {timeout:20000});
await page.waitForTimeout(1500);
await snap('P1: primera mcq de practica abierta');
await page.screenshot({path:'verif/v1-a-mcq.png'});

// PASO 3: contestar la primera mcq (opcion 0)
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click();
await page.waitForTimeout(2500);
await snap('P2: tras contestar la mcq');
await page.screenshot({path:'verif/v1-b-tras-contestar.png'});

// si no salio la de arrastrar, contestar mas
for (let i=0;i<3;i++){
  const hayManip = await page.locator('.q-manip').count();
  if (hayManip>0) break;
  const opts = page.locator('.dock-body .pregunta').last().locator('.q-opcion');
  if (await opts.count() === 0) break;
  await opts.nth(0).click(); await page.waitForTimeout(2500);
  await snap('P2.'+i+': tras contestar otra');
}
await snap('P3: estado con la pregunta de arrastrar (esperado)');
await page.screenshot({path:'verif/v1-c-manip.png'});

// PASO 4: seek 142 + play, cruzar 144.761
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(142); m.play();});
await page.waitForTimeout(9000);
await snap('P4: tras cruzar cp1 (t~151)');
await page.screenshot({path:'verif/v1-d-tras-cp1.png', fullPage:false});
await page.screenshot({path:'verif/v1-d-tras-cp1-full.png', fullPage:true});
await browser.close();
