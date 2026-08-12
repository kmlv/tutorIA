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

// Solo avanzar: un unico seek hacia delante desde 0, luego reproducir sin retroceder.
await page.evaluate(() => window.__tutoria.media.seek(178));
await page.waitForTimeout(400);
const boton = await page.locator('#play').innerText().catch(()=>'?');
console.log('texto del boton play:', JSON.stringify(boton));
await page.click('#play');
await page.waitForTimeout(300);

const snap = () => page.evaluate(() => {
  const q = s => { const e=document.querySelector(s); return e? e.innerText.replace(/\s+/g,' ').trim() : null; };
  const est = window.__tutoria.estado();
  return {
    t: +window.__tutoria.media.currentTime().toFixed(1),
    paused: window.__tutoria.media.paused(),
    eq: q('.eq-slot'),
    precio1: q('.card[data-good="g1"] .price'),
    precio2: q('.card[data-good="g2"] .price'),
    p1: est.p1, p2: est.p2, m: est.m,
    lienzo: q('.lienzo'),
    cap: (q('.captions-band')||'').slice(0,90),
  };
});
const rows = [];
for (let i=0;i<58;i++){
  const s = await snap();
  rows.push(s);
  console.log(`t=${String(s.t).padStart(6)} paused=${s.paused?1:0} | eq="${s.eq}" | ficha1=${s.precio1} ficha2=${s.precio2} | estado p1=${s.p1} p2=${s.p2} m=${s.m} | lienzo="${s.lienzo}"`);
  if (s.t > 231) break;
  await page.waitForTimeout(1000);
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-recapB-final.png'});
fs.writeFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-recapB.json', JSON.stringify(rows,null,1));
await browser.close();
