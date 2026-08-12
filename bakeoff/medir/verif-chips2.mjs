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
const reqs = [];
page.on('request', r => reqs.push(r.method()+' '+r.url().replace('http://localhost:57330','')));
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// ---- A) dock abierto SIN pregunta: boton "Preguntar" (#ask) al inicio
await page.click('#ask');
await page.waitForTimeout(500);
console.log('A) dock=', await page.evaluate('window.__tutoria.dock.actual'),
            ' chips=', JSON.stringify(await page.$$eval('.dock-acciones button', b=>b.map(x=>x.textContent.trim()))));
let n0 = reqs.length;
await page.click('.dock-acciones button:text-is("No entiendo")');
await page.waitForTimeout(6000);
console.log('A) tras chip sin pregunta -> reqs:', JSON.stringify(reqs.slice(n0)));
console.log('A) historial:', JSON.stringify(await page.$$eval('.dock-body .msg', p=>p.map(x=>x.className+'::'+x.textContent.trim()))));

// ---- B) composer texto libre en el mismo sitio
n0 = reqs.length;
await page.fill('.composer-input', '¿Cual es la respuesta correcta?');
await page.click('.composer-enviar');
await page.waitForTimeout(12000);
console.log('B) tras composer -> reqs:', JSON.stringify(reqs.slice(n0)));
console.log('B) historial:', JSON.stringify(await page.$$eval('.dock-body .msg', p=>p.map(x=>x.className+'::'+x.textContent.trim().slice(0,120)))));

// ---- C) ir a la prediccion y probar "Listo, sigamos"
await page.evaluate('window.__tutoria.media.seek(84); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:30000});
console.log('C) reloj=', await page.evaluate('document.getElementById("reloj").textContent'),
            'paused=', await page.evaluate('window.__tutoria.media.paused()'));
n0 = reqs.length;
await page.click('.dock-acciones button:text-is("Listo, sigamos")');
await page.waitForTimeout(3000);
console.log('C) tras Listo -> reqs:', JSON.stringify(reqs.slice(n0)));
console.log('C) paused=', await page.evaluate('window.__tutoria.media.paused()'),
            ' t=', await page.evaluate('window.__tutoria.media.currentTime()'),
            ' dock=', await page.evaluate('window.__tutoria.dock.actual'));
console.log('C) historial:', JSON.stringify(await page.$$eval('.dock-body .msg', p=>p.map(x=>x.className+'::'+x.textContent.trim().slice(0,120)))));
console.log('C) sigue la pregunta en el DOM?', await page.evaluate('!!document.querySelector(".q")'),
            ' visible?', await page.evaluate('(()=>{const q=document.querySelector(".q"); if(!q) return null; const r=q.getBoundingClientRect(); return r.width>0&&r.height>0;})()'));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-chips-listo.png'});
await browser.close();
