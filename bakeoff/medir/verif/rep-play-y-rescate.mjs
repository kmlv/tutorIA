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
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif';
const snap = async (label) => {
  const s = await page.evaluate(() => {
    const opt = document.querySelector('.q-opciones button');
    const r=(el)=>{if(!el)return null;const b=el.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};};
    const dentro=(el)=>{if(!el)return null;const b=el.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth&&b.width>0&&b.height>0;};
    return {t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
      dock:window.__tutoria.dock.actual, qPresente:!!document.querySelector('.q'),
      opcionRect:r(opt), opcionVisible:dentro(opt),
      scrollH:document.documentElement.scrollHeight, scrollW:document.documentElement.scrollWidth,
      dockMsgs:[...document.querySelectorAll('.dock-body .msg')].map(m=>m.textContent.trim().slice(0,50))};
  });
  console.log('== '+label+' == '+JSON.stringify(s));
  if (label) await page.screenshot({path:`${OUT}/${label}.png`});
  return s;
};
const llegarAPractica = async () => {
  await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
  const dur = await page.evaluate(()=>window.__tutoria.media.duration());
  await page.evaluate((dur)=>{window.__tutoria.media.seek(dur-1.2); return window.__tutoria.media.play();},dur);
  await page.waitForSelector('.q',{timeout:30000});
  await page.waitForTimeout(1200);
};

console.log('### CASO B: boton "Seguir" del reproductor ###');
await llegarAPractica();
await snap('10-B-antes');
console.log('texto del boton play:', await page.locator('#play').textContent());
await page.locator('#play').click();
await page.waitForTimeout(2500);
await snap('11-B-tras-seguir');

console.log('### CASO C: intentos de rescate tras "Listo, sigamos" ###');
await llegarAPractica();
await page.locator('.dock-acciones button', {hasText:'Listo, sigamos'}).click();
await page.waitForTimeout(2000);
await snap('20-C-roto');
// rescate 1: scroll hasta abajo del documento
await page.evaluate(()=>window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(400);
await snap('21-C-scroll');
// rescate 2: pulsar Preguntar (#ask)
await page.evaluate(()=>window.scrollTo(0,0));
await page.locator('#ask').click();
await page.waitForTimeout(1200);
await snap('22-C-tras-ask');
// intentar responder la pregunta ahora
const puede = await page.evaluate(async ()=>{
  const b=document.querySelector('.q-opciones button'); if(!b) return 'sin boton';
  const r=b.getBoundingClientRect();
  return {rect:{x:Math.round(r.x),y:Math.round(r.y)}, dentroViewport: r.x<innerWidth && r.y<innerHeight};
});
console.log('opcion tras ask:', JSON.stringify(puede));
await browser.close();
