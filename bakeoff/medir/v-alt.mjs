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
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000});
await page.waitForTimeout(400);
await page.click('.q-opciones button:nth-of-type(1)');
await page.waitForTimeout(6000);

const info = await page.evaluate(()=>{
  const play=document.querySelector('#play');
  const r=play?play.getBoundingClientRect():null;
  const cs=play?getComputedStyle(play):null;
  const dock=document.querySelector('.dock');
  const dcs=getComputedStyle(dock);
  return {playTexto:play?play.innerText.trim():null, playDisabled:play?play.disabled:null,
    playVisible: r? (r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0):null,
    playRect: r?{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}:null,
    dockEstado:dock.dataset.estado, dockOpacity:dcs.opacity, dockVisibility:dcs.visibility, dockTransform:dcs.transform};
});
console.log('TRANSPORTE tras responder bien:', JSON.stringify(info,null,1));

console.log('\n>>> pulso #play (Seguir) en lugar de "Listo, sigamos"');
const antes = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2),p:window.__tutoria.media.paused()}));
await page.click('#play');
await page.waitForTimeout(2500);
const desp = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2),p:window.__tutoria.media.paused(),
  estado:document.querySelector('.dock').dataset.estado, dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(-220)}));
console.log('antes:',JSON.stringify(antes),'\ndespues:',JSON.stringify(desp));

// ahora: visibilidad del mensaje "Cuando quieras, seguimos." tras Listo,sigamos
await page.evaluate(()=>window.__tutoria.media.pause());
await browser.close();
