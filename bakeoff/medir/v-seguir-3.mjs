import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// 1) Cues de narracion entre 144 y 175: cuando exactamente se canta la respuesta
const cues = await page.evaluate(() => (window.__tutoriaSesion?.media?.cues||[])
  .filter(c=>c.t>=143 && c.t<=178).map(c=>({t:+c.t.toFixed(2), tipo:c.tipo||c.type, txt:(c.texto||c.text||c.es||'').toString().slice(0,120)})));
console.log('CUES 143-178:'); cues.forEach(c=>console.log('  ', JSON.stringify(c)));
const seg = await page.evaluate(() => {
  const s = window.__tutoriaSesion?.media;
  const arr = s?.subtitulos || s?.captions || s?.cues || [];
  return arr.filter(c=>c.t>=143&&c.t<=178).map(c=>({t:+(c.t||0).toFixed(2), tipo:c.tipo||c.type, t2:(c.texto||c.text||'').slice(0,130)}));
});
console.log('SUBS 143-178:'); seg.forEach(c=>console.log('  ', JSON.stringify(c)));

// 2) Seguir sin contestar, y NO contestar nunca: la pregunta sigue viva pasado cp2?
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>144', null, {timeout:15000});
await page.click('#play');
for (const meta of [150,160,175,190,196]) {
  await page.waitForFunction(`window.__tutoria.media.currentTime() >= ${meta} || window.__tutoria.media.paused()`, null, {timeout:70000});
  const s = await page.evaluate(() => ({
    t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
    dock:window.__tutoria.dock?.actual,
    enun: document.querySelector('.q-enunciado')?.textContent?.trim().slice(0,90),
    nOps: document.querySelectorAll('.q-opciones button').length,
    dis: [...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled).join(','),
  }));
  console.log('  @', JSON.stringify(s));
}
await page.screenshot({path:'v-cp2-con-cp1-viva.png'});
await browser.close();
