import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = () => page.evaluate(() => {
  const band = document.querySelector('.captions-band');
  // linea de subtitulo: primer nodo de texto/hijo que no sea boton ni transcripcion
  let cap = '';
  if (band) {
    const cl = band.querySelector('.caption-linea, .caption-texto, .captions-linea, p, span');
    cap = (cl?.textContent||'').trim();
    if (!cap) cap = (band.firstChild?.textContent||'').trim();
  }
  return {
    t: +window.__tutoria.media.currentTime().toFixed(2),
    paused: window.__tutoria.media.paused(),
    dock: window.__tutoria.dock?.actual,
    qVis: !!document.querySelector('.q'),
    ops: [...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled),
    playTxt: document.querySelector('#play')?.textContent?.trim(),
    cap: cap.slice(0,240),
  };
});

await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime() > 144', null, {timeout:15000});
console.log('A) parada en cp1:', JSON.stringify(await snap()));

// PASO 3: pulsar 'Seguir' del reproductor SIN contestar
await page.click('#play');
await page.waitForTimeout(800);
console.log('B) justo tras Seguir:', JSON.stringify(await snap()));

// PASO 4: dejar correr ~15s, muestreando el subtitulo
for (let i=0;i<8;i++){
  await page.waitForTimeout(2000);
  const s = await snap();
  console.log(`   t=${s.t} paused=${s.paused} dock=${s.dock} q=${s.qVis} ops=${JSON.stringify(s.ops)} | ${s.cap}`);
}
await page.screenshot({path:'v-tras15s.png'});

// PASO 5: pulsar opcion 1
const antes = await snap();
console.log('C) antes de pulsar opcion1:', JSON.stringify(antes));
await page.click('.q-opciones button:nth-of-type(1)').catch(async()=>{
  await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[0].click());
});
await page.waitForTimeout(2500);
const dockTxt = await page.evaluate(()=>document.querySelector('.dock')?.innerText?.trim().slice(0,500));
console.log('D) tras opcion1:', JSON.stringify(await snap()));
console.log('DOCK TEXTO:\n', dockTxt);
await page.screenshot({path:'v-tras-opcion1.png'});
await browser.close();
