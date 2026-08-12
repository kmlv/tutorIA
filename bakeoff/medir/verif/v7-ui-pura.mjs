import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e=>console.log(' JS ERROR:',String(e).slice(0,250)));
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const st = async ()=> await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), p:window.__tutoria.media.paused(),
  cards: [...document.querySelectorAll('.dock-body .q')].map(q=>({cls:q.className, vivos:q.querySelectorAll('button:not([disabled])').length, txt:q.textContent.trim().replace(/\s+/g,' ').slice(0,48)}))}));
await page.click('#play');
console.log('reproduciendo, contestando SOLO las predicciones (nunca los checkpoints)...');
let s;
for (let i=0;i<120;i++){
  await page.waitForTimeout(2000);
  s = await st();
  const viva = s.cards.filter(c=>c.vivos>0);
  if (s.t > 146) break;
  if (s.p && viva.length){
    // es un checkpoint? cp1 esta en 144.761
    if (s.t > 144.5){ console.log('  t='+s.t+' CHECKPOINT cp1 -> NO lo contesto, pulso "Seguir"'); break; }
    console.log('  t='+s.t+' pregunta viva -> contesto opcion 0:', viva[viva.length-1].txt);
    try { await page.locator('.dock-body .q').last().locator('.q-opcion, button').first().click({timeout:3000}); } catch(e){ console.log('   no pude:', e.message.slice(0,60)); }
    await page.waitForTimeout(1500);
    if ((await st()).p) { await page.click('#play'); }
  } else if (s.p) { await page.click('#play'); }
}
console.log('\n== A (cp1 en pantalla, sin contestar):', JSON.stringify(await st(), null, 1));
await page.screenshot({path:'verif/v7-a-cp1.png'});
console.log('\n--- SOLO UI: pulso "Seguir" sin contestar el checkpoint ---');
await page.click('#play'); await page.waitForTimeout(2500);
console.log('== B:', JSON.stringify(await st()));
for (let i=0;i<80;i++){
  await page.waitForTimeout(2000); s = await st();
  if (s.t > 196) break;
  if (s.p){ const viva=s.cards.filter(c=>c.vivos>0);
    if (s.t > 175 && s.t < 194){ console.log('  t='+s.t+' prediccion price_effect -> contesto'); try{await page.locator('.dock-body .q').last().locator('.q-opcion, button').first().click({timeout:3000});}catch{} await page.waitForTimeout(1500); }
    if ((await st()).p) await page.click('#play');
  }
}
console.log('\n== C (tras cruzar cp2 con cp1 aun sin contestar):', JSON.stringify(await st(), null, 1));
await page.screenshot({path:'verif/v7-c-cp2.png', fullPage:true});
await browser.close();
