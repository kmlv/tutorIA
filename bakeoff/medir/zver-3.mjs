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
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERROR:', m.text().slice(0,160)); });
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe-v';
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(3000);
await page.click('.q-opciones button:nth-child(1)');
await page.waitForSelector('.q-manip', {timeout:8000});
await page.waitForTimeout(1200);

const snap = async (tag) => {
  const info = await page.evaluate(() => {
    const cm = document.querySelector('.capa-manip');
    const tir = cm ? [...cm.querySelectorAll('circle.tirador')].map(e=>{const r=e.getBoundingClientRect();return {cx:Math.round(r.x+r.width/2), cy:Math.round(r.y+r.height/2)};}) : [];
    const dock = document.querySelector('.dock');
    const est = window.__tutoria.estado ? window.__tutoria.estado() : null;
    return {
      t:+window.__tutoria.media.currentTime().toFixed(2),
      dockActual: window.__tutoria.dock?.actual ?? null,
      dockVisible: dock ? (dock.offsetParent!==null) : false,
      dockRect: dock ? (()=>{const r=dock.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};})() : null,
      ownsStage: window.__tutoria.media.ownsStage,
      qManip: !!document.querySelector('.q-manip'),
      qManipVisible: (()=>{const e=document.querySelector('.q-manip'); return e? e.offsetParent!==null : false;})(),
      listoVisible: (()=>{const b=[...document.querySelectorAll('.q-manip button')].find(x=>/Listo/i.test(x.textContent)); return b? b.offsetParent!==null : false;})(),
      tiradores: tir,
      ejes: document.querySelectorAll('.lienzo .eje, .lienzo [class*=eje]').length,
      lineas: document.querySelectorAll('.lienzo line, .lienzo path, .lienzo polyline').length,
      lienzoLen: (document.querySelector('.lienzo')?.innerHTML||'').length,
      estado: est ? JSON.stringify(est).slice(0,200) : null,
    };
  });
  console.log('=== '+tag+' '+JSON.stringify(info));
  return info;
};
console.log('ANTES DE SEGUIR'); await snap('pre');
await page.click('#play');
await page.waitForTimeout(2200);
const a = await snap('t2'); await page.screenshot({path:path.join(OUT,'x-t2.png')});

// intentar arrastrar un tirador
if (a.tiradores.length) {
  const h = a.tiradores[0];
  await page.mouse.move(h.cx, h.cy); await page.mouse.down();
  await page.mouse.move(h.cx-120, h.cy-80, {steps:12}); await page.mouse.up();
  await page.waitForTimeout(500);
  console.log('TRAS ARRASTRAR'); await snap('tras-drag'); await page.screenshot({path:path.join(OUT,'x-tras-drag.png')});
}
// dejar correr
await page.waitForTimeout(6000); await snap('t~9'); await page.screenshot({path:path.join(OUT,'x-t9.png')});
await page.waitForTimeout(10000); await snap('t~19'); await page.screenshot({path:path.join(OUT,'x-t19.png')});
// pausar
await page.click('#play'); await page.waitForTimeout(800); await snap('pausado'); await page.screenshot({path:path.join(OUT,'x-pausado.png')});
await browser.close();
