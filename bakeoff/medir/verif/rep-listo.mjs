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
const OUT = '/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif';

const snap = async (label) => {
  const s = await page.evaluate(() => {
    const q = document.querySelector('.q');
    const opt = document.querySelector('.q-opciones button');
    const manip = document.querySelector('.q-manip');
    const r = (el) => { if(!el) return null; const b = el.getBoundingClientRect();
      return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}; };
    const dentro = (el) => { if(!el) return null; const b = el.getBoundingClientRect();
      return b.top>=0 && b.bottom<=innerHeight && b.left>=0 && b.right<=innerWidth && b.width>0 && b.height>0; };
    return {
      t: +window.__tutoria.media.currentTime().toFixed(2),
      paused: window.__tutoria.media.paused(),
      dock: window.__tutoria.dock.actual,
      dockDataset: document.body.dataset.dock,
      qPresente: !!q,
      qTexto: (document.querySelector('.q-enunciado')?.textContent||'').trim().slice(0,90),
      nOpciones: document.querySelectorAll('.q-opciones button').length,
      manipPresente: !!manip,
      opcionRect: r(opt), opcionVisible: dentro(opt),
      manipRect: r(manip), manipVisible: dentro(manip),
      qRect: r(q),
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      innerW: innerWidth, innerH: innerHeight,
      intenciones: [...document.querySelectorAll('.dock-acciones button')].map(b=>b.textContent.trim()),
      playTxt: document.getElementById('play')?.textContent?.trim(),
      reloj: document.getElementById('reloj')?.textContent?.trim(),
      grafico: JSON.stringify(window.__tutoria.estado()).slice(0,300),
      dockMsgs: [...document.querySelectorAll('.dock-body .msg')].map(m=>m.textContent.trim().slice(0,60)),
    };
  });
  console.log('== '+label+' ==');
  console.log(JSON.stringify(s));
  await page.screenshot({path: `${OUT}/${label}.png`});
  return s;
};

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const dur = await page.evaluate(()=>window.__tutoria.media.duration());
console.log('duracion', dur);
await snap('00-carga-limpia');

await page.evaluate((dur)=>{ window.__tutoria.media.seek(dur-1.2); return window.__tutoria.media.play(); }, dur);
// esperar a que aparezca una pregunta de practica
await page.waitForSelector('.q', {timeout: 30000});
await page.waitForTimeout(1200);
const antes = await snap('01-practica-abierta');

// pulsar "Listo, sigamos"
const btn = page.locator('.dock-acciones button', {hasText:'Listo, sigamos'});
console.log('botones intencion visibles:', await page.locator('.dock-acciones button').count());
await btn.click();
await page.waitForTimeout(2500);
const despues = await snap('02-tras-listo');

// seguir mirando: la pregunta responde todavia?
const vivo = await page.evaluate(()=> {
  const b = document.querySelector('.q-opciones button');
  return {qEnDom: !!document.querySelector('.q'), botonClicable: !!b, offsetParent: b? b.offsetParent!==null : null};
});
console.log('vivo:', JSON.stringify(vivo));
await browser.close();
