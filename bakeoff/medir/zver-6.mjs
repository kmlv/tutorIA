import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe-v';
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(3000);
await page.click('.q-opciones button:nth-child(1)');
await page.waitForSelector('.q-manip', {timeout:8000});
await page.waitForTimeout(1200);
await page.click('#play'); await page.waitForTimeout(2200);
// arrastrar a ciegas hacia abajo-izquierda (respuesta MAL: recta hacia adentro)
const h = await page.evaluate(()=>{const e=document.querySelector('.capa-manip circle.tirador'); const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
console.log('tirador en', h);
await page.mouse.move(h.x,h.y); await page.mouse.down();
await page.mouse.move(h.x-200,h.y+60,{steps:15}); await page.mouse.up();
await page.waitForTimeout(600);
// recuperar el dock
await page.click('#ask'); await page.waitForTimeout(1200);
await page.screenshot({path:path.join(OUT,'z-dock-recuperado.png')});
const listo = await page.$$('.q-manip button');
for (const b of listo){ const t=(await b.textContent()).trim(); if(/Listo/i.test(t)){ await b.click(); break; } }
await page.waitForTimeout(2500);
await page.screenshot({path:path.join(OUT,'z-tras-listo.png')});
const txt = await page.evaluate(()=>[...document.querySelectorAll('.dock *')].map(e=>e.childElementCount===0?e.textContent.trim():'').filter(Boolean).slice(-14));
console.log(JSON.stringify(txt,null,1));
await browser.close();
